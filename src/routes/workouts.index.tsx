import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import {
  fetchAdminWorkoutPlanSummary,
  fetchAdminWorkoutPlans,
  type AdminWorkoutPlanSummary,
  type WorkoutPlan,
  type WorkoutStatus,
  type WorkoutVisibility,
} from "@/lib/admin-workout-plans";
import { ApiError, formatApiError } from "@/lib/api";
import { clearAdminSession } from "@/lib/admin-auth";
import {
  CalendarDays,
  ClipboardList,
  Eye,
  FileEdit,
  Leaf,
  Loader2,
  Pencil,
  Plus,
  Search,
  Users,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/workouts/")({
  head: () => ({ meta: [{ title: "Workout Templates · GymmerzHub Admin" }] }),
  component: WorkoutPlansPage,
});

function useDebouncedValue(value: string, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function WorkoutPlansPage() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"" | WorkoutStatus>("");
  const [visibility, setVisibility] = useState<"" | WorkoutVisibility>("");
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [summary, setSummary] = useState<AdminWorkoutPlanSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const debouncedQ = useDebouncedValue(q);
  const query = useMemo(
    () => ({
      q: debouncedQ.trim() || undefined,
      status: status || undefined,
      visibility: visibility || undefined,
      pageSize: 50,
    }),
    [debouncedQ, status, visibility],
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

  const loadSummary = useCallback(async () => {
    try {
      setSummary(await fetchAdminWorkoutPlanSummary());
    } catch (err) {
      if (handleAuthError(err)) return;
    }
  }, [handleAuthError]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setPlans((await fetchAdminWorkoutPlans(query)).plans);
    } catch (err) {
      if (handleAuthError(err)) return;
      setError(formatApiError(err, "Could not load workout templates"));
      setPlans([]);
    } finally {
      setLoading(false);
    }
  }, [handleAuthError, query]);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    void load();
  }, [load]);

  const hasFilters = Boolean(q || status || visibility);
  const stats = [
    {
      label: "All templates",
      value: summary?.total ?? "—",
      hint: hasFilters ? `${plans.length} matching filters` : "In the catalog",
      icon: ClipboardList,
      accent: "text-foreground",
      wrap: "border-border bg-panel-2 text-muted-foreground",
    },
    {
      label: "Published",
      value: summary?.published ?? "—",
      hint: "Visible to members",
      icon: Eye,
      accent: "text-lime",
      wrap: "border-lime/25 bg-lime/15 text-lime",
    },
    {
      label: "Drafts",
      value: summary?.draft ?? "—",
      hint: "Not yet released",
      icon: FileEdit,
      accent: "text-amber-300",
      wrap: "border-amber-500/25 bg-amber-500/10 text-amber-300",
    },
    {
      label: "Avg. days / week",
      value: summary ? `${summary.avgDaysPerWeek}` : "—",
      hint: summary != null ? `${summary.active} active templates` : "Across catalog",
      icon: Leaf,
      accent: "text-sky-300",
      wrap: "border-sky-500/25 bg-sky-500/10 text-sky-300",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Workout Templates"
        subtitle="Build curated training plans from the global exercise catalog."
        actions={
          <Link to="/workouts/new">
            <Button>
              <Plus className="h-4 w-4" /> Create template
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
        <div className="grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_10rem_10rem]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search templates…"
              className="h-10 w-full pl-9"
            />
          </div>
          <Select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as "" | WorkoutVisibility)}
            className="h-10 w-full"
          >
            <option value="">All visibility</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </Select>
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value as "" | WorkoutStatus)}
            className="h-10 w-full"
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
        </div>
        {hasFilters ? (
          <div className="border-t border-border px-4 py-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setQ("");
                setStatus("");
                setVisibility("");
              }}
            >
              Clear filters
            </Button>
          </div>
        ) : null}
      </Panel>

      <Panel className="overflow-hidden">
        <div className="relative min-h-[280px]">
          {loading ? (
            <div className="absolute inset-0 grid place-items-center">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-7 w-7 animate-spin text-lime" aria-label="Loading workouts" />
                <div className="text-xs text-muted-foreground">Loading workout templates…</div>
              </div>
            </div>
          ) : null}
          {!loading && error ? (
            <EmptyState
              title="Couldn’t load workout templates"
              hint={error}
              action={<Button onClick={() => void load()}>Retry</Button>}
            />
          ) : null}
          {!loading && !error && !plans.length ? (
            <EmptyState
              title="No workout templates found"
              hint="Create a template to start building the workout catalog."
              action={
                <Link to="/workouts/new">
                  <Button>Create template</Button>
                </Link>
              }
            />
          ) : null}
          {!loading && !error && plans.length ? (
            <Table
              head={["Template", "Focus", "Schedule", "Members", "Visibility", "Status", "Actions"]}
            >
              {plans.map((plan) => (
                <Tr key={plan.id}>
                  <Td>
                    <Link
                      to="/workouts/$id"
                      params={{ id: plan.id }}
                      className="font-medium hover:text-lime"
                    >
                      {plan.name}
                    </Link>
                    <div className="mt-0.5 text-[11px] text-muted-foreground">
                      {plan.level || "All levels"} · {plan.goal || "General training"}
                    </div>
                  </Td>
                  <Td className="text-muted-foreground">{plan.focus || "—"}</Td>
                  <Td>
                    <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {plan.daysPerWeek} days · {plan.days.length} sessions
                    </span>
                  </Td>
                  <Td>
                    <Link
                      to="/workouts/$id/members"
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
                    <div className="inline-flex gap-2">
                      <Link to="/workouts/$id" params={{ id: plan.id }}>
                        <Button size="sm" variant="secondary">
                          <Eye className="h-3.5 w-3.5" /> View
                        </Button>
                      </Link>
                      <Link to="/workouts/$id/edit" params={{ id: plan.id }}>
                        <Button size="sm" variant="secondary">
                          <Pencil className="h-3.5 w-3.5" /> Edit
                        </Button>
                      </Link>
                    </div>
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
