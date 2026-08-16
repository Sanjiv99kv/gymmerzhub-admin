import { createFileRoute } from "@tanstack/react-router";
import { DietPlanEditor } from "@/components/admin/diet-plan-editor";

export const Route = createFileRoute("/diets/new")({
  head: () => ({ meta: [{ title: "Create Diet Plan · GymmerzHub Admin" }] }),
  component: NewDietPlanPage,
});

function NewDietPlanPage() {
  return <DietPlanEditor mode="create" />;
}
