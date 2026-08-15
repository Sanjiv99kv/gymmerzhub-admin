import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/members")({
  component: MembersLayout,
});

function MembersLayout() {
  return <Outlet />;
}
