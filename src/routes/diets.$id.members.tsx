import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button, EmptyState, PageHeader } from "@/components/admin/ui";
import { PlanMembersPage } from "@/components/admin/plan-members-panel";
import {
  fetchAdminDietPlan,
  fetchAdminDietPlanMembers,
  type DietPlanDetail,
} from "@/lib/admin-diet-plans";
import { ApiError, formatApiError } from "@/lib/api";
import { clearAdminSession } from "@/lib/admin-auth";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/diets/$id/members")({
  head: () => ({ meta: [{ title: "Diet Members · GymmerzHub Admin" }] }),
  component: DietPlanMembersPage,
});

function DietPlanMembersPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<DietPlanDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetchAdminDietPlan(id)
      .then(setPlan)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          clearAdminSession();
          navigate({ to: "/login" });
          toast.error("Session expired. Please sign in again.");
          return;
        }
        setError(formatApiError(err, "Could not load diet plan"));
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
        <PageHeader title="Diet members" />
        <EmptyState
          title="Diet plan unavailable"
          hint={error ?? undefined}
          action={
            <Link to="/diets">
              <Button>
                <ArrowLeft className="h-4 w-4" /> Back to plans
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
      fetchMembers={fetchAdminDietPlanMembers}
      entityLabel="diet"
      backLink={{ to: "/diets/$id", params: { id: plan.id }, label: plan.name }}
    />
  );
}
