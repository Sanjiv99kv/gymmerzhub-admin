import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Badge, Button, EmptyState, Panel, StatusBadge, PageHeader } from "@/components/admin/ui";
import { PlanMembersButton } from "@/components/admin/plan-members-panel";
import {
  dietGoalLabel,
  dietTagLabel,
  fetchAdminDietPlan,
  type DietPlanDetail,
  type DietPlanItem,
  type DietPlanSlot,
} from "@/lib/admin-diet-plans";
import { ApiError, formatApiError } from "@/lib/api";
import { clearAdminSession } from "@/lib/admin-auth";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  Droplets,
  Flame,
  Loader2,
  Pencil,
  Salad,
  Users,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/diets/$id/")({
  head: () => ({ meta: [{ title: "Diet Plan · GymmerzHub Admin" }] }),
  component: DietPlanDetailPage,
});

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function macroShare(protein: number, carbs: number, fat: number) {
  const p = Math.max(0, protein) * 4;
  const c = Math.max(0, carbs) * 4;
  const f = Math.max(0, fat) * 9;
  const total = p + c + f;
  if (total <= 0) return { protein: 0, carbs: 0, fat: 0 };
  return {
    protein: Math.round((p / total) * 100),
    carbs: Math.round((c / total) * 100),
    fat: Math.round((f / total) * 100),
  };
}

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  accent,
  iconWrap,
}: {
  label: string;
  value: string;
  hint: string;
  icon: typeof Flame;
  accent: string;
  iconWrap: string;
}) {
  return (
    <div className="rounded-xl border border-border/80 bg-panel p-4 ring-1 ring-white/[0.04] shadow-[0_12px_32px_-14px_rgba(0,0,0,0.8)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {label}
          </div>
          <div className={`mt-2 text-2xl font-semibold tracking-tight tabular-nums ${accent}`}>
            {value}
          </div>
          <div className="mt-1 truncate text-[11px] text-muted-foreground">{hint}</div>
        </div>
        <span
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg border shadow-inner ${iconWrap}`}
        >
          <Icon className="h-4 w-4" />
        </span>
      </div>
    </div>
  );
}

function optionTotals(items: DietPlanItem[]) {
  return items.reduce(
    (total, item) => ({
      calories: total.calories + item.calories,
      protein: total.protein + item.protein,
      carbs: total.carbs + item.carbs,
      fat: total.fat + item.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
}

function round(value: number) {
  return Math.round(value * 10) / 10;
}

function FoodRow({ item }: { item: DietPlanItem }) {
  return (
    <li className="flex items-center gap-3 border-b border-border/40 px-3 py-2 last:border-0 hover:bg-panel-2/40">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="truncate text-sm font-medium">{item.name}</span>
          <span className="rounded bg-panel-2 px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-muted-foreground">
            {item.quantity}
            {item.servingUnit}
          </span>
        </div>
        <div className="mt-1 text-[11px] tabular-nums text-muted-foreground">
          P {item.protein} · C {item.carbs} · F {item.fat}
          {item.notes ? ` · ${item.notes}` : ""}
        </div>
      </div>
      <div className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
        {item.calories}
        <span className="ml-1 text-[10px] font-normal text-muted-foreground">kcal</span>
      </div>
    </li>
  );
}

function MealCard({ slot }: { slot: DietPlanSlot }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border/80 bg-panel">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 bg-panel-2/50 px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold">{slot.name}</span>
          {slot.timeHint ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {slot.timeHint}
            </span>
          ) : null}
        </div>
        <div className="text-[11px] tabular-nums text-muted-foreground">
          Target {slot.targets.cal} kcal · P {slot.targets.protein} · C {slot.targets.carbs} · F{" "}
          {slot.targets.fat}
        </div>
      </div>

      <div className="grid gap-4 p-4 lg:grid-cols-2">
        {slot.options.map((option, index) => {
          const totals = optionTotals(option.items);
          return (
            <div
              key={option.id}
              className={`overflow-hidden rounded-lg border bg-background/30 ${
                option.isDefault ? "border-lime/30" : "border-border/70"
              }`}
            >
              <div className="flex items-center justify-between gap-2 border-b border-border/60 bg-panel-2/40 px-3 py-2">
                <div className="flex items-center gap-2">
                  <Badge tone={option.isDefault ? "success" : "muted"}>
                    {option.isDefault ? "Default" : `Alt ${option.sortOrder || index}`}
                  </Badge>
                  <span className="text-[11px] text-muted-foreground">
                    {option.items.length} item{option.items.length === 1 ? "" : "s"}
                  </span>
                </div>
                <span className="text-[11px] font-medium tabular-nums text-foreground">
                  {round(totals.calories)} kcal
                </span>
              </div>
              <ul>
                {option.items.map((item) => (
                  <FoodRow key={item.id} item={item} />
                ))}
              </ul>
              <div className="border-t border-border/60 bg-panel-2/30 px-3 py-2 text-[11px] tabular-nums text-muted-foreground">
                Total · P {round(totals.protein)}g · C {round(totals.carbs)}g · F{" "}
                {round(totals.fat)}g
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DietPlanDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<DietPlanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeDay, setActiveDay] = useState(1);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const next = await fetchAdminDietPlan(id);
        setPlan(next);
        setActiveDay(next.days[0]?.dayIndex ?? 1);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          clearAdminSession();
          toast.error("Session expired. Please sign in again.");
          navigate({ to: "/login" });
          return;
        }
        setPlan(null);
        setError(formatApiError(err, "Could not load diet plan"));
      } finally {
        setLoading(false);
      }
    })();
  }, [id, navigate]);

  const share = useMemo(
    () => (plan ? macroShare(plan.protein, plan.carbs, plan.fat) : null),
    [plan],
  );

  const selectedDay = useMemo(
    () => plan?.days.find((day) => day.dayIndex === activeDay) ?? plan?.days[0] ?? null,
    [activeDay, plan],
  );

  const mealCount = selectedDay?.slots.length ?? 0;
  const optionCount =
    selectedDay?.slots.reduce((total, slot) => total + slot.options.length, 0) ?? 0;

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <Loader2 className="h-9 w-9 animate-spin text-lime" />
        <div className="text-xs text-muted-foreground">Loading diet plan…</div>
      </div>
    );
  }

  if (!plan) {
    return (
      <EmptyState
        title="Diet plan unavailable"
        hint={error ?? "This plan no longer exists."}
        action={
          <Link to="/diets">
            <Button>Back to plans</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={
          <Link to="/diets" className="hover:text-lime">
            Diet templates
          </Link>
        }
        title={plan.name}
        subtitle={dietGoalLabel(plan.goal) || "Seven-day meal plan for the member catalog."}
        actions={
          <div className="flex items-center gap-2">
            <Link to="/diets">
              <Button variant="secondary">
                <ArrowLeft className="h-4 w-4" /> All plans
              </Button>
            </Link>
            <PlanMembersButton
              to="/diets/$id/members"
              params={{ id: plan.id }}
              count={plan.memberCount ?? 0}
            />
            <Link to="/diets/$id/edit" params={{ id: plan.id }}>
              <Button>
                <Pencil className="h-4 w-4" /> Edit plan
              </Button>
            </Link>
          </div>
        }
      />

      <Panel className="border-border/80 shadow-[0_16px_40px_-16px_rgba(0,0,0,0.85)] ring-1 ring-white/[0.05]">
        <div className="flex flex-col gap-5 p-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={plan.visibility === "published" ? "success" : "muted"}>
                {plan.visibility}
              </Badge>
              <StatusBadge status={plan.status} />
              {plan.tag ? <Badge tone="info">{dietTagLabel(plan.tag)}</Badge> : null}
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Droplets className="h-3.5 w-3.5 text-sky-300" />
                {plan.water} L water / day
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" />
                {plan.days.length} day schedule
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-lime" />
                <Link
                  to="/diets/$id/members"
                  params={{ id: plan.id }}
                  className="hover:text-lime"
                >
                  {plan.memberCount ?? 0} members
                </Link>
              </span>
              <span>Updated {formatDate(plan.updatedAt)}</span>
            </div>
            {plan.notes ? (
              <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
                {plan.notes}
              </p>
            ) : null}
          </div>

          {share ? (
            <div className="w-full max-w-xs shrink-0 rounded-xl border border-border/70 bg-panel-2/40 p-4">
              <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Macro split
              </div>
              <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-background/60">
                <div className="bg-lime" style={{ width: `${share.protein}%` }} />
                <div className="bg-sky-400" style={{ width: `${share.carbs}%` }} />
                <div className="bg-amber-400" style={{ width: `${share.fat}%` }} />
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[11px]">
                <div>
                  <div className="font-semibold text-lime">{share.protein}%</div>
                  <div className="text-muted-foreground">Protein</div>
                </div>
                <div>
                  <div className="font-semibold text-sky-300">{share.carbs}%</div>
                  <div className="text-muted-foreground">Carbs</div>
                </div>
                <div>
                  <div className="font-semibold text-amber-300">{share.fat}%</div>
                  <div className="text-muted-foreground">Fat</div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </Panel>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard
          label="Daily calories"
          value={`${plan.cal}`}
          hint="Average target kcal"
          icon={Flame}
          accent="text-lime"
          iconWrap="border-lime/25 bg-lime/15 text-lime"
        />
        <StatCard
          label="Protein"
          value={`${plan.protein}g`}
          hint="Daily average"
          icon={Salad}
          accent="text-foreground"
          iconWrap="border-border bg-panel-2 text-muted-foreground"
        />
        <StatCard
          label="Carbs"
          value={`${plan.carbs}g`}
          hint="Daily average"
          icon={Salad}
          accent="text-sky-300"
          iconWrap="border-sky-500/25 bg-sky-500/10 text-sky-300"
        />
        <StatCard
          label="Fat"
          value={`${plan.fat}g`}
          hint="Daily average"
          icon={Salad}
          accent="text-amber-300"
          iconWrap="border-amber-500/25 bg-amber-500/10 text-amber-300"
        />
      </div>

      <Panel className="border-border/80 shadow-[0_16px_40px_-16px_rgba(0,0,0,0.85)] ring-1 ring-white/[0.05]">
        <div className="border-b border-border px-4 py-3">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-sm font-semibold">Weekly schedule</div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                {mealCount} meal{mealCount === 1 ? "" : "s"} · {optionCount} option
                {optionCount === 1 ? "" : "s"} on this day
              </div>
            </div>
          </div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {DAY_LABELS.map((label, index) => {
              const dayIndex = index + 1;
              const day = plan.days.find((entry) => entry.dayIndex === dayIndex);
              const selected = activeDay === dayIndex;
              return (
                <button
                  key={label}
                  type="button"
                  disabled={!day}
                  onClick={() => setActiveDay(dayIndex)}
                  className={`inline-flex h-9 min-w-14 shrink-0 cursor-pointer items-center justify-center rounded-md px-3 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                    selected
                      ? "bg-lime text-lime-foreground"
                      : "border border-border bg-panel-2 text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-5">
          {!selectedDay || selectedDay.slots.length === 0 ? (
            <EmptyState
              title="No meals for this day"
              hint="This day has no slots configured yet."
            />
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                <span className="text-lime">
                  {(selectedDay.day ?? DAY_LABELS[selectedDay.dayIndex - 1] ?? "Day").toUpperCase()}
                </span>
                <span>· Day {selectedDay.dayIndex}</span>
              </div>
              {selectedDay.slots.map((slot) => (
                <MealCard key={slot.id} slot={slot} />
              ))}
            </div>
          )}
        </div>
      </Panel>
    </div>
  );
}
