import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, Panel, Table, Tr, Td, StatusBadge, Input, Tabs, RowActions, Button } from "@/components/admin/ui";
import { members } from "@/lib/mock";
import { toast } from "sonner";

export const Route = createFileRoute("/members")({
  head: () => ({
    meta: [
      { title: "Members · GymmerzHub Admin" },
      { name: "description", content: "View and audit members across all GymmerzHub gyms." },
      { property: "og:title", content: "Members · GymmerzHub Admin" },
      { property: "og:description", content: "View and audit members across all GymmerzHub gyms." },
    ],
  }),
  component: MembersPage,
});

function MembersPage() {
  const [tab, setTab] = useState("ALL");
  const [q, setQ] = useState("");
  const filtered = members.filter((m) => {
    if (tab === "ACTIVE" && m.subStatus !== "Active") return false;
    if (tab === "PENDING" && m.gymStatus !== "Pending") return false;
    if (tab === "SUSPENDED" && m.gymStatus !== "Expired") return false;
    if (q && !(m.name.toLowerCase().includes(q.toLowerCase()) || m.email.toLowerCase().includes(q.toLowerCase()))) return false;
    return true;
  });

  return (
    <div>
      <PageHeader
        title="Members"
        subtitle="Members are onboarded by gym owners. Admin has view and rare force-fix actions."
      />
      <Panel>
        <div className="p-4 border-b border-border">
          <Tabs tabs={["ALL", "ACTIVE", "PENDING", "SUSPENDED"]} active={tab} onChange={setTab} />
          <div className="mt-4 flex items-center gap-2">
            <Input placeholder="Search by name or email..." value={q} onChange={(e) => setQ(e.target.value)} className="w-72" />
            <div className="ml-auto text-xs text-muted-foreground">{filtered.length} members</div>
          </div>
        </div>
        <Table head={["Name", "Email", "Gym", "Gym status", "Subscription", "Joined", ""]}>
          {filtered.map((m) => (
            <Tr key={m.id}>
              <Td className="font-medium">{m.name}</Td>
              <Td className="text-muted-foreground">{m.email}</Td>
              <Td>{m.gym}</Td>
              <Td><StatusBadge status={m.gymStatus} /></Td>
              <Td><StatusBadge status={m.subStatus} /></Td>
              <Td className="text-muted-foreground text-xs">{m.joined}</Td>
              <Td className="text-right">
                <div className="flex items-center justify-end gap-2">
                  {m.gymStatus === "Pending" && (
                    <Button size="sm" variant="secondary" onClick={() => {
                      if (confirm("Force verify this member? This bypasses owner review.")) toast.success("Member force-verified");
                    }}>Force verify</Button>
                  )}
                  <RowActions />
                </div>
              </Td>
            </Tr>
          ))}
        </Table>
      </Panel>
    </div>
  );
}
