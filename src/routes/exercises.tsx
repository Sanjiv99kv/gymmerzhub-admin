import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Badge,
  Button,
  EmptyState,
  Input,
  Panel,
  Select,
  StatusBadge,
  Table,
  Td,
  Tr,
  PageHeader,
} from "@/components/admin/ui";
import {
  createAdminExercise,
  EXERCISE_EQUIPMENT,
  EXERCISE_EQUIPMENT_LABELS,
  EXERCISE_LEVEL_LABELS,
  EXERCISE_LEVELS,
  exerciseEquipmentLabel,
  fetchAdminExerciseSummary,
  fetchAdminExercises,
  updateAdminExercise,
  uploadAdminExerciseMedia,
  type AdminExercise,
  type AdminExerciseSummary,
  type CreateAdminExercise,
  type ExerciseEquipment,
  type ExerciseLevel,
  type ExerciseStatus,
  type ListAdminExercisesQuery,
} from "@/lib/admin-exercises";
import type { PaginationMeta } from "@/lib/admin-gyms";
import { ApiError, formatApiError } from "@/lib/api";
import { clearAdminSession } from "@/lib/admin-auth";
import {
  collectExerciseMedia,
  ExerciseMediaButton,
} from "@/components/admin/exercise-media-gallery";
import {
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  Leaf,
  Library,
  Loader2,
  Pencil,
  Plus,
  Search,
  Upload,
  Video,
  X,
} from "lucide-react";
import { toast } from "sonner";

const MAX_MEDIA_URLS = 12;

export const Route = createFileRoute("/exercises")({
  head: () => ({ meta: [{ title: "Exercise Catalog · GymmerzHub Admin" }] }),
  component: ExercisesPage,
});

type Filters = {
  q: string;
  status: "" | ExerciseStatus;
  level: "" | ExerciseLevel;
  equipment: "" | ExerciseEquipment;
};

type ExerciseForm = {
  name: string;
  muscleGroup: string;
  equipment: "" | ExerciseEquipment;
  level: "" | ExerciseLevel;
  instructions: string;
  notes: string;
  imageUrls: string[];
  videoUrls: string[];
  status: ExerciseStatus;
};

const EMPTY_FILTERS: Filters = { q: "", status: "", level: "", equipment: "" };
const EMPTY_FORM: ExerciseForm = {
  name: "",
  muscleGroup: "",
  equipment: "",
  level: "",
  instructions: "",
  notes: "",
  imageUrls: [],
  videoUrls: [],
  status: "active",
};
const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;
const DEFAULT_PAGE_SIZE = 10;

const LEVEL_TONE: Record<ExerciseLevel, "success" | "info" | "warn"> = {
  beginner: "success",
  intermediate: "info",
  advanced: "warn",
};

function useDebouncedValue(value: string, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function pageItems(current: number, totalPages: number): Array<number | "ellipsis"> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const items: Array<number | "ellipsis"> = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(totalPages - 1, current + 1);
  if (start > 2) items.push("ellipsis");
  for (let p = start; p <= end; p++) items.push(p);
  if (end < totalPages - 1) items.push("ellipsis");
  items.push(totalPages);
  return items;
}

function formFromItem(item: AdminExercise): ExerciseForm {
  const equipment =
    item.equipment && EXERCISE_EQUIPMENT.includes(item.equipment as ExerciseEquipment)
      ? (item.equipment as ExerciseEquipment)
      : "";
  return {
    name: item.name,
    muscleGroup: item.muscleGroup ?? "",
    equipment,
    level: item.level ?? "",
    instructions: item.instructions ?? "",
    notes: item.notes ?? "",
    imageUrls: item.imageUrls?.length
      ? [...item.imageUrls]
      : item.imageUrl
        ? [item.imageUrl]
        : [],
    videoUrls: item.videoUrls?.length
      ? [...item.videoUrls]
      : item.videoUrl
        ? [item.videoUrl]
        : [],
    status: item.status,
  };
}

function ExercisesPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);
  const [items, setItems] = useState<AdminExercise[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [summary, setSummary] = useState<AdminExerciseSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AdminExercise | null>(null);
  const [form, setForm] = useState<ExerciseForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingKind, setUploadingKind] = useState<"image" | "video" | null>(null);
  const [pasteImageUrl, setPasteImageUrl] = useState("");
  const [pasteVideoUrl, setPasteVideoUrl] = useState("");
  const imageFileRef = useRef<HTMLInputElement>(null);
  const videoFileRef = useRef<HTMLInputElement>(null);

  const debouncedQ = useDebouncedValue(filters.q);
  const query = useMemo<ListAdminExercisesQuery>(
    () => ({
      q: debouncedQ.trim() || undefined,
      status: filters.status || undefined,
      level: filters.level || undefined,
      equipment: filters.equipment || undefined,
      page,
      pageSize,
    }),
    [debouncedQ, filters.equipment, filters.level, filters.status, page, pageSize],
  );

  const filterKey = `${debouncedQ}|${filters.status}|${filters.level}|${filters.equipment}`;
  const filtersRef = useRef(filterKey);
  const filtersChanged = filtersRef.current !== filterKey;
  if (filtersChanged) filtersRef.current = filterKey;

  useEffect(() => {
    if (filtersChanged && page !== 1) setPage(1);
  }, [filtersChanged, page]);

  const handleAuthError = useCallback(
    (err: unknown) => {
      if (err instanceof ApiError && err.status === 401) {
        clearAdminSession();
        toast.error("Session expired. Please sign in again.");
        navigate({ to: "/login" });
        return true;
      }
      return false;
    },
    [navigate],
  );

  const loadSummary = useCallback(async () => {
    try {
      setSummary(await fetchAdminExerciseSummary());
    } catch (err) {
      if (handleAuthError(err)) return;
    }
  }, [handleAuthError]);

  const loadExercises = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchAdminExercises(query);
      setItems(list.items);
      setPagination(list.pagination);
    } catch (err) {
      if (handleAuthError(err)) return;
      const message = formatApiError(err, "Could not load exercise catalog");
      setError(message);
      setItems([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [handleAuthError, query]);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    if (filtersChanged && page !== 1) return;
    void loadExercises();
  }, [filtersChanged, loadExercises, page]);

  function patchFilter<K extends keyof Filters>(key: K, value: Filters[K]) {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
  }

  function changePageSize(next: number) {
    setPageSize(next);
    setPage(1);
  }

  function patchForm<K extends keyof ExerciseForm>(key: K, value: ExerciseForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function openCreate() {
    setEditingItem(null);
    setForm(EMPTY_FORM);
    setPasteImageUrl("");
    setPasteVideoUrl("");
    setDrawerOpen(true);
  }

  function openEdit(item: AdminExercise) {
    setEditingItem(item);
    setForm(formFromItem(item));
    setPasteImageUrl("");
    setPasteVideoUrl("");
    setDrawerOpen(true);
  }

  function closeDrawer() {
    if (submitting || uploadingKind) return;
    setDrawerOpen(false);
    setEditingItem(null);
    setForm(EMPTY_FORM);
    setPasteImageUrl("");
    setPasteVideoUrl("");
  }

  function addMediaUrl(kind: "image" | "video", url: string) {
    const key = kind === "image" ? "imageUrls" : "videoUrls";
    setForm((current) => {
      const list = current[key];
      if (list.length >= MAX_MEDIA_URLS) {
        toast.error(`You can add up to ${MAX_MEDIA_URLS} ${kind}s.`);
        return current;
      }
      if (list.includes(url)) return current;
      return { ...current, [key]: [...list, url] };
    });
  }

  function removeMediaUrl(kind: "image" | "video", index: number) {
    const key = kind === "image" ? "imageUrls" : "videoUrls";
    setForm((current) => ({
      ...current,
      [key]: current[key].filter((_, i) => i !== index),
    }));
  }

  function addPastedUrl(kind: "image" | "video") {
    const raw = kind === "image" ? pasteImageUrl : pasteVideoUrl;
    const url = raw.trim();
    if (!url) {
      toast.error("Paste a URL first.");
      return;
    }
    try {
      new URL(url);
    } catch {
      toast.error("Enter a valid URL.");
      return;
    }
    addMediaUrl(kind, url);
    if (kind === "image") setPasteImageUrl("");
    else setPasteVideoUrl("");
  }

  async function onMediaFileSelected(kind: "image" | "video", file: File | undefined) {
    if (!file) return;
    const key = kind === "image" ? "imageUrls" : "videoUrls";
    if (form[key].length >= MAX_MEDIA_URLS) {
      toast.error(`You can add up to ${MAX_MEDIA_URLS} ${kind}s.`);
      return;
    }
    setUploadingKind(kind);
    try {
      const media = await uploadAdminExerciseMedia(file);
      if (media.kind !== kind) {
        toast.error(`Upload a ${kind} file.`);
        return;
      }
      addMediaUrl(kind, media.url);
      toast.success(`${kind === "image" ? "Image" : "Video"} uploaded.`);
    } catch (err) {
      toast.error(formatApiError(err, `Could not upload ${kind}`));
    } finally {
      setUploadingKind(null);
    }
  }

  async function submitExercise(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.name.trim()) {
      toast.error("Add an exercise name.");
      return;
    }
    if (uploadingKind) {
      toast.error("Wait for the upload to finish.");
      return;
    }

    const body: CreateAdminExercise = {
      name: form.name.trim(),
      muscleGroup: form.muscleGroup.trim() || null,
      equipment: form.equipment || null,
      level: form.level || null,
      instructions: form.instructions.trim() || null,
      notes: form.notes.trim() || null,
      imageUrls: form.imageUrls,
      videoUrls: form.videoUrls,
      status: form.status,
    };

    setSubmitting(true);
    try {
      if (editingItem) {
        await updateAdminExercise(editingItem.id, body);
        toast.success(`${body.name} updated.`);
      } else {
        await createAdminExercise(body);
        toast.success(`${body.name} added to the exercise catalog.`);
        setPage(1);
      }
      setDrawerOpen(false);
      setEditingItem(null);
      setForm(EMPTY_FORM);
      setPasteImageUrl("");
      setPasteVideoUrl("");
      await Promise.all([loadExercises(), loadSummary()]);
    } catch (err) {
      toast.error(
        formatApiError(
          err,
          editingItem ? "Could not update exercise" : "Could not create exercise",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  const hasFilters = Boolean(filters.q || filters.status || filters.level || filters.equipment);
  const rangeStart =
    pagination && pagination.total > 0 ? (pagination.page - 1) * pagination.pageSize + 1 : 0;
  const rangeEnd = pagination
    ? Math.min(pagination.page * pagination.pageSize, pagination.total)
    : 0;
  const totalPages = Math.max(1, pagination?.totalPages ?? 1);
  const pages = pagination ? pageItems(pagination.page, totalPages) : [];
  const stats = [
    {
      label: "Catalog items",
      value: summary?.total ?? "—",
      hint: hasFilters ? `${pagination?.total ?? 0} matching filters` : "All exercises",
      icon: Library,
      accent: "text-foreground",
      wrap: "border-border bg-panel-2 text-muted-foreground",
    },
    {
      label: "Active",
      value: summary?.active ?? "—",
      hint: "Available in templates",
      icon: Leaf,
      accent: "text-lime",
      wrap: "border-lime/25 bg-lime/15 text-lime",
    },
    {
      label: "Inactive",
      value: summary?.inactive ?? "—",
      hint: "Hidden from new plans",
      icon: X,
      accent: "text-red-300",
      wrap: "border-red-500/25 bg-red-500/10 text-red-300",
    },
    {
      label: "With video",
      value: summary?.withVideo ?? "—",
      hint: "Demo clip attached",
      icon: Video,
      accent: "text-sky-300",
      wrap: "border-sky-500/25 bg-sky-500/10 text-sky-300",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Exercise Catalog"
        subtitle="Maintain the movement library used to build every workout template."
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add exercise
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="rounded-xl border border-border/80 bg-panel p-4 ring-1 ring-white/[0.04] shadow-[0_12px_32px_-14px_rgba(0,0,0,0.8)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    {stat.label}
                  </div>
                  <div
                    className={`mt-2 text-2xl font-semibold tracking-tight tabular-nums md:text-[1.75rem] ${stat.accent}`}
                  >
                    {stat.value}
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground">{stat.hint}</div>
                </div>
                <span
                  className={`grid h-9 w-9 place-items-center rounded-lg border shadow-inner ${stat.wrap}`}
                >
                  <Icon className="h-4 w-4" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <Panel className="border-border/70 bg-panel-2/40">
        <div className="space-y-4 p-5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Filters
            </span>
            {hasFilters && (
              <Button size="sm" variant="ghost" onClick={() => setFilters(EMPTY_FILTERS)}>
                Clear filters
              </Button>
            )}
          </div>
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_11rem_10rem_10rem]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={filters.q}
                onChange={(event) => patchFilter("q", event.target.value)}
                placeholder="Search by name or muscle…"
                className="h-11 w-full rounded-lg pl-10 text-[15px]"
              />
            </div>
            <Select
              value={filters.equipment}
              onChange={(event) =>
                patchFilter("equipment", event.target.value as Filters["equipment"])
              }
              className="h-11 w-full rounded-lg"
              aria-label="Filter by equipment"
            >
              <option value="">All equipment</option>
              {EXERCISE_EQUIPMENT.map((value) => (
                <option key={value} value={value}>
                  {EXERCISE_EQUIPMENT_LABELS[value]}
                </option>
              ))}
            </Select>
            <Select
              value={filters.level}
              onChange={(event) => patchFilter("level", event.target.value as Filters["level"])}
              className="h-11 w-full rounded-lg"
              aria-label="Filter by level"
            >
              <option value="">All levels</option>
              {EXERCISE_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {EXERCISE_LEVEL_LABELS[level]}
                </option>
              ))}
            </Select>
            <Select
              value={filters.status}
              onChange={(event) => patchFilter("status", event.target.value as Filters["status"])}
              className="h-11 w-full rounded-lg"
              aria-label="Filter by status"
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </div>
        </div>
      </Panel>

      <Panel className="border-border/80 shadow-[0_16px_40px_-16px_rgba(0,0,0,0.85)]">
        <div className="relative min-h-[320px]">
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-panel/75 backdrop-blur-[1px]">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-lime" aria-label="Loading exercises" />
                <div className="text-xs text-muted-foreground">Loading exercises…</div>
              </div>
            </div>
          )}
          {!loading && error && (
            <EmptyState
              title="Couldn’t load the exercise catalog"
              hint={error}
              action={
                <Button size="sm" variant="secondary" onClick={() => void loadExercises()}>
                  Retry
                </Button>
              }
            />
          )}
          {!loading && !error && !items.length && (
            <EmptyState
              title="No exercises found"
              hint={
                hasFilters
                  ? "Try clearing filters or broadening your search."
                  : "Add your first exercise to start building workout templates."
              }
              action={
                hasFilters ? (
                  <Button size="sm" variant="secondary" onClick={() => setFilters(EMPTY_FILTERS)}>
                    Clear filters
                  </Button>
                ) : (
                  <Button size="sm" onClick={openCreate}>
                    Add exercise
                  </Button>
                )
              }
            />
          )}
          {!error && items.length > 0 && (
            <Table
              head={["Exercise", "Media", "Muscle group", "Equipment", "Level", "Status", "Actions"]}
            >
              {items.map((item) => (
                <Tr key={item.id}>
                  <Td>
                    <button
                      type="button"
                      onClick={() => openEdit(item)}
                      className="text-left font-medium transition-colors hover:text-lime"
                    >
                      {item.name}
                    </button>
                    {item.notes ? (
                      <div className="mt-0.5 max-w-56 truncate text-[11px] text-muted-foreground">
                        {item.notes}
                      </div>
                    ) : null}
                  </Td>
                  <Td>
                    <ExerciseMediaButton
                      items={collectExerciseMedia(item)}
                      exerciseName={item.name}
                    />
                  </Td>
                  <Td className="text-muted-foreground">{item.muscleGroup || "—"}</Td>
                  <Td className="text-muted-foreground">
                    {exerciseEquipmentLabel(item.equipment)}
                  </Td>
                  <Td>
                    {item.level ? (
                      <Badge tone={LEVEL_TONE[item.level]}>
                        {EXERCISE_LEVEL_LABELS[item.level]}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </Td>
                  <Td>
                    <StatusBadge status={item.status} />
                  </Td>
                  <Td>
                    <div className="inline-flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => openEdit(item)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </Button>
                    </div>
                  </Td>
                </Tr>
              ))}
            </Table>
          )}
        </div>
        {pagination && pagination.total > 0 && (
          <div className="flex flex-col gap-3 border-t border-border px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="whitespace-nowrap">Rows per page</span>
                <Select
                  value={String(pageSize)}
                  onChange={(e) => changePageSize(Number(e.target.value))}
                  className="h-8 w-[4.5rem]"
                  aria-label="Rows per page"
                  disabled={loading}
                >
                  {PAGE_SIZE_OPTIONS.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </Select>
              </label>
              <div className="hidden h-4 w-px bg-border sm:block" />
              <div className="text-xs tabular-nums text-muted-foreground">
                <span className="font-medium text-foreground">
                  {rangeStart}–{rangeEnd}
                </span>{" "}
                of <span className="font-medium text-foreground">{pagination.total}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={loading || !pagination.hasPrev}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Prev
              </Button>

              {totalPages > 1 ? (
                <div className="flex items-center gap-1">
                  {pages.map((item, idx) =>
                    item === "ellipsis" ? (
                      <span
                        key={`e-${idx}`}
                        className="px-1 text-xs text-muted-foreground"
                        aria-hidden
                      >
                        …
                      </span>
                    ) : (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setPage(item)}
                        aria-label={`Page ${item}`}
                        aria-current={item === pagination.page ? "page" : undefined}
                        disabled={loading}
                        className={`inline-flex h-8 min-w-8 cursor-pointer items-center justify-center rounded-md px-2 text-xs font-medium tabular-nums transition-colors ${
                          item === pagination.page
                            ? "bg-lime text-lime-foreground"
                            : "border border-border bg-panel-2 text-muted-foreground hover:bg-accent hover:text-foreground"
                        }`}
                      >
                        {item}
                      </button>
                    ),
                  )}
                </div>
              ) : (
                <div className="min-w-[5.5rem] text-center text-xs font-medium tabular-nums text-muted-foreground">
                  Page {pagination.page} of {totalPages}
                </div>
              )}

              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={loading || !pagination.hasNext}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </Panel>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/55 backdrop-blur-sm">
          <form
            onSubmit={submitExercise}
            className="flex h-full w-full max-w-xl flex-col border-l border-border bg-background shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-border px-6 py-5">
              <div>
                <h2 className="text-lg font-semibold">
                  {editingItem ? "Edit exercise" : "Add exercise"}
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Movements used across workout templates.
                </p>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={closeDrawer}>
                <X className="h-4 w-4" /> Close
              </Button>
            </div>
            <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
              <FormSection title="Exercise details">
                <Field label="Exercise name">
                  <Input
                    required
                    value={form.name}
                    onChange={(event) => patchForm("name", event.target.value)}
                    placeholder="e.g. Barbell Back Squat"
                    className="w-full"
                  />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Muscle group · optional">
                    <Input
                      value={form.muscleGroup}
                      onChange={(event) => patchForm("muscleGroup", event.target.value)}
                      placeholder="Quads"
                      className="w-full"
                    />
                  </Field>
                  <Field label="Equipment · optional">
                    <Select
                      value={form.equipment}
                      onChange={(event) =>
                        patchForm("equipment", event.target.value as ExerciseForm["equipment"])
                      }
                      className="h-9 w-full"
                    >
                      <option value="">Not set</option>
                      {EXERCISE_EQUIPMENT.map((value) => (
                        <option key={value} value={value}>
                          {EXERCISE_EQUIPMENT_LABELS[value]}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Level · optional">
                    <Select
                      value={form.level}
                      onChange={(event) =>
                        patchForm("level", event.target.value as ExerciseForm["level"])
                      }
                      className="h-9 w-full"
                    >
                      <option value="">Not set</option>
                      {EXERCISE_LEVELS.map((level) => (
                        <option key={level} value={level}>
                          {EXERCISE_LEVEL_LABELS[level]}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Status">
                    <Select
                      value={form.status}
                      onChange={(event) =>
                        patchForm("status", event.target.value as ExerciseStatus)
                      }
                      className="h-9 w-full"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </Select>
                  </Field>
                </div>
              </FormSection>
              <FormSection title="Coaching">
                <Field label="Instructions · optional">
                  <textarea
                    value={form.instructions}
                    onChange={(event) => patchForm("instructions", event.target.value)}
                    rows={4}
                    className="w-full rounded-md border border-border bg-panel-2 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-lime"
                    placeholder="Brace core, sit back, drive through heels."
                  />
                </Field>
                <Field label="Notes · optional">
                  <textarea
                    value={form.notes}
                    onChange={(event) => patchForm("notes", event.target.value)}
                    rows={2}
                    className="w-full rounded-md border border-border bg-panel-2 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-lime"
                    placeholder="Internal admin notes"
                  />
                </Field>
              </FormSection>
              <FormSection title="Media">
                <div className="space-y-4">
                  <MediaBlock
                    label="Images"
                    hint={`${form.imageUrls.length}/${MAX_MEDIA_URLS} · ≤5MB`}
                    count={form.imageUrls.length}
                    uploading={uploadingKind === "image"}
                    disabled={submitting || uploadingKind !== null}
                    fileRef={imageFileRef}
                    accept="image/jpeg,image/png,image/webp"
                    pasteValue={pasteImageUrl}
                    pastePlaceholder="Paste image URL"
                    onPasteChange={setPasteImageUrl}
                    onUploadClick={() => imageFileRef.current?.click()}
                    onFileChange={(file) => void onMediaFileSelected("image", file)}
                    onAddPaste={() => addPastedUrl("image")}
                  >
                    {form.imageUrls.length > 0 && (
                      <ul className="flex flex-wrap gap-1.5">
                        {form.imageUrls.map((url, index) => (
                          <li
                            key={`img-${index}-${url}`}
                            className="group relative h-14 w-14 overflow-hidden rounded border border-border bg-panel-2"
                          >
                            <img src={url} alt="" className="h-full w-full object-cover" />
                            {index === 0 && (
                              <span className="absolute inset-x-0 bottom-0 bg-black/65 py-px text-center text-[8px] font-semibold uppercase tracking-wide text-white">
                                Cover
                              </span>
                            )}
                            <button
                              type="button"
                              className="absolute right-0.5 top-0.5 grid h-4 w-4 place-items-center rounded-full bg-black/75 text-white opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
                              onClick={() => removeMediaUrl("image", index)}
                              aria-label="Remove image"
                            >
                              <X className="h-2.5 w-2.5" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </MediaBlock>

                  <MediaBlock
                    label="Videos"
                    hint={`${form.videoUrls.length}/${MAX_MEDIA_URLS} · ≤50MB`}
                    count={form.videoUrls.length}
                    uploading={uploadingKind === "video"}
                    disabled={submitting || uploadingKind !== null}
                    fileRef={videoFileRef}
                    accept="video/mp4,video/webm"
                    pasteValue={pasteVideoUrl}
                    pastePlaceholder="YouTube, Vimeo, or MP4/WebM URL"
                    onPasteChange={setPasteVideoUrl}
                    onUploadClick={() => videoFileRef.current?.click()}
                    onFileChange={(file) => void onMediaFileSelected("video", file)}
                    onAddPaste={() => addPastedUrl("video")}
                    uploadKind="video"
                  >
                    {form.videoUrls.length > 0 && (
                      <ul className="space-y-1">
                        {form.videoUrls.map((url, index) => (
                          <li
                            key={`vid-${index}-${url}`}
                            className="flex items-center gap-2 rounded border border-border bg-panel-2 px-2 py-1"
                          >
                            <Video className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            <span className="min-w-0 flex-1 truncate text-[11px] text-foreground">
                              {mediaHostLabel(url)}
                            </span>
                            <button
                              type="button"
                              className="grid h-5 w-5 shrink-0 place-items-center rounded text-muted-foreground hover:bg-panel hover:text-foreground"
                              onClick={() => removeMediaUrl("video", index)}
                              aria-label="Remove video"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </MediaBlock>
                </div>
              </FormSection>
            </div>
            <div className="flex justify-end gap-3 border-t border-border px-6 py-4">
              <Button type="button" variant="secondary" onClick={closeDrawer}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting || uploadingKind !== null}>
                {(submitting || uploadingKind) && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingItem ? "Save changes" : "Add exercise"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {title}
      </h3>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex min-w-0 flex-col gap-1.5">
      <span className="block text-xs font-medium text-muted-foreground">{label}</span>
      <div className="min-w-0 w-full">{children}</div>
    </label>
  );
}

function mediaHostLabel(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function MediaBlock({
  label,
  hint,
  count,
  uploading,
  disabled,
  fileRef,
  accept,
  pasteValue,
  pastePlaceholder,
  onPasteChange,
  onUploadClick,
  onFileChange,
  onAddPaste,
  uploadKind = "image",
  children,
}: {
  label: string;
  hint: string;
  count: number;
  uploading: boolean;
  disabled: boolean;
  fileRef: React.RefObject<HTMLInputElement | null>;
  accept: string;
  pasteValue: string;
  pastePlaceholder: string;
  onPasteChange: (value: string) => void;
  onUploadClick: () => void;
  onFileChange: (file: File | undefined) => void;
  onAddPaste: () => void;
  uploadKind?: "image" | "video";
  children?: React.ReactNode;
}) {
  const atLimit = count >= MAX_MEDIA_URLS;
  const [dragging, setDragging] = useState(false);
  const locked = disabled || atLimit;

  function acceptDrop(event: React.DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    setDragging(false);
    if (locked) return;
    onFileChange(event.dataTransfer.files?.[0]);
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span className="text-[11px] text-muted-foreground/80">{hint}</span>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(event) => {
          onFileChange(event.target.files?.[0]);
          event.target.value = "";
        }}
      />

      <div
        onDragEnter={(event) => {
          event.preventDefault();
          if (!locked) setDragging(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          if (!locked) setDragging(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setDragging(false);
        }}
        onDrop={acceptDrop}
        className={`flex gap-1.5 rounded-md border border-dashed p-1 transition-colors ${
          dragging ? "border-lime/60 bg-lime/5" : "border-border"
        }`}
      >
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="h-8 shrink-0 px-2.5"
          disabled={locked}
          onClick={onUploadClick}
        >
          {uploading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : uploadKind === "video" ? (
            <Upload className="h-3.5 w-3.5" />
          ) : (
            <ImagePlus className="h-3.5 w-3.5" />
          )}
          {uploading ? "…" : "Upload"}
        </Button>
        <Input
          value={pasteValue}
          onChange={(event) => onPasteChange(event.target.value)}
          placeholder={dragging ? "Drop file here" : pastePlaceholder}
          disabled={locked}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              onAddPaste();
            }
          }}
          className="h-8 min-w-0 flex-1 text-xs"
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="h-8 shrink-0 px-2.5"
          disabled={locked || !pasteValue.trim()}
          onClick={onAddPaste}
        >
          Add
        </Button>
      </div>

      {children}
    </div>
  );
}
