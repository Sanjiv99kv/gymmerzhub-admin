import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  PageHeader,
  Button,
  Panel,
  Table,
  Tr,
  Td,
  StatusBadge,
  Input,
  Select,
  EmptyState,
} from "@/components/admin/ui";
import {
  fetchAdminMembers,
  memberDisplayName,
  memberGymName,
  memberJoinedAt,
  memberLastCheckIn,
  memberListStatus,
  memberPlanName,
  type AdminMemberDisplayStatus,
  type AdminMemberListItem,
  type AdminMemberSummary,
  type ListAdminMembersQuery,
  type PaginationMeta,
} from "@/lib/admin-members";
import { ApiError, formatApiError } from "@/lib/api";
import { clearAdminSession } from "@/lib/admin-auth";
import {
  Building2,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Loader2,
  PauseCircle,
  Search,
  ShieldCheck,
  ShieldOff,
  Users,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/members/")({
  head: () => ({
    meta: [
      { title: "Members · GymmerzHub Admin" },
      {
        name: "description",
        content: "View and audit members across all GymmerzHub gyms.",
      },
      { property: "og:title", content: "Members · GymmerzHub Admin" },
      {
        property: "og:description",
        content: "View and audit members across all GymmerzHub gyms.",
      },
    ],
  }),
  component: MembersPage,
});

type MemberStatusFilter = "" | AdminMemberDisplayStatus;

type Filters = {
  q: string;
  status: MemberStatusFilter;
  gym: string;
  plan: string;
  joinedFrom: string;
  joinedTo: string;
};

const EMPTY_FILTERS: Filters = {
  q: "",
  status: "",
  gym: "",
  plan: "",
  joinedFrom: "",
  joinedTo: "",
};

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;
const DEFAULT_PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 350;

const STATUS_OPTIONS: Array<{ value: MemberStatusFilter; label: string }> = [
  { value: "", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "suspended", label: "Suspended" },
];

function formatDate(value: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
      {children}
    </span>
  );
}

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);
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

function MembersPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);
  const [members, setMembers] = useState<AdminMemberListItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [summary, setSummary] = useState<AdminMemberSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const debouncedQ = useDebouncedValue(filters.q, SEARCH_DEBOUNCE_MS);
  const debouncedGym = useDebouncedValue(filters.gym, SEARCH_DEBOUNCE_MS);
  const debouncedPlan = useDebouncedValue(filters.plan, SEARCH_DEBOUNCE_MS);

  const applied = useMemo<Filters>(
    () => ({
      ...filters,
      q: debouncedQ,
      gym: debouncedGym,
      plan: debouncedPlan,
    }),
    [filters, debouncedQ, debouncedGym, debouncedPlan],
  );

  useEffect(() => {
    setPage(1);
  }, [debouncedQ, debouncedGym, debouncedPlan]);

  const query = useMemo<ListAdminMembersQuery>(
    () => ({
      q: applied.q.trim() || undefined,
      status: applied.status || undefined,
      gym: applied.gym.trim() || undefined,
      plan: applied.plan.trim() || undefined,
      joinedFrom: applied.joinedFrom || undefined,
      joinedTo: applied.joinedTo || undefined,
      page,
      pageSize,
    }),
    [applied, page, pageSize],
  );

  const loadMembers = useCallback(async () => {
    if (query.joinedFrom && query.joinedTo && query.joinedFrom > query.joinedTo) {
      setError("Joined from must be on or before joined to");
      setMembers([]);
      setPagination(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminMembers(query);
      setMembers(data.members ?? []);
      setPagination(data.pagination);
      setSummary(data.summary);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearAdminSession();
        toast.error("Session expired. Please sign in again.");
        navigate({ to: "/login" });
        return;
      }
      const message = formatApiError(err, "Could not load members");
      setError(message);
      setMembers([]);
      setPagination(null);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [navigate, query]);

  useEffect(() => {
    void loadMembers();
  }, [loadMembers]);

  function clearFilters() {
    setFilters(EMPTY_FILTERS);
    setPage(1);
  }

  function patchFilter<K extends keyof Filters>(key: K, value: Filters[K]) {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  }

  function changePageSize(next: number) {
    setPageSize(next);
    setPage(1);
  }

  const hasActiveFilters = Boolean(
    applied.q.trim() ||
    applied.status ||
    applied.gym.trim() ||
    applied.plan.trim() ||
    applied.joinedFrom ||
    applied.joinedTo,
  );

  const rangeStart =
    pagination && pagination.total > 0 ? (pagination.page - 1) * pagination.pageSize + 1 : 0;
  const rangeEnd = pagination
    ? Math.min(pagination.page * pagination.pageSize, pagination.total)
    : 0;
  const totalPages = Math.max(1, pagination?.totalPages ?? 1);
  const safePage = Math.min(page, totalPages);
  const pages = pagination ? pageItems(pagination.page, totalPages) : [];

  useEffect(() => {
    if (page !== safePage) setPage(safePage);
  }, [page, safePage]);

  const fmt = (n: number | undefined) => (n == null ? "—" : n.toLocaleString());

  const stats: Array<{
    label: string;
    hint: string;
    value: string;
    icon: typeof Users;
    accent: string;
    iconWrap: string;
    cardGlow: string;
  }> = [
    {
      label: "All members",
      hint: "Across every gym",
      value: fmt(summary?.total),
      icon: Users,
      accent: "text-foreground",
      iconWrap: "bg-panel-2 text-muted-foreground border-border",
      cardGlow: "shadow-[0_12px_32px_-14px_rgba(0,0,0,0.8)]",
    },
    {
      label: "Active",
      hint: "Training now",
      value: fmt(summary?.active),
      icon: ShieldCheck,
      accent: "text-lime",
      iconWrap: "bg-lime/15 text-lime border-lime/25",
      cardGlow: "shadow-[0_12px_32px_-14px_rgba(0,0,0,0.7),0_0_24px_-10px_rgba(204,255,0,0.18)]",
    },
    {
      label: "Inactive",
      hint: "Expired or frozen",
      value: fmt(summary?.inactive ?? 0),
      icon: ShieldOff,
      accent: "text-muted-foreground",
      iconWrap: "bg-panel-2 text-muted-foreground border-border",
      cardGlow: "shadow-[0_12px_32px_-14px_rgba(0,0,0,0.8)]",
    },
    {
      label: "Suspended",
      hint: "Paused by platform",
      value: fmt(summary?.suspended),
      icon: PauseCircle,
      accent: "text-amber-300",
      iconWrap: "bg-amber-500/10 text-amber-300 border-amber-500/25",
      cardGlow: "shadow-[0_12px_32px_-14px_rgba(0,0,0,0.7),0_0_24px_-10px_rgba(251,191,36,0.16)]",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Members"
        subtitle="See who’s training across GymmerzHub — which gym, which plan, and who’s still active."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className={`rounded-xl border border-border/80 bg-panel p-4 ring-1 ring-white/[0.04] ${stat.cardGlow}`}
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
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg border shadow-inner ${stat.iconWrap}`}
                >
                  <Icon className="h-4 w-4" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <Panel className="border-border/70 bg-panel-2/40 shadow-[0_6px_20px_-10px_rgba(0,0,0,0.55)] ring-1 ring-inset ring-white/[0.03]">
        <div className="space-y-5 p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Filters
            </div>
            {hasActiveFilters && (
              <Button type="button" size="sm" variant="ghost" onClick={clearFilters}>
                Clear filters
              </Button>
            )}
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1">
              <FieldLabel>Search</FieldLabel>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={filters.q}
                  onChange={(e) => patchFilter("q", e.target.value)}
                  placeholder="Search by name, email, or phone"
                  className="h-11 w-full rounded-lg pl-10 text-[15px]"
                />
              </div>
            </div>
            <div className="w-full shrink-0 sm:w-44">
              <FieldLabel>Status</FieldLabel>
              <Select
                value={filters.status}
                onChange={(e) => patchFilter("status", e.target.value as MemberStatusFilter)}
                className="h-11 w-full rounded-lg"
                aria-label="Filter by status"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.label} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="w-full shrink-0 sm:w-44">
              <FieldLabel>Plan</FieldLabel>
              <Input
                value={filters.plan}
                onChange={(e) => patchFilter("plan", e.target.value)}
                placeholder="e.g. Quarterly"
                className="h-11 w-full rounded-lg"
                aria-label="Filter by plan name"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div>
              <FieldLabel>
                <span className="inline-flex items-center gap-1.5">
                  <Building2 className="h-3 w-3" />
                  Gym
                </span>
              </FieldLabel>
              <Input
                value={filters.gym}
                onChange={(e) => patchFilter("gym", e.target.value)}
                placeholder="e.g. Ironline"
                className="w-full"
              />
            </div>
            <div>
              <FieldLabel>
                <span className="inline-flex items-center gap-1.5">
                  <CalendarRange className="h-3 w-3" />
                  Joined from
                </span>
              </FieldLabel>
              <Input
                type="date"
                value={filters.joinedFrom}
                onChange={(e) => patchFilter("joinedFrom", e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <FieldLabel>Joined to</FieldLabel>
              <Input
                type="date"
                value={filters.joinedTo}
                onChange={(e) => patchFilter("joinedTo", e.target.value)}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </Panel>

      <Panel className="border-border/80 shadow-[0_16px_40px_-16px_rgba(0,0,0,0.85)] ring-1 ring-white/[0.05]">
        <div className="relative min-h-[360px]">
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-panel/75 backdrop-blur-[1px]">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-9 w-9 animate-spin text-lime" aria-label="Loading members" />
                <div className="text-xs text-muted-foreground">Loading members…</div>
              </div>
            </div>
          )}

          {!loading && error && (
            <EmptyState
              title="Couldn’t load members"
              hint={error}
              action={
                <Button size="sm" variant="secondary" onClick={() => void loadMembers()}>
                  Retry
                </Button>
              }
            />
          )}

          {!loading && !error && members.length === 0 && (
            <EmptyState
              title="No members found"
              hint={
                hasActiveFilters
                  ? "Try clearing filters or broadening your search."
                  : "Members appear here after they join a gym."
              }
              action={
                hasActiveFilters ? (
                  <Button size="sm" variant="secondary" onClick={clearFilters}>
                    Clear filters
                  </Button>
                ) : undefined
              }
            />
          )}

          {!error && members.length > 0 && (
            <Table head={["Member", "Contact", "Gym", "Plan", "Status", "Joined", "Last check-in"]}>
              {members.map((m) => {
                const name = memberDisplayName(m);
                return (
                  <Tr key={m.id}>
                    <Td>
                      <div className="flex items-center gap-3">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-border bg-panel-2 text-[11px] font-semibold text-muted-foreground">
                          {initials(name === "—" ? "?" : name)}
                        </span>
                        <Link
                          to="/members/$id"
                          params={{ id: m.id }}
                          className="font-medium transition-colors hover:text-lime"
                        >
                          {name}
                        </Link>
                      </div>
                    </Td>
                    <Td>
                      <div className="text-xs text-muted-foreground">{m.email || "—"}</div>
                      <div className="mt-0.5 text-[11px] text-muted-foreground">
                        {m.phone || "—"}
                      </div>
                    </Td>
                    <Td className="font-medium">{memberGymName(m)}</Td>
                    <Td className="text-muted-foreground">{memberPlanName(m)}</Td>
                    <Td>
                      <StatusBadge status={memberListStatus(m)} />
                    </Td>
                    <Td className="text-xs text-muted-foreground">
                      {formatDate(memberJoinedAt(m))}
                    </Td>
                    <Td className="text-xs text-muted-foreground">
                      {formatDate(memberLastCheckIn(m))}
                    </Td>
                  </Tr>
                );
              })}
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
    </div>
  );
}
