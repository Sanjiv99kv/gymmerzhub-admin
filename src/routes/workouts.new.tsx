import { createFileRoute } from "@tanstack/react-router";
import { WorkoutPlanEditor } from "@/components/admin/workout-plan-editor";

export const Route = createFileRoute("/workouts/new")({
  head: () => ({ meta: [{ title: "Create Workout Template · GymmerzHub Admin" }] }),
  component: () => <WorkoutPlanEditor mode="create" />,
});
