import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/diets")({
  head: () => ({
    meta: [
      { title: "Diet Templates · GymmerzHub Admin" },
      { name: "description", content: "Admin-built global diet templates for the platform." },
      { property: "og:title", content: "Diet Templates · GymmerzHub Admin" },
      {
        property: "og:description",
        content: "Admin-built global diet templates for the platform.",
      },
    ],
  }),
  component: Outlet,
});
