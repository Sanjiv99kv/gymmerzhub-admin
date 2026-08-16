import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { WorkoutPlanEditor } from "@/components/admin/workout-plan-editor";
import { Button, EmptyState, PageHeader } from "@/components/admin/ui";
import { fetchAdminWorkoutPlan, type WorkoutPlan } from "@/lib/admin-workout-plans";
import { ApiError, formatApiError } from "@/lib/api";
import { clearAdminSession } from "@/lib/admin-auth";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/workouts/$id/edit")({
  head: () => ({ meta: [{ title: "Edit Workout Template · GymmerzHub Admin" }] }),
  component: EditWorkoutPlanPage,
});

function EditWorkoutPlanPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    void fetchAdminWorkoutPlan(id).then(setPlan).catch((err) => {
      if (err instanceof ApiError && err.status === 401) { clearAdminSession(); navigate({ to: "/login" }); toast.error("Session expired. Please sign in again."); return; }
      setError(formatApiError(err, "Could not load workout template"));
    });
  }, [id, navigate]);
  if (!plan && !error) return <div className="flex justify-center py-24"><Loader2 className="h-5 w-5 animate-spin text-lime" /></div>;
  if (!plan) return <div className="space-y-6"><PageHeader title="Edit workout template" /><EmptyState title="Workout template unavailable" hint={error ?? undefined} action={<Link to="/workouts"><Button><ArrowLeft className="h-4 w-4" /> Back to templates</Button></Link>} /></div>;
  return <WorkoutPlanEditor mode="edit" planId={plan.id} initialPlan={plan} />;
}
