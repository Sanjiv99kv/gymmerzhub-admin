import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel, Table, Tr, Td, StatusBadge, Select, Button } from "@/components/admin/ui";
import { joinRequests } from "@/lib/mock";
import { toast } from "sonner";
import { Info } from "lucide-react";

export const Route = createFileRoute("/join-requests")({
  head: () => ({
    meta: [
      { title: "Join Requests · GymmerzHub Admin" },
      { name: "description", content: "Audit member join requests and owner invites across all gyms." },
      { property: "og:title", content: "Join Requests · GymmerzHub Admin" },
      { property: "og:description", content: "Audit member join requests and owner invites." },
    ],
  }),
  component: JoinRequestsPage,
});

function JoinRequestsPage() {
  return (
    <div>
      <PageHeader title="Join Requests" subtitle="Members request to join a gym or accept an owner invite. Gym owners approve and verify membership. Admin views for support." />

      <div className="mb-4 flex items-start gap-3 rounded-lg border border-border bg-panel-2 p-4 text-sm text-muted-foreground">
        <Info className="h-4 w-4 mt-0.5 shrink-0 text-lime" />
        <div>Approvals are performed by gym owners. Use <span className="text-foreground">Force approve</span> only in support scenarios where the owner is unreachable.</div>
      </div>

      <Panel>
        <div className="flex items-center gap-2 p-4 border-b border-border">
          <Select defaultValue="all"><option value="all">All gyms</option><option>Ironline Fitness</option><option>Peak Strength Club</option></Select>
          <Select defaultValue="all"><option value="all">All statuses</option><option>Pending</option><option>Approved</option><option>Rejected</option></Select>
          <div className="ml-auto text-xs text-muted-foreground">{joinRequests.length} requests</div>
        </div>
        <Table head={["Member", "Gym", "Source", "Requested at", "Status", ""]}>
          {joinRequests.map((r) => (
            <Tr key={r.id}>
              <Td className="font-medium">{r.member}</Td>
              <Td>{r.gym}</Td>
              <Td className="text-muted-foreground">{r.source}</Td>
              <Td className="text-muted-foreground text-xs">{r.requested}</Td>
              <Td><StatusBadge status={r.status} /></Td>
              <Td className="text-right">
                {r.status === "Pending" && (
                  <Button size="sm" variant="secondary" onClick={() => {
                    if (confirm(`Force approve join request for ${r.member}?`)) toast.success("Request force-approved");
                  }}>Force approve</Button>
                )}
              </Td>
            </Tr>
          ))}
        </Table>
      </Panel>
    </div>
  );
}
