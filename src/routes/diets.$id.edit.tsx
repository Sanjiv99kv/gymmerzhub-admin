import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button, EmptyState, PageHeader } from "@/components/admin/ui";
import { DietPlanEditor } from "@/components/admin/diet-plan-editor";
import { fetchAdminDietPlan, type DietPlanDetail } from "@/lib/admin-diet-plans";
import { ApiError, formatApiError } from "@/lib/api";
import { clearAdminSession } from "@/lib/admin-auth";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/diets/$id/edit")({
  head: () => ({ meta: [{ title: "Edit Diet Plan · GymmerzHub Admin" }] }),
  component: EditDietPlanPage,
});

function EditDietPlanPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<DietPlanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    void fetchAdminDietPlan(id)
      .then((data) => {
        if (!cancelled) setPlan(data);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) {
          clearAdminSession();
          toast.error("Session expired. Please sign in again.");
          navigate({ to: "/login" });
          return;
        }
        setError(formatApiError(err, "Could not load diet plan"));
        setPlan(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading plan…
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="space-y-6">
        <PageHeader
          breadcrumb={
            <Link to="/diets" className="hover:text-lime">
              Diet templates
            </Link>
          }
          title="Edit diet plan"
        />
        <EmptyState
          title="Diet plan unavailable"
          hint={error ?? "This plan no longer exists."}
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

  return <DietPlanEditor mode="edit" planId={plan.id} initialPlan={plan} />;
}
