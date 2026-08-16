import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Button, Input, PageHeader, Panel, Select } from "@/components/admin/ui";
import {
  createAdminWorkoutPlan,
  updateAdminWorkoutPlan,
  type WorkoutPlan,
  type WorkoutStatus,
  type WorkoutVisibility,
} from "@/lib/admin-workout-plans";
import { fetchAdminExercises, type AdminExercise } from "@/lib/admin-exercises";
import { formatApiError } from "@/lib/api";
import { ChevronLeft, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

type EditorExercise = { key: string; exerciseId: string; sets: string; reps: string; restSeconds: string; note: string };
type EditorDay = { key: string; name: string; focus: string; exercises: EditorExercise[] };
type Props = { mode: "create" | "edit"; planId?: string; initialPlan?: WorkoutPlan };
const key = () => crypto.randomUUID();
const emptyExercise = (): EditorExercise => ({ key: key(), exerciseId: "", sets: "3", reps: "8-12", restSeconds: "90", note: "" });
const emptyDay = (): EditorDay => ({ key: key(), name: "New session", focus: "", exercises: [emptyExercise()] });

function fromPlan(plan?: WorkoutPlan): EditorDay[] {
  if (!plan?.days.length) return [emptyDay()];
  return plan.days.map((day) => ({
    key: day.id,
    name: day.name,
    focus: day.focus || "",
    exercises: day.exercises.map((exercise) => ({
      key: exercise.id,
      exerciseId: exercise.exerciseId,
      sets: String(exercise.sets),
      reps: exercise.reps || "",
      restSeconds: exercise.restSeconds == null ? "" : String(exercise.restSeconds),
      note: exercise.note || "",
    })),
  }));
}

export function WorkoutPlanEditor({ mode, planId, initialPlan }: Props) {
  const navigate = useNavigate();
  const [catalog, setCatalog] = useState<AdminExercise[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState(initialPlan?.name || "");
  const [level, setLevel] = useState(initialPlan?.level || "");
  const [focus, setFocus] = useState(initialPlan?.focus || "");
  const [goal, setGoal] = useState(initialPlan?.goal || "");
  const [duration, setDuration] = useState(initialPlan?.duration || "");
  const [description, setDescription] = useState(initialPlan?.description || "");
  const [notes, setNotes] = useState(initialPlan?.notes || "");
  const [status, setStatus] = useState<WorkoutStatus>(initialPlan?.status || "active");
  const [visibility, setVisibility] = useState<WorkoutVisibility>(initialPlan?.visibility || "draft");
  const [days, setDays] = useState<EditorDay[]>(() => fromPlan(initialPlan));

  useEffect(() => {
    void fetchAdminExercises({ status: "active", pageSize: 100 })
      .then((data) => setCatalog(data.items))
      .catch((err) => toast.error(formatApiError(err, "Could not load exercise catalog")))
      .finally(() => setLoadingCatalog(false));
  }, []);

  const selectedCount = useMemo(() => days.reduce((total, day) => total + day.exercises.filter((x) => x.exerciseId).length, 0), [days]);
  function patchDay(dayKey: string, patch: (day: EditorDay) => EditorDay) { setDays((current) => current.map((day) => day.key === dayKey ? patch(day) : day)); }
  function patchExercise(dayKey: string, exerciseKey: string, patch: Partial<EditorExercise>) { patchDay(dayKey, (day) => ({ ...day, exercises: day.exercises.map((exercise) => exercise.key === exerciseKey ? { ...exercise, ...patch } : exercise) })); }
  function removeDay(dayKey: string) { setDays((current) => current.length > 1 ? current.filter((day) => day.key !== dayKey) : current); }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const validDays = days
      .map((day) => ({ ...day, exercises: day.exercises.filter((exercise) => exercise.exerciseId) }))
      .filter((day) => day.exercises.length);
    if (!name.trim()) return toast.error("Add a template name.");
    if (visibility === "published" && !validDays.length) return toast.error("A published template needs at least one session.");
    const body = {
      name: name.trim(), level: level.trim() || null, focus: focus.trim() || null, goal: goal.trim() || null,
      duration: duration.trim() || null, description: description.trim() || null, notes: notes.trim() || null,
      daysPerWeek: validDays.length, status, visibility,
      days: validDays.map((day) => ({ name: day.name.trim() || "Session", focus: day.focus.trim() || null, exercises: day.exercises.map((exercise) => ({
        exerciseId: exercise.exerciseId, sets: Number(exercise.sets) || 0, reps: exercise.reps.trim() || null,
        restSeconds: exercise.restSeconds === "" ? null : Number(exercise.restSeconds), note: exercise.note.trim() || null,
      })) })),
    };
    setSubmitting(true);
    try {
      const plan = mode === "edit" && planId ? await updateAdminWorkoutPlan(planId, body) : await createAdminWorkoutPlan(body);
      toast.success(mode === "edit" ? "Workout template updated." : "Workout template created.");
      navigate({ to: "/workouts/$id", params: { id: plan.id } });
    } catch (err) { toast.error(formatApiError(err, "Could not save workout template")); } finally { setSubmitting(false); }
  }

  return <form className="space-y-6" onSubmit={submit}>
    <PageHeader
      breadcrumb={<Link to="/workouts" className="hover:text-lime">Workout templates</Link>}
      title={mode === "edit" ? "Edit workout template" : "Create workout template"}
      subtitle="Define the plan, then assemble each training session from the exercise catalog."
      actions={<div className="flex gap-2"><Link to="/workouts"><Button type="button" variant="secondary"><ChevronLeft className="h-4 w-4" /> Cancel</Button></Link><Button type="submit" disabled={submitting}>{submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}{mode === "edit" ? "Save changes" : "Create template"}</Button></div>}
    />
    <Panel>
      <div className="grid gap-4 p-5 md:grid-cols-2">
        <Field label="Template name"><Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Upper / Lower Strength" className="w-full" /></Field>
        <Field label="Training level"><Input value={level} onChange={(e) => setLevel(e.target.value)} placeholder="Beginner, intermediate…" className="w-full" /></Field>
        <Field label="Focus"><Input value={focus} onChange={(e) => setFocus(e.target.value)} placeholder="e.g. Hypertrophy" className="w-full" /></Field>
        <Field label="Goal"><Input value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="e.g. Gain muscle" className="w-full" /></Field>
        <Field label="Duration"><Input value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="e.g. 45–60 min" className="w-full" /></Field>
        <div className="grid grid-cols-2 gap-4"><Field label="Visibility"><Select value={visibility} onChange={(e) => setVisibility(e.target.value as WorkoutVisibility)} className="h-9 w-full"><option value="draft">Draft</option><option value="published">Published</option></Select></Field><Field label="Status"><Select value={status} onChange={(e) => setStatus(e.target.value as WorkoutStatus)} className="h-9 w-full"><option value="active">Active</option><option value="inactive">Inactive</option></Select></Field></div>
        <div className="md:col-span-2"><Field label="Description"><textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full rounded-md border border-border bg-panel-2 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-lime" placeholder="What does this template help members achieve?" /></Field></div>
      </div>
    </Panel>
    <Panel>
      <div className="flex items-center justify-between border-b border-border px-5 py-4"><div><h2 className="font-semibold">Training sessions</h2><p className="mt-1 text-xs text-muted-foreground">{selectedCount} exercises selected across {days.length} sessions</p></div><Button type="button" variant="secondary" onClick={() => setDays((current) => [...current, emptyDay()])}><Plus className="h-4 w-4" /> Add session</Button></div>
      <div className="space-y-4 p-4">{days.map((day, dayIndex) => <div key={day.key} className="overflow-hidden rounded-xl border border-border bg-panel-2/30">
        <div className="grid gap-3 border-b border-border p-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"><Field label={`Session ${dayIndex + 1}`}><Input value={day.name} onChange={(e) => patchDay(day.key, (x) => ({ ...x, name: e.target.value }))} className="w-full" /></Field><Field label="Focus · optional"><Input value={day.focus} onChange={(e) => patchDay(day.key, (x) => ({ ...x, focus: e.target.value }))} placeholder="Chest / shoulders / triceps" className="w-full" /></Field><Button type="button" variant="ghost" size="sm" disabled={days.length === 1} onClick={() => removeDay(day.key)}><Trash2 className="h-3.5 w-3.5" /> Remove</Button></div>
        <div className="space-y-2 p-4">{day.exercises.map((exercise) => <div key={exercise.key} className="grid gap-2 rounded-lg border border-border/70 bg-background/30 p-3 md:grid-cols-[minmax(0,1fr)_4.5rem_6rem_6rem_2.25rem]">
          <Select value={exercise.exerciseId} onChange={(e) => patchExercise(day.key, exercise.key, { exerciseId: e.target.value })} className="h-9 w-full" disabled={loadingCatalog}><option value="">{loadingCatalog ? "Loading catalog…" : "Choose exercise…"}</option>{catalog.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.muscleGroup || "General"} · {item.equipment || "—"}</option>)}</Select>
          <Input type="number" min="0" max="50" value={exercise.sets} onChange={(e) => patchExercise(day.key, exercise.key, { sets: e.target.value })} aria-label="Sets" placeholder="Sets" />
          <Input value={exercise.reps} onChange={(e) => patchExercise(day.key, exercise.key, { reps: e.target.value })} aria-label="Reps" placeholder="Reps" />
          <Input type="number" min="0" max="600" value={exercise.restSeconds} onChange={(e) => patchExercise(day.key, exercise.key, { restSeconds: e.target.value })} aria-label="Rest seconds" placeholder="Rest (s)" />
          <button type="button" aria-label="Remove exercise" disabled={day.exercises.length === 1} onClick={() => patchDay(day.key, (x) => ({ ...x, exercises: x.exercises.filter((item) => item.key !== exercise.key) }))} className="grid h-9 w-9 place-items-center rounded-md border border-border text-muted-foreground hover:text-foreground disabled:opacity-40"><Trash2 className="h-3.5 w-3.5" /></button>
        </div>)}<Button type="button" size="sm" variant="secondary" onClick={() => patchDay(day.key, (x) => ({ ...x, exercises: [...x.exercises, emptyExercise()] }))}><Plus className="h-3.5 w-3.5" /> Add exercise</Button></div>
      </div>)}</div>
    </Panel>
    <Panel><div className="space-y-3 p-5"><h2 className="font-semibold">Internal notes</h2><textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full rounded-md border border-border bg-panel-2 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-lime" placeholder="Programming notes for your team" /></div></Panel>
  </form>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="flex min-w-0 flex-col gap-1.5"><span className="text-xs font-medium text-muted-foreground">{label}</span>{children}</label>; }
