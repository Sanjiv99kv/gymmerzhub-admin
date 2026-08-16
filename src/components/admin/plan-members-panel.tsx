import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Badge,
  Button,
  EmptyState,
  Input,
  PageHeader,
  Panel,
  Select,
  StatusBadge,
  Table,
  Td,
  Tr,
} from "@/components/admin/ui";
import type { PaginationMeta } from "@/lib/admin-gyms";
import type { PlanMember } from "@/lib/admin-workout-plans";
import { ApiError, formatApiError } from "@/lib/api";
import { clearAdminSession } from "@/lib/admin-auth";
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2, Search, Users } from "lucide-react";
import { toast } from "sonner";

export type MemberStatusFilter = "active" | "ended" | "expired" | "all";
export type MemberKindFilter = "follow" | "assignment" | "all";

type FetchMembers = (
  planId: string,
  query: {
    q?: string;
    status?: MemberStatusFilter;
    kind?: MemberKindFilter;
    page?: number;
    pageSize?: number;
  },
) => Promise<{ members: PlanMember[]; pagination: PaginationMeta }>;

type BackLink =
  | { to: "/workouts/$id"; params: { id: string }; label: string }
  | { to: "/diets/$id"; params: { id: string }; label: string };

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;
const DEFAULT_PAGE_SIZE = 20;

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

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function kindLabel(kind: PlanMember["kind"]) {
  return kind === "assignment" ? "Gym assignment" : "App follow";
}

function sourceLabel(source: string) {
  if (source === "platform") return "Platform";
  if (source === "gym") return "Gym";
  if (source === "ai") return "AI";
  return source;
}

export function PlanMembersPage({
  planId,
  planName,
  memberCount,
  fetchMembers,
  entityLabel,
  backLink,
}: {
  planId: string;
  planName: string;
  memberCount: number;
  fetchMembers: FetchMembers;
  entityLabel: "workout" | "diet";
  backLink: BackLink;
}) {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [status, setStatus] = useState<MemberStatusFilter>("active");
  const [kind, setKind] = useState<MemberKindFilter>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);
  const [members, setMembers] = useState<PlanMember[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQ(q.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [q]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQ, status, kind, pageSize, planId]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchMembers(planId, {
          q: debouncedQ || undefined,
          status,
          kind,
          page,
          pageSize,
        });
        if (cancelled) return;
        setMembers(data.members);
        setPagination(data.pagination);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) {
          clearAdminSession();
          toast.error("Session expired. Please sign in again.");
          navigate({ to: "/login" });
          return;
        }
        setMembers([]);
        setPagination(null);
        setError(formatApiError(err, "Could not load members"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [debouncedQ, fetchMembers, kind, navigate, page, pageSize, planId, status]);

  const total = pagination?.total ?? 0;
  const totalPages = Math.max(1, pagination?.totalPages ?? 1);
  const pages = pagination ? pageItems(pagination.page, totalPages) : [];
  const rangeStart =
    pagination && pagination.total > 0 ? (pagination.page - 1) * pagination.pageSize + 1 : 0;
  const rangeEnd = pagination ? Math.min(pagination.page * pagination.pageSize, total) : 0;
  const hasFilters = Boolean(debouncedQ) || status !== "active" || kind !== "all";

  function clearFilters() {
    setQ("");
    setStatus("active");
    setKind("all");
    setPage(1);
  }

  function changePageSize(next: number) {
    setPageSize(next);
    setPage(1);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={
          <span className="inline-flex flex-wrap items-center gap-1.5">
            <Link
              to={entityLabel === "workout" ? "/workouts" : "/diets"}
              className="hover:text-lime"
            >
              {entityLabel === "workout" ? "Workout templates" : "Diet templates"}
            </Link>
            <span className="text-muted-foreground/50">/</span>
            <Link to={backLink.to} params={backLink.params} className="hover:text-lime">
              {planName}
            </Link>
          </span>
        }
        title="Members"
        subtitle={`${memberCount} active on this ${entityLabel}`}
        actions={
          <Link to={backLink.to} params={backLink.params}>
            <Button variant="secondary">
              <ArrowLeft className="h-4 w-4" /> Back to {entityLabel}
            </Button>
          </Link>
        }
      />

      <Panel className="border-border/70 bg-panel-2/40 shadow-[0_6px_20px_-10px_rgba(0,0,0,0.55)] ring-1 ring-inset ring-white/[0.03]">
        <div className="space-y-4 p-5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Filters
            </span>
            {hasFilters ? (
              <Button size="sm" variant="ghost" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : null}
          </div>
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_10rem_12rem]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by name, email, or gym…"
                className="h-11 w-full rounded-lg pl-10 text-[15px]"
              />
            </div>
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value as MemberStatusFilter)}
              className="h-11 w-full rounded-lg"
            >
              <option value="active">Active</option>
              <option value="ended">Ended</option>
              <option value="expired">Expired</option>
              <option value="all">All statuses</option>
            </Select>
            <Select
              value={kind}
              onChange={(e) => setKind(e.target.value as MemberKindFilter)}
              className="h-11 w-full rounded-lg"
            >
              <option value="all">All types</option>
              <option value="follow">App follows</option>
              <option value="assignment">Gym assignments</option>
            </Select>
          </div>
        </div>
      </Panel>

      <Panel className="overflow-hidden">
        <div className="relative min-h-[280px]">
          {loading ? (
            <div className="absolute inset-0 grid place-items-center">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-7 w-7 animate-spin text-lime" aria-label="Loading members" />
                <div className="text-xs text-muted-foreground">Loading members…</div>
              </div>
            </div>
          ) : null}
          {!loading && error ? (
            <EmptyState title="Couldn’t load members" hint={error} />
          ) : null}
          {!loading && !error && !members.length ? (
            <EmptyState
              title="No members found"
              hint={
                hasFilters
                  ? "Try a different search or filter."
                  : `Nobody is on this ${entityLabel} yet.`
              }
            />
          ) : null}
          {!loading && !error && members.length ? (
            <Table head={["Member", "Type", "Source", "Gym", "Started", "Status"]}>
              {members.map((member) => (
                <Tr key={`${member.kind}-${member.id}`}>
                  <Td>
                    <div className="min-w-0">
                      <div className="truncate font-medium">{member.fullName || "—"}</div>
                      <div className="mt-0.5 truncate text-[11px] text-muted-foreground">
                        {member.email || "No email"}
                        {member.phone ? ` · ${member.phone}` : ""}
                      </div>
                    </div>
                  </Td>
                  <Td>
                    <Badge tone={member.kind === "assignment" ? "info" : "muted"}>
                      {kindLabel(member.kind)}
                    </Badge>
                  </Td>
                  <Td className="text-muted-foreground">{sourceLabel(member.source)}</Td>
                  <Td className="text-muted-foreground">{member.gymName || "—"}</Td>
                  <Td className="tabular-nums text-muted-foreground">
                    {formatDate(member.startedAt)}
                  </Td>
                  <Td>
                    <StatusBadge status={member.status} />
                  </Td>
                </Tr>
              ))}
            </Table>
          ) : null}
        </div>

        {pagination && pagination.total > 0 ? (
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
        ) : null}
      </Panel>
    </div>
  );
}

export function PlanMembersButton({
  to,
  params,
  count,
}: {
  to: "/workouts/$id/members" | "/diets/$id/members";
  params: { id: string };
  count: number;
}) {
  return (
    <Link to={to} params={params}>
      <Button variant="secondary">
        <Users className="h-4 w-4" />
        Show members
        <span className="tabular-nums text-muted-foreground">({count})</span>
      </Button>
    </Link>
  );
}
