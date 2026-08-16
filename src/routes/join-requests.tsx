import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
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
import {
  fetchAdminJoinRequestSummary,
  fetchAdminJoinRequests,
  JOIN_REQUEST_SEARCH_FIELDS,
  type AdminJoinRequest,
  type AdminJoinRequestSummary,
  type JoinRequestSearchField,
  type JoinRequestStatus,
} from "@/lib/admin-join-requests";
import { ApiError, formatApiError } from "@/lib/api";
import { clearAdminSession } from "@/lib/admin-auth";
import { toast } from "sonner";
import { CheckCircle2, Clock3, Info, Loader2, Search, UserPlus, XCircle } from "lucide-react";

export const Route = createFileRoute("/join-requests")({
  head: () => ({
    meta: [
      { title: "Join Requests · GymmerzHub Admin" },
      {
        name: "description",
        content: "Audit member join requests and owner invites across all gyms.",
      },
      { property: "og:title", content: "Join Requests · GymmerzHub Admin" },
      {
        property: "og:description",
        content: "Audit member join requests and owner invites.",
      },
    ],
  }),
  component: JoinRequestsPage,
});

function useDebouncedValue(value: string, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function JoinRequestsPage() {
  const navigate = useNavigate();
  const [searchField, setSearchField] = useState<JoinRequestSearchField>("memberEmail");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"" | JoinRequestStatus>("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [requests, setRequests] = useState<AdminJoinRequest[]>([]);
  const [summary, setSummary] = useState<AdminJoinRequestSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const debouncedQ = useDebouncedValue(q);
  const searchMeta =
    JOIN_REQUEST_SEARCH_FIELDS.find((field) => field.value === searchField) ??
    JOIN_REQUEST_SEARCH_FIELDS[0];
  const searchTerm = debouncedQ.trim();
  // Only apply searchField when the user actually typed a query — changing the
  // dropdown alone must not refetch.
  const activeSearchField = searchTerm ? searchField : undefined;

  const query = useMemo(
    () => ({
      q: searchTerm || undefined,
      searchField: activeSearchField,
      status: status || undefined,
      from: from || undefined,
      to: to || undefined,
      pageSize: 50,
    }),
    [searchTerm, activeSearchField, status, from, to],
  );

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

  const load = useCallback(async () => {
    if (query.from && query.to && query.from > query.to) {
      setError("End date must be on or after start date.");
      setRequests([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      setRequests((await fetchAdminJoinRequests(query)).requests);
    } catch (err) {
      if (handleAuthError(err)) return;
      setError(formatApiError(err, "Could not load join requests"));
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [handleAuthError, query]);

  const loadSummary = useCallback(async () => {
    try {
      setSummary(await fetchAdminJoinRequestSummary());
    } catch (err) {
      handleAuthError(err);
    }
  }, [handleAuthError]);

  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  const hasFilters = Boolean(q || status || from || to);

  const stats = [
    {
      label: "All requests",
      value: summary?.total ?? "—",
      icon: UserPlus,
      tone: "text-foreground",
    },
    {
      label: "Awaiting owner",
      value: summary?.pending ?? "—",
      icon: Clock3,
      tone: "text-amber-300",
    },
    {
      label: "Approved",
      value: summary?.approved ?? "—",
      icon: CheckCircle2,
      tone: "text-lime",
    },
    {
      label: "Rejected",
      value: summary?.rejected ?? "—",
      icon: XCircle,
      tone: "text-red-300",
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Join Requests"
        subtitle="Audit requests across gyms. Membership approval is exclusively handled by the gym owner."
      />

      <div className="flex items-start gap-3 rounded-lg border border-lime/20 bg-lime/5 p-4 text-sm text-muted-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-lime" />
        <div>
          <span className="font-medium text-foreground">Read-only support view.</span> Platform
          admins cannot approve, reject, or force membership. Only the gym owner can review a
          pending request.
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, tone }) => (
          <Panel key={label} className="border-border/70 bg-panel-2/40 p-4">
            <div className="flex items-start justify-between">
              <span className="text-xs text-muted-foreground">{label}</span>
              <Icon className={`h-4 w-4 ${tone}`} />
            </div>
            <div className={`mt-2 text-2xl font-semibold tabular-nums ${tone}`}>{value}</div>
          </Panel>
        ))}
      </div>

      <Panel className="overflow-hidden">
        <div className="flex flex-wrap items-end gap-2 border-b border-border p-4">
          <div className="flex min-w-0 flex-[1_1_18rem] overflow-hidden rounded-md border border-border bg-panel-2">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(event) => setQ(event.target.value)}
                placeholder={searchMeta.placeholder}
                className="h-9 w-full border-0 bg-transparent pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-0"
              />
            </div>
            <select
              value={searchField}
              onChange={(event) =>
                setSearchField(event.target.value as JoinRequestSearchField)
              }
              className="h-9 shrink-0 border-0 border-l border-border bg-transparent px-2 text-xs text-foreground focus:outline-none"
              aria-label="Search field"
            >
              {JOIN_REQUEST_SEARCH_FIELDS.map((field) => (
                <option key={field.value} value={field.value}>
                  {field.label}
                </option>
              ))}
            </select>
          </div>

          <Select
            value={status}
            onChange={(event) => setStatus(event.target.value as "" | JoinRequestStatus)}
            className="h-9 w-[10.5rem] shrink-0"
          >
            <option value="">All statuses</option>
            <option value="pending">Pending owner review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </Select>

          <Input
            type="date"
            value={from}
            onChange={(event) => setFrom(event.target.value)}
            className="h-9 w-[9.75rem] shrink-0"
            aria-label="From date"
          />
          <Input
            type="date"
            value={to}
            onChange={(event) => setTo(event.target.value)}
            className="h-9 w-[9.75rem] shrink-0"
            aria-label="To date"
          />

          {hasFilters ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-9 shrink-0"
              onClick={() => {
                setSearchField("memberEmail");
                setQ("");
                setStatus("");
                setFrom("");
                setTo("");
              }}
            >
              Clear
            </Button>
          ) : null}
        </div>

        <div className="relative min-h-[280px]">
          {loading ? (
            <div className="absolute inset-0 grid place-items-center">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-7 w-7 animate-spin text-lime" aria-label="Loading requests" />
                <div className="text-xs text-muted-foreground">Loading requests…</div>
              </div>
            </div>
          ) : null}
          {!loading && error ? (
            <EmptyState
              title="Couldn’t load requests"
              hint={error}
              action={
                <Button type="button" onClick={() => void load()}>
                  Retry
                </Button>
              }
            />
          ) : null}
          {!loading && !error && !requests.length ? (
            <EmptyState
              title="No join requests found"
              hint="Try a different search field, status, or date range."
            />
          ) : null}
          {!loading && !error && requests.length ? (
            <Table head={["Member", "Gym", "Requested", "Plan", "Status"]}>
              {requests.map((request) => (
                <Tr key={request.id}>
                  <Td>
                    <div className="font-medium">
                      {request.member?.fullName || "Unknown member"}
                    </div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground">
                      {request.member?.email || "—"}
                    </div>
                  </Td>
                  <Td>
                    {request.gym ? (
                      <Link
                        to="/gyms/$id"
                        params={{ id: request.gym.id }}
                        className="font-medium hover:text-lime"
                      >
                        {request.gym.name}
                      </Link>
                    ) : (
                      "—"
                    )}
                    {request.gym?.city ? (
                      <div className="mt-0.5 text-[11px] text-muted-foreground">
                        {request.gym.city}
                      </div>
                    ) : null}
                  </Td>
                  <Td className="text-xs text-muted-foreground">
                    {request.createdAt
                      ? new Intl.DateTimeFormat(undefined, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(new Date(request.createdAt))
                      : "—"}
                  </Td>
                  <Td className="text-sm text-muted-foreground">
                    {request.suggestedPlan?.name || "Not selected"}
                  </Td>
                  <Td>
                    <StatusBadge status={request.status} />
                  </Td>
                </Tr>
              ))}
            </Table>
          ) : null}
        </div>
      </Panel>
    </div>
  );
}
