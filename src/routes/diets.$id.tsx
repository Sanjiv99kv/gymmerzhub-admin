import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/diets/$id")({
  component: Outlet,
});
