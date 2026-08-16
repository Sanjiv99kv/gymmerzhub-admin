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
  createAdminFoodItem,
  fetchAdminFoodItemSummary,
  fetchAdminFoodItems,
  updateAdminFoodItem,
  uploadAdminFoodImage,
  type AdminFoodItem,
  type AdminFoodItemSummary,
  type CreateAdminFoodItem,
  type FoodDietType,
  type FoodItemStatus,
  type FoodServingUnit,
  type ListAdminFoodItemsQuery,
} from "@/lib/admin-food-items";
import type { PaginationMeta } from "@/lib/admin-gyms";
import { ApiError, formatApiError } from "@/lib/api";
import { clearAdminSession } from "@/lib/admin-auth";
import {
  Apple,
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  Leaf,
  Loader2,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/food-items")({
  head: () => ({ meta: [{ title: "Food Catalog · GymmerzHub Admin" }] }),
  component: FoodItemsPage,
});

type Filters = { q: string; status: "" | FoodItemStatus; dietType: "" | FoodDietType };
type FoodForm = {
  name: string;
  dietType: FoodDietType;
  servingUnit: FoodServingUnit;
  servingQty: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  fiber: string;
  allergens: string;
  notes: string;
  imageUrl: string;
  status: FoodItemStatus;
};

const EMPTY_FILTERS: Filters = { q: "", status: "", dietType: "" };
const EMPTY_FORM: FoodForm = {
  name: "",
  dietType: "veg",
  servingUnit: "g",
  servingQty: "100",
  calories: "",
  protein: "",
  carbs: "",
  fat: "",
  fiber: "",
  allergens: "",
  notes: "",
  imageUrl: "",
  status: "active",
};
const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;
const DEFAULT_PAGE_SIZE = 10;

const DIET_LABEL: Record<FoodDietType, string> = {
  veg: "Vegetarian",
  vegan: "Vegan",
  egg: "Egg",
  non_veg: "Non-veg",
};
const DIET_TONE: Record<FoodDietType, "success" | "info" | "warn" | "danger"> = {
  veg: "success",
  vegan: "info",
  egg: "warn",
  non_veg: "danger",
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

function labelForUnit(unit: FoodServingUnit) {
  return unit === "piece" ? "piece" : unit;
}

function formFromItem(item: AdminFoodItem): FoodForm {
  return {
    name: item.name,
    dietType: item.dietType,
    servingUnit: item.servingUnit,
    servingQty: String(item.servingQty),
    calories: String(item.calories),
    protein: String(item.protein),
    carbs: String(item.carbs),
    fat: String(item.fat),
    fiber: item.fiber == null ? "" : String(item.fiber),
    allergens: item.allergens.join(", "),
    notes: item.notes ?? "",
    imageUrl: item.imageUrl ?? "",
    status: item.status,
  };
}

function FoodItemsPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);
  const [items, setItems] = useState<AdminFoodItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [summary, setSummary] = useState<AdminFoodItemSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AdminFoodItem | null>(null);
  const [form, setForm] = useState<FoodForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [pasteImageUrl, setPasteImageUrl] = useState("");
  const imageFileRef = useRef<HTMLInputElement>(null);

  const debouncedQ = useDebouncedValue(filters.q);
  const query = useMemo<ListAdminFoodItemsQuery>(
    () => ({
      q: debouncedQ.trim() || undefined,
      status: filters.status || undefined,
      dietType: filters.dietType || undefined,
      page,
      pageSize,
    }),
    [debouncedQ, filters.dietType, filters.status, page, pageSize],
  );

  // Reset to page 1 when search/filters change; skip the list fetch until page is synced.
  const filterKey = `${debouncedQ}|${filters.status}|${filters.dietType}`;
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
      setSummary(await fetchAdminFoodItemSummary());
    } catch (err) {
      if (handleAuthError(err)) return;
    }
  }, [handleAuthError]);

  const loadFoods = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchAdminFoodItems(query);
      setItems(list.items);
      setPagination(list.pagination);
    } catch (err) {
      if (handleAuthError(err)) return;
      const message = formatApiError(err, "Could not load food catalog");
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
    void loadFoods();
  }, [filtersChanged, loadFoods, page]);

  function patchFilter<K extends keyof Filters>(key: K, value: Filters[K]) {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
  }

  function changePageSize(next: number) {
    setPageSize(next);
    setPage(1);
  }

  function patchForm<K extends keyof FoodForm>(key: K, value: FoodForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function openCreate() {
    setEditingItem(null);
    setForm(EMPTY_FORM);
    setPasteImageUrl("");
    setDrawerOpen(true);
  }

  function openEdit(item: AdminFoodItem) {
    setEditingItem(item);
    setForm(formFromItem(item));
    setPasteImageUrl("");
    setDrawerOpen(true);
  }

  function closeDrawer() {
    if (submitting || uploadingImage) return;
    setDrawerOpen(false);
    setEditingItem(null);
    setForm(EMPTY_FORM);
    setPasteImageUrl("");
  }

  async function onFoodImageSelected(file: File | undefined) {
    if (!file) return;
    setUploadingImage(true);
    try {
      const media = await uploadAdminFoodImage(file);
      patchForm("imageUrl", media.url);
      setPasteImageUrl("");
      toast.success("Image uploaded.");
    } catch (err) {
      toast.error(formatApiError(err, "Could not upload image"));
    } finally {
      setUploadingImage(false);
    }
  }

  function addPastedFoodImage() {
    const url = pasteImageUrl.trim();
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
    patchForm("imageUrl", url);
    setPasteImageUrl("");
  }

  async function submitFood(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (uploadingImage) {
      toast.error("Wait for the upload to finish.");
      return;
    }
    const numeric = (value: string) => Number(value);
    const calories = numeric(form.calories);
    const protein = numeric(form.protein);
    const carbs = numeric(form.carbs);
    const fat = numeric(form.fat);
    const servingQty = numeric(form.servingQty);
    if (!form.name.trim() || [calories, protein, carbs, fat, servingQty].some(Number.isNaN)) {
      toast.error("Add a name and valid serving and macro values.");
      return;
    }

    const body: CreateAdminFoodItem = {
      name: form.name.trim(),
      dietType: form.dietType,
      servingUnit: form.servingUnit,
      servingQty,
      calories,
      protein,
      carbs,
      fat,
      fiber: form.fiber === "" ? null : numeric(form.fiber),
      allergens: form.allergens
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
      notes: form.notes.trim() || null,
      imageUrl: form.imageUrl.trim() || null,
      status: form.status,
    };
    if (body.fiber != null && Number.isNaN(body.fiber)) {
      toast.error("Fiber must be a valid number.");
      return;
    }

    setSubmitting(true);
    try {
      if (editingItem) {
        await updateAdminFoodItem(editingItem.id, body);
        toast.success(`${body.name} updated.`);
      } else {
        await createAdminFoodItem(body);
        toast.success(`${body.name} added to the food catalog.`);
        setPage(1);
      }
      setDrawerOpen(false);
      setEditingItem(null);
      setForm(EMPTY_FORM);
      setPasteImageUrl("");
      await Promise.all([loadFoods(), loadSummary()]);
    } catch (err) {
      toast.error(
        formatApiError(
          err,
          editingItem ? "Could not update food item" : "Could not create food item",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  const hasFilters = Boolean(filters.q || filters.status || filters.dietType);
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
      hint: hasFilters ? `${pagination?.total ?? 0} matching filters` : "All foods",
      icon: Apple,
      accent: "text-foreground",
      wrap: "border-border bg-panel-2 text-muted-foreground",
    },
    {
      label: "Active",
      value: summary?.active ?? "—",
      hint: "Available in plans",
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
      label: "Avg. calories",
      value: summary ? `${summary.avgCalories}` : "—",
      hint: "Per serving across catalog",
      icon: SlidersHorizontal,
      accent: "text-sky-300",
      wrap: "border-sky-500/25 bg-sky-500/10 text-sky-300",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Food Catalog"
        subtitle="Maintain the nutrition library used to build every diet template."
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add food
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
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_10rem_10rem]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={filters.q}
                onChange={(event) => patchFilter("q", event.target.value)}
                placeholder="Search food name…"
                className="h-11 w-full rounded-lg pl-10 text-[15px]"
              />
            </div>
            <Select
              value={filters.dietType}
              onChange={(event) =>
                patchFilter("dietType", event.target.value as Filters["dietType"])
              }
              className="h-11 w-full rounded-lg"
              aria-label="Filter by diet type"
            >
              <option value="">All diets</option>
              {Object.entries(DIET_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
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
                <Loader2 className="h-8 w-8 animate-spin text-lime" aria-label="Loading food items" />
                <div className="text-xs text-muted-foreground">Loading food items…</div>
              </div>
            </div>
          )}
          {!loading && error && (
            <EmptyState
              title="Couldn’t load the food catalog"
              hint={error}
              action={
                <Button size="sm" variant="secondary" onClick={() => void loadFoods()}>
                  Retry
                </Button>
              }
            />
          )}
          {!loading && !error && !items.length && (
            <EmptyState
              title="No food items found"
              hint={
                hasFilters
                  ? "Try clearing filters or broadening your search."
                  : "Add your first food to start building diet plans."
              }
              action={
                hasFilters ? (
                  <Button size="sm" variant="secondary" onClick={() => setFilters(EMPTY_FILTERS)}>
                    Clear filters
                  </Button>
                ) : (
                  <Button size="sm" onClick={openCreate}>
                    Add food
                  </Button>
                )
              }
            />
          )}
          {!error && items.length > 0 && (
            <Table
              head={["Food", "Diet type", "Serving", "Macros", "Calories", "Status", "Actions"]}
            >
              {items.map((item) => (
                <Tr key={item.id}>
                  <Td>
                    <button
                      type="button"
                      onClick={() => openEdit(item)}
                      className="flex items-center gap-2.5 text-left font-medium transition-colors hover:text-lime"
                    >
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt=""
                          className="h-8 w-8 shrink-0 rounded object-cover"
                        />
                      ) : (
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded bg-panel-2 text-muted-foreground">
                          <Apple className="h-3.5 w-3.5" />
                        </span>
                      )}
                      <span className="min-w-0">
                        <span className="block truncate">{item.name}</span>
                        {item.notes && (
                          <span className="mt-0.5 block max-w-56 truncate text-[11px] font-normal text-muted-foreground">
                            {item.notes}
                          </span>
                        )}
                      </span>
                    </button>
                  </Td>
                  <Td>
                    <Badge tone={DIET_TONE[item.dietType]}>{DIET_LABEL[item.dietType]}</Badge>
                  </Td>
                  <Td className="text-muted-foreground tabular-nums">
                    {item.servingQty} {labelForUnit(item.servingUnit)}
                  </Td>
                  <Td className="whitespace-nowrap text-xs tabular-nums text-muted-foreground">
                    P {item.protein}g · C {item.carbs}g · Fat {item.fat}g
                    {item.fiber != null ? ` · Fiber ${item.fiber}g` : ""}
                  </Td>
                  <Td className="font-medium tabular-nums">{item.calories} kcal</Td>
                  <Td>
                    <StatusBadge status={item.status} />
                  </Td>
                  <Td className="text-right">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => openEdit(item)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </Button>
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
            onSubmit={submitFood}
            className="flex h-full w-full max-w-xl flex-col border-l border-border bg-background shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-border px-6 py-5">
              <div>
                <h2 className="text-lg font-semibold">
                  {editingItem ? "Edit food item" : "Add food item"}
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Macros are recorded per serving.
                </p>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={closeDrawer}>
                <X className="h-4 w-4" /> Close
              </Button>
            </div>
            <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
              <FormSection title="Food details">
                <Field label="Food name">
                  <Input
                    required
                    value={form.name}
                    onChange={(event) => patchForm("name", event.target.value)}
                    placeholder="e.g. Greek yogurt"
                    className="w-full"
                  />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Diet type">
                    <Select
                      value={form.dietType}
                      onChange={(event) =>
                        patchForm("dietType", event.target.value as FoodDietType)
                      }
                      className="h-9 w-full"
                    >
                      {Object.entries(DIET_LABEL).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Status">
                    <Select
                      value={form.status}
                      onChange={(event) =>
                        patchForm("status", event.target.value as FoodItemStatus)
                      }
                      className="h-9 w-full"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </Select>
                  </Field>
                </div>
              </FormSection>
              <FormSection title="Serving">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Serving quantity">
                    <Input
                      required
                      min="0.01"
                      step="any"
                      type="number"
                      value={form.servingQty}
                      onChange={(event) => patchForm("servingQty", event.target.value)}
                      className="w-full"
                    />
                  </Field>
                  <Field label="Unit">
                    <Select
                      value={form.servingUnit}
                      onChange={(event) =>
                        patchForm("servingUnit", event.target.value as FoodServingUnit)
                      }
                      className="h-9 w-full"
                    >
                      {(
                        ["g", "ml", "piece", "cup", "tbsp", "tsp", "serving"] as FoodServingUnit[]
                      ).map((unit) => (
                        <option key={unit} value={unit}>
                          {unit}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>
              </FormSection>
              <FormSection title="Nutrition per serving">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Calories">
                    <Input
                      required
                      min="0"
                      step="any"
                      type="number"
                      value={form.calories}
                      onChange={(event) => patchForm("calories", event.target.value)}
                      className="w-full"
                    />
                  </Field>
                  <Field label="Protein (g)">
                    <Input
                      required
                      min="0"
                      step="any"
                      type="number"
                      value={form.protein}
                      onChange={(event) => patchForm("protein", event.target.value)}
                      className="w-full"
                    />
                  </Field>
                  <Field label="Carbs (g)">
                    <Input
                      required
                      min="0"
                      step="any"
                      type="number"
                      value={form.carbs}
                      onChange={(event) => patchForm("carbs", event.target.value)}
                      className="w-full"
                    />
                  </Field>
                  <Field label="Fat (g)">
                    <Input
                      required
                      min="0"
                      step="any"
                      type="number"
                      value={form.fat}
                      onChange={(event) => patchForm("fat", event.target.value)}
                      className="w-full"
                    />
                  </Field>
                  <Field label="Fiber (g) · optional">
                    <Input
                      min="0"
                      step="any"
                      type="number"
                      value={form.fiber}
                      onChange={(event) => patchForm("fiber", event.target.value)}
                      className="w-full"
                    />
                  </Field>
                </div>
              </FormSection>
              <FormSection title="Additional information">
                <Field label="Allergens · optional">
                  <Input
                    value={form.allergens}
                    onChange={(event) => patchForm("allergens", event.target.value)}
                    placeholder="Milk, soy, peanuts"
                    className="w-full"
                  />
                </Field>
                <div className="space-y-1.5">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-xs font-medium text-muted-foreground">
                      Image · optional
                    </span>
                    <span className="text-[11px] text-muted-foreground/80">
                      JPEG / PNG / WebP · ≤5MB · 1 only
                    </span>
                  </div>
                  <input
                    ref={imageFileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(event) => {
                      void onFoodImageSelected(event.target.files?.[0]);
                      event.target.value = "";
                    }}
                  />
                  {form.imageUrl ? (
                    <div className="group relative h-14 w-14 overflow-hidden rounded border border-border bg-panel-2">
                      <img
                        src={form.imageUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        className="absolute right-0.5 top-0.5 grid h-4 w-4 place-items-center rounded-full bg-black/75 text-white opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
                        onClick={() => {
                          patchForm("imageUrl", "");
                          setPasteImageUrl("");
                        }}
                        aria-label="Remove image"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-1.5 rounded-md border border-dashed border-border p-1">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="h-8 shrink-0 px-2.5"
                        disabled={submitting || uploadingImage}
                        onClick={() => imageFileRef.current?.click()}
                      >
                        {uploadingImage ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <ImagePlus className="h-3.5 w-3.5" />
                        )}
                        {uploadingImage ? "…" : "Upload"}
                      </Button>
                      <Input
                        value={pasteImageUrl}
                        onChange={(event) => setPasteImageUrl(event.target.value)}
                        placeholder="Paste image URL"
                        disabled={submitting || uploadingImage}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            addPastedFoodImage();
                          }
                        }}
                        className="h-8 min-w-0 flex-1 text-xs"
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="h-8 shrink-0 px-2.5"
                        disabled={submitting || uploadingImage || !pasteImageUrl.trim()}
                        onClick={addPastedFoodImage}
                      >
                        Add
                      </Button>
                    </div>
                  )}
                </div>
                <Field label="Notes · optional">
                  <textarea
                    value={form.notes}
                    onChange={(event) => patchForm("notes", event.target.value)}
                    rows={3}
                    className="w-full rounded-md border border-border bg-panel-2 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-lime"
                    placeholder="Preparation or serving notes"
                  />
                </Field>
              </FormSection>
            </div>
            <div className="flex justify-end gap-3 border-t border-border px-6 py-4">
              <Button type="button" variant="secondary" onClick={closeDrawer}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting || uploadingImage}>
                {(submitting || uploadingImage) && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingItem ? "Save changes" : "Add food"}
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
