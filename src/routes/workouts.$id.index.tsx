import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Badge, Button, EmptyState, PageHeader, Panel, StatusBadge } from "@/components/admin/ui";
import { PlanMembersButton } from "@/components/admin/plan-members-panel";
import { exerciseEquipmentLabel } from "@/lib/admin-exercises";
import {
  fetchAdminWorkoutPlan,
  type WorkoutDay,
  type WorkoutExercise,
  type WorkoutPlan,
} from "@/lib/admin-workout-plans";
import { ApiError, formatApiError } from "@/lib/api";
import { clearAdminSession } from "@/lib/admin-auth";
import {
  Activity,
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  Clock3,
  Dumbbell,
  ExternalLink,
  Image as ImageIcon,
  Layers3,
  Loader2,
  Pencil,
  Play,
  Repeat2,
  Target,
  TimerReset,
  Users,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/workouts/$id/")({
  head: () => ({ meta: [{ title: "Workout Template · GymmerzHub Admin" }] }),
  component: WorkoutPlanDetailPage,
});

type MediaItem = {
  id: string;
  type: "image" | "video";
  url: string;
  label: string;
};

function WorkoutPlanDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeDay, setActiveDay] = useState(0);

  useEffect(() => {
    void fetchAdminWorkoutPlan(id)
      .then(setPlan)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          clearAdminSession();
          navigate({ to: "/login" });
          toast.error("Session expired. Please sign in again.");
          return;
        }
        setError(formatApiError(err, "Could not load workout template"));
      });
  }, [id, navigate]);

  if (!plan && !error) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-5 w-5 animate-spin text-lime" />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="space-y-6">
        <PageHeader title="Workout template" />
        <EmptyState
          title="Workout template unavailable"
          hint={error ?? undefined}
          action={
            <Link to="/workouts">
              <Button>
                <ArrowLeft className="h-4 w-4" /> Back to templates
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  const exerciseCount = plan.days.reduce((count, day) => count + day.exercises.length, 0);
  const selectedDay = plan.days[activeDay] ?? plan.days[0];

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={
          <Link to="/workouts" className="hover:text-lime">
            Workout templates
          </Link>
        }
        title={plan.name}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link to="/workouts">
              <Button variant="secondary">
                <ArrowLeft className="h-4 w-4" /> All plans
              </Button>
            </Link>
            <PlanMembersButton
              to="/workouts/$id/members"
              params={{ id: plan.id }}
              count={plan.memberCount ?? 0}
            />
            <Link to="/workouts/$id/edit" params={{ id: plan.id }}>
              <Button>
                <Pencil className="h-4 w-4" /> Edit template
              </Button>
            </Link>
          </div>
        }
      />

      <section className="relative overflow-hidden rounded-2xl border border-border/80 bg-panel shadow-[0_24px_70px_-32px_rgba(0,0,0,0.95)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_0%,rgba(190,255,0,0.12),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.025),transparent_50%)]" />
        <div className="relative grid gap-8 p-6 lg:grid-cols-[minmax(0,1fr)_26rem] lg:p-8">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={plan.visibility === "published" ? "success" : "muted"}>
                {plan.visibility}
              </Badge>
              <StatusBadge status={plan.status} />
              <Badge tone="info">{plan.level || "All levels"}</Badge>
            </div>
            <div className="mt-6 max-w-3xl">
              <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-lime">
                {plan.focus || "Workout program"}
              </div>
              <p className="mt-3 text-sm leading-6 text-muted-foreground md:text-base">
                {plan.description || "A structured training template ready for your members."}
              </p>
            </div>
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm">
              <Meta icon={Target} label="Goal" value={plan.goal || "General fitness"} />
              <Meta icon={Clock3} label="Duration" value={plan.duration || "Flexible duration"} />
            </div>
          </div>

          <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-border/70 bg-background/45 backdrop-blur sm:grid-cols-4">
            <HeroStat value={String(plan.daysPerWeek)} label="Days / week" icon={CalendarDays} />
            <HeroStat value={String(plan.days.length)} label="Sessions" icon={Layers3} />
            <HeroStat value={String(exerciseCount)} label="Exercises" icon={Dumbbell} />
            <HeroStat value={String(plan.memberCount ?? 0)} label="Members" icon={Users} />
          </div>
        </div>
      </section>

      {plan.days.length ? (
        <div className="grid items-start gap-5 xl:grid-cols-[22rem_minmax(0,1fr)]">
          <Panel className="overflow-hidden xl:sticky xl:top-6">
            <div className="border-b border-border px-4 py-3">
              <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Program schedule
              </div>
            </div>
            <nav className="space-y-1 p-2" aria-label="Workout sessions">
              {plan.days.map((day, index) => (
                <button
                  key={day.id}
                  type="button"
                  onClick={() => setActiveDay(index)}
                  className={`group flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors ${
                    index === activeDay
                      ? "bg-lime/10 text-foreground ring-1 ring-lime/20"
                      : "text-muted-foreground hover:bg-panel-2 hover:text-foreground"
                  }`}
                >
                  <span
                    className={`grid h-8 w-8 shrink-0 place-items-center rounded-md text-xs font-semibold tabular-nums ${
                      index === activeDay
                        ? "bg-lime text-lime-foreground"
                        : "border border-border bg-panel-2"
                    }`}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{day.name}</span>
                    <span className="mt-0.5 block truncate text-[11px]">
                      {day.exercises.length} exercises · {day.focus || "General"}
                    </span>
                  </span>
                  <ChevronRight
                    className={`h-4 w-4 shrink-0 transition-transform ${
                      index === activeDay ? "translate-x-0.5 text-lime" : "opacity-40"
                    }`}
                  />
                </button>
              ))}
            </nav>
          </Panel>

          {selectedDay ? <SessionDetail day={selectedDay} index={activeDay} /> : null}
        </div>
      ) : (
        <EmptyState
          title="No training sessions"
          hint="Edit this template and add the first training session."
          action={
            <Link to="/workouts/$id/edit" params={{ id: plan.id }}>
              <Button>Add sessions</Button>
            </Link>
          }
        />
      )}

      {plan.notes ? (
        <Panel>
          <div className="p-5">
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Programming notes
            </h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
              {plan.notes}
            </p>
          </div>
        </Panel>
      ) : null}
    </div>
  );
}

function Meta({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Target;
  label: string;
  value: string;
}) {
  return (
    <span className="inline-flex items-center gap-2">
      <Icon className="h-4 w-4 text-lime" />
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </span>
  );
}

function HeroStat({
  value,
  label,
  icon: Icon,
}: {
  value: string;
  label: string;
  icon: typeof CalendarDays;
}) {
  return (
    <div className="flex min-h-32 flex-col items-center justify-center border-r border-border/70 px-3 text-center last:border-r-0">
      <Icon className="mb-3 h-4 w-4 text-lime" />
      <div className="text-2xl font-semibold tabular-nums">{value}</div>
      <div className="mt-1 text-[10px] uppercase tracking-[0.13em] text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

function SessionDetail({ day, index }: { day: WorkoutDay; index: number }) {
  return (
    <section className="min-w-0 overflow-hidden rounded-xl border border-border/80 bg-panel">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border bg-panel-2/40 px-5 py-5">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-lime">
            Session {String(index + 1).padStart(2, "0")}
          </div>
          <h2 className="mt-1.5 text-xl font-semibold tracking-tight">{day.name}</h2>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-background/40 px-2.5 py-1">
            <Activity className="h-3.5 w-3.5 text-lime" />
            {day.focus || "General training"}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-background/40 px-2.5 py-1">
            <Dumbbell className="h-3.5 w-3.5 text-lime" />
            {day.exercises.length} exercises
          </span>
        </div>
      </div>

      <div className="space-y-3 p-4 md:p-5">
        {day.exercises.map((exercise, exerciseIndex) => (
          <ExerciseCard key={exercise.id} exercise={exercise} exerciseIndex={exerciseIndex} />
        ))}
      </div>
    </section>
  );
}

function mediaFromExercise(exercise: WorkoutExercise): MediaItem[] {
  // Ready for future multi-media arrays from the API.
  const imageUrls = exercise.imageUrls?.length
    ? exercise.imageUrls
    : exercise.imageUrl
      ? [exercise.imageUrl]
      : [];
  const videoUrls = exercise.videoUrls?.length
    ? exercise.videoUrls
    : exercise.videoUrl
      ? [exercise.videoUrl]
      : [];
  return [
    ...imageUrls.map((url, index) => ({
      id: `${exercise.id}-image-${index}`,
      type: "image" as const,
      url,
      label: `Image ${index + 1}`,
    })),
    ...videoUrls.map((url, index) => ({
      id: `${exercise.id}-video-${index}`,
      type: "video" as const,
      url,
      label: `Video ${index + 1}`,
    })),
  ];
}

function ExerciseCard({
  exercise,
  exerciseIndex,
}: {
  exercise: WorkoutExercise;
  exerciseIndex: number;
}) {
  const media = useMemo(() => mediaFromExercise(exercise), [exercise]);

  return (
    <article className="overflow-hidden rounded-xl border border-border/70 bg-background/25 transition-colors hover:border-border hover:bg-background/40">
      <div className="p-4 md:p-5">
        <div className="flex items-start gap-3.5">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border bg-panel-2 text-xs font-semibold tabular-nums text-muted-foreground">
            {String(exerciseIndex + 1).padStart(2, "0")}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-[15px] font-semibold tracking-tight md:text-base">
                {exercise.name}
              </h3>
              {exercise.level ? (
                <Badge tone="info">{exercise.level.replaceAll("_", " ")}</Badge>
              ) : null}
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="rounded-md bg-panel-2/80 px-2 py-0.5">
                {exercise.muscleGroup || "General"}
              </span>
              <span className="rounded-md bg-panel-2/80 px-2 py-0.5">
                {exerciseEquipmentLabel(exercise.equipment)}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <Prescription icon={Layers3} label="Sets" value={String(exercise.sets)} />
          <Prescription icon={Repeat2} label="Reps" value={exercise.reps || "—"} />
          <Prescription
            icon={TimerReset}
            label="Rest"
            value={exercise.restSeconds == null ? "—" : `${exercise.restSeconds}s`}
          />
        </div>

        {exercise.note ? (
          <div className="mt-3 rounded-lg border border-amber-500/15 bg-amber-500/[0.05] px-3 py-2.5 text-xs leading-5 text-amber-100/75">
            <span className="mr-2 font-semibold uppercase tracking-wide text-amber-300">
              Coach note
            </span>
            {exercise.note}
          </div>
        ) : null}
      </div>

      <MediaGallery media={media} exerciseName={exercise.name} />
    </article>
  );
}

function Prescription({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Layers3;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-border/70 bg-panel-2/40 px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <div className="mt-1.5 text-lg font-semibold tabular-nums tracking-tight">{value}</div>
    </div>
  );
}

function MediaGallery({ media, exerciseName }: { media: MediaItem[]; exerciseName: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = media[activeIndex] ?? media[0];

  if (!media.length) {
    return (
      <div className="border-t border-border/60 px-4 py-3 md:px-5">
        <div className="flex items-center gap-3 rounded-lg border border-dashed border-border/80 bg-panel-2/20 px-3 py-3">
          <span className="grid h-9 w-9 place-items-center rounded-md border border-border bg-background/60 text-muted-foreground">
            <ImageIcon className="h-4 w-4" />
          </span>
          <div>
            <div className="text-xs font-medium text-muted-foreground">No media yet</div>
            <div className="mt-0.5 text-[11px] text-muted-foreground/70">
              Multiple images and videos will show in this gallery
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-border/60 bg-panel-2/20 px-4 py-3 md:px-5 md:py-4">
      <div className="mb-2.5 flex items-center justify-between gap-3">
        <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Media · {media.length} asset{media.length === 1 ? "" : "s"}
        </div>
        <div className="flex items-center gap-1.5">
          {media.some((item) => item.type === "image") ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-border/70 px-2 py-0.5 text-[10px] text-muted-foreground">
              <ImageIcon className="h-3 w-3" />
              {media.filter((item) => item.type === "image").length}
            </span>
          ) : null}
          {media.some((item) => item.type === "video") ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-border/70 px-2 py-0.5 text-[10px] text-muted-foreground">
              <Play className="h-3 w-3" />
              {media.filter((item) => item.type === "video").length}
            </span>
          ) : null}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_5.5rem]">
        <a
          href={active.url}
          target="_blank"
          rel="noreferrer"
          className="group relative block aspect-[16/9] overflow-hidden rounded-xl border border-border/80 bg-background"
        >
          {active.type === "image" ? (
            <img
              src={active.url}
              alt={exerciseName}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
          ) : (
            <div className="grid h-full place-items-center bg-[radial-gradient(circle_at_center,rgba(190,255,0,0.16),transparent_55%)]">
              <span className="grid h-14 w-14 place-items-center rounded-full border border-lime/30 bg-lime/15 text-lime shadow-[0_0_30px_-8px_rgba(190,255,0,0.55)]">
                <Play className="ml-0.5 h-6 w-6 fill-current" />
              </span>
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/80 via-black/35 to-transparent px-3 pb-3 pt-10">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-white">
              {active.type === "video" ? (
                <Play className="h-3 w-3 fill-current" />
              ) : (
                <ImageIcon className="h-3 w-3" />
              )}
              {active.label}
            </span>
            <ExternalLink className="h-3.5 w-3.5 text-white/70" />
          </div>
        </a>

        <div className="flex gap-2 overflow-x-auto pb-1 md:flex-col md:overflow-visible md:pb-0">
          {media.map((item, index) => {
            const selected = index === activeIndex;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-label={`Show ${item.label}`}
                aria-pressed={selected}
                className={`relative h-16 w-20 shrink-0 overflow-hidden rounded-lg border transition-all md:h-[4.35rem] md:w-full ${
                  selected
                    ? "border-lime ring-1 ring-lime/30"
                    : "border-border/80 hover:border-border"
                }`}
              >
                {item.type === "image" ? (
                  <img src={item.url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full place-items-center bg-panel text-lime">
                    <Play className="h-4 w-4 fill-current" />
                  </div>
                )}
                <span className="absolute left-1.5 top-1.5 rounded bg-black/65 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white">
                  {item.type === "video" ? "Vid" : "Img"}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
