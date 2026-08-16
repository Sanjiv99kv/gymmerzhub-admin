import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
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
  dietGoalLabel,
  dietTagLabel,
  fetchAdminDietPlanSummary,
  fetchAdminDietPlans,
  type AdminDietPlanSummary,
  type DietPlanSummary,
  type DietStatus,
  type DietVisibility,
} from "@/lib/admin-diet-plans";
import type { PaginationMeta } from "@/lib/admin-gyms";
import { ApiError, formatApiError } from "@/lib/api";
import { clearAdminSession } from "@/lib/admin-auth";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  FileEdit,
  Flame,
  Loader2,
  Plus,
  Salad,
  Search,
  Users,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/diets/")({
  head: () => ({ meta: [{ title: "Diet Templates · GymmerzHub Admin" }] }),
  component: DietPlansPage,
});

type Filters = {
  q: string;
  status: "" | DietStatus;
  visibility: "" | DietVisibility;
};

const EMPTY_FILTERS: Filters = { q: "", status: "", visibility: "" };
const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;
const DEFAULT_PAGE_SIZE = 10;

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

function DietPlansPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);
  const [plans, setPlans] = useState<DietPlanSummary[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [summary, setSummary] = useState<AdminDietPlanSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const debouncedQ = useDebouncedValue(filters.q);
  const query = useMemo(
    () => ({
      q: debouncedQ.trim() || undefined,
      status: filters.status || undefined,
      visibility: filters.visibility || undefined,
      page,
      pageSize,
    }),
    [debouncedQ, filters.status, filters.visibility, page, pageSize],
  );

  const filterKey = `${debouncedQ}|${filters.status}|${filters.visibility}`;
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
        navigate({ to: "/login" });
        toast.error("Session expired. Please sign in again.");
        return true;
      }
      return false;
    },
    [navigate],
  );

  const loadSummary = useCallback(async () => {
    try {
      setSummary(await fetchAdminDietPlanSummary());
    } catch (err) {
      if (handleAuthError(err)) return;
    }
  }, [handleAuthError]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchAdminDietPlans(query);
      setPlans(list.plans);
      setPagination(list.pagination);
    } catch (err) {
      if (handleAuthError(err)) return;
      const message = formatApiError(err, "Could not load diet plans");
      setError(message);
      setPlans([]);
      setPagination(null);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [handleAuthError, query]);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    if (filtersChanged && page !== 1) return;
    void load();
  }, [filtersChanged, load, page]);

  function patchFilter<K extends keyof Filters>(key: K, value: Filters[K]) {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
  }

  function clearFilters() {
    setFilters(EMPTY_FILTERS);
    setPage(1);
  }

  function changePageSize(next: number) {
    setPageSize(next);
    setPage(1);
  }

  const hasFilters = Boolean(filters.q || filters.status || filters.visibility);
  const rangeStart =
    pagination && pagination.total > 0 ? (pagination.page - 1) * pagination.pageSize + 1 : 0;
  const rangeEnd = pagination
    ? Math.min(pagination.page * pagination.pageSize, pagination.total)
    : 0;
  const totalPages = Math.max(1, pagination?.totalPages ?? 1);
  const pages = pagination ? pageItems(pagination.page, totalPages) : [];

  const stats = [
    {
      label: "All plans",
      value: summary?.total ?? "—",
      hint: hasFilters ? `${pagination?.total ?? 0} matching filters` : "In the catalog",
      icon: Salad,
      accent: "text-foreground",
      wrap: "border-border bg-panel-2 text-muted-foreground",
      glow: "shadow-[0_12px_32px_-14px_rgba(0,0,0,0.8)]",
    },
    {
      label: "Published",
      value: summary?.published ?? "—",
      hint: "Visible to members",
      icon: Eye,
      accent: "text-lime",
      wrap: "border-lime/25 bg-lime/15 text-lime",
      glow: "shadow-[0_12px_32px_-14px_rgba(0,0,0,0.7),0_0_24px_-10px_rgba(204,255,0,0.18)]",
    },
    {
      label: "Drafts",
      value: summary?.draft ?? "—",
      hint: "Not yet released",
      icon: FileEdit,
      accent: "text-amber-300",
      wrap: "border-amber-500/25 bg-amber-500/10 text-amber-300",
      glow: "shadow-[0_12px_32px_-14px_rgba(0,0,0,0.7),0_0_24px_-10px_rgba(251,191,36,0.16)]",
    },
    {
      label: "Avg. calories",
      value: summary ? `${summary.avgCalories}` : "—",
      hint: summary != null ? `${summary.active} active plans` : "Across catalog",
      icon: Flame,
      accent: "text-sky-300",
      wrap: "border-sky-500/25 bg-sky-500/10 text-sky-300",
      glow: "shadow-[0_12px_32px_-14px_rgba(0,0,0,0.7),0_0_24px_-10px_rgba(56,189,248,0.16)]",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Diet Templates"
        subtitle="Build and publish reusable seven-day meal plans for members."
        actions={
          <Link to="/diets/new">
            <Button>
              <Plus className="h-4 w-4" /> Create diet plan
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className={`rounded-xl border border-border/80 bg-panel p-4 ring-1 ring-white/[0.04] ${stat.glow}`}
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
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg border shadow-inner ${stat.wrap}`}
                >
                  <Icon className="h-4 w-4" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <Panel className="border-border/70 bg-panel-2/40 shadow-[0_6px_20px_-10px_rgba(0,0,0,0.55)] ring-1 ring-inset ring-white/[0.03]">
        <div className="space-y-4 p-5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Filters
            </span>
            {hasFilters && (
              <Button size="sm" variant="ghost" onClick={clearFilters}>
                Clear filters
              </Button>
            )}
          </div>
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_10rem_10rem]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={filters.q}
                onChange={(e) => patchFilter("q", e.target.value)}
                className="h-11 w-full rounded-lg pl-10 text-[15px]"
                placeholder="Search by name, goal, or tag…"
              />
            </div>
            <Select
              value={filters.visibility}
              onChange={(e) => patchFilter("visibility", e.target.value as Filters["visibility"])}
              className="h-11 w-full rounded-lg"
              aria-label="Filter by visibility"
            >
              <option value="">All visibility</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </Select>
            <Select
              value={filters.status}
              onChange={(e) => patchFilter("status", e.target.value as Filters["status"])}
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

      <Panel className="border-border/80 shadow-[0_16px_40px_-16px_rgba(0,0,0,0.85)] ring-1 ring-white/[0.05]">
        <div className="relative min-h-[360px]">
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-panel/75 backdrop-blur-[1px]">
              <div className="flex flex-col items-center gap-3">
                <Loader2
                  className="h-9 w-9 animate-spin text-lime"
                  aria-label="Loading diet plans"
                />
                <div className="text-xs text-muted-foreground">Loading diet plans…</div>
              </div>
            </div>
          )}

          {!loading && error && (
            <EmptyState
              title="Couldn’t load diet plans"
              hint={error}
              action={
                <Button size="sm" variant="secondary" onClick={() => void load()}>
                  Retry
                </Button>
              }
            />
          )}

          {!loading && !error && !plans.length && (
            <EmptyState
              title="No diet plans found"
              hint={
                hasFilters
                  ? "Try clearing filters or broadening your search."
                  : "Create your first seven-day plan for the member catalog."
              }
              action={
                hasFilters ? (
                  <Button size="sm" variant="secondary" onClick={clearFilters}>
                    Clear filters
                  </Button>
                ) : (
                  <Link to="/diets/new">
                    <Button size="sm">Create plan</Button>
                  </Link>
                )
              }
            />
          )}

          {!error && plans.length > 0 && (
            <Table
              head={["Plan", "Nutrition average", "Water", "Members", "Visibility", "Status", "Actions"]}
            >
              {plans.map((plan) => (
                <Tr key={plan.id}>
                  <Td>
                    <Link
                      to="/diets/$id"
                      params={{ id: plan.id }}
                      className="font-medium transition-colors hover:text-lime"
                    >
                      {plan.name}
                    </Link>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {dietGoalLabel(plan.goal) || dietTagLabel(plan.tag) || "No goal set"}
                    </div>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-1.5 font-medium tabular-nums">
                      <Flame className="h-3.5 w-3.5 text-lime" />
                      {plan.cal} kcal
                    </div>
                    <div className="mt-0.5 text-[11px] tabular-nums text-muted-foreground">
                      P {plan.protein}g · C {plan.carbs}g · Fat {plan.fat}g
                    </div>
                  </Td>
                  <Td className="tabular-nums text-muted-foreground">{plan.water} L</Td>
                  <Td>
                    <Link
                      to="/diets/$id/members"
                      params={{ id: plan.id }}
                      className="inline-flex items-center gap-1.5 text-sm tabular-nums text-muted-foreground hover:text-lime"
                    >
                      <Users className="h-3.5 w-3.5" />
                      {plan.memberCount ?? 0}
                    </Link>
                  </Td>
                  <Td>
                    <Badge tone={plan.visibility === "published" ? "success" : "muted"}>
                      {plan.visibility}
                    </Badge>
                  </Td>
                  <Td>
                    <StatusBadge status={plan.status} />
                  </Td>
                  <Td>
                    <div className="inline-flex items-center gap-2">
                      <Link to="/diets/$id" params={{ id: plan.id }} className="inline-flex">
                        <Button size="sm" variant="secondary">
                          View
                        </Button>
                      </Link>
                      <Link to="/diets/$id/edit" params={{ id: plan.id }} className="inline-flex">
                        <Button size="sm">Edit</Button>
                      </Link>
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
                        className={`inline-flex h-8 min-w-8 cursor-pointer items-center justify-center rounded-md px-2 text-xs font-medium tabular-nums transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
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
    </div>
  );
}
