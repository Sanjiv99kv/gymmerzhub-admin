import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button, EmptyState, PageHeader } from "@/components/admin/ui";
import { PlanMembersPage } from "@/components/admin/plan-members-panel";
import {
  fetchAdminWorkoutPlan,
  fetchAdminWorkoutPlanMembers,
  type WorkoutPlan,
} from "@/lib/admin-workout-plans";
import { ApiError, formatApiError } from "@/lib/api";
import { clearAdminSession } from "@/lib/admin-auth";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/workouts/$id/members")({
  head: () => ({ meta: [{ title: "Workout Members · GymmerzHub Admin" }] }),
  component: WorkoutPlanMembersPage,
});

function WorkoutPlanMembersPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [error, setError] = useState<string | null>(null);

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
        <PageHeader title="Workout members" />
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

  return (
    <PlanMembersPage
      planId={plan.id}
      planName={plan.name}
      memberCount={plan.memberCount ?? 0}
      fetchMembers={fetchAdminWorkoutPlanMembers}
      entityLabel="workout"
      backLink={{ to: "/workouts/$id", params: { id: plan.id }, label: plan.name }}
    />
  );
}
