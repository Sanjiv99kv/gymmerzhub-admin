import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, Panel, Table, Tr, Td, StatusBadge, Tabs, Input, Button, Badge, RowActions } from "@/components/admin/ui";
import { admins } from "@/lib/mock";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/admins")({
  head: () => ({
    meta: [
      { title: "Admins · GymmerzHub" },
      { name: "description", content: "Manage who can access the GymmerzHub admin console." },
      { property: "og:title", content: "Admins · GymmerzHub" },
      { property: "og:description", content: "Manage who can access the GymmerzHub admin console." },
    ],
  }),
  component: AdminsPage,
});

function AdminsPage() {
  const [tab, setTab] = useState("ALL");
  const rows = admins.filter(a => tab === "ALL" || a.status.toUpperCase() === tab);

  return (
    <div>
      <PageHeader
        breadcrumb="System / Admins"
        title="Access management"
        subtitle="Manage who can access the GymmerzHub admin console."
        actions={<Button><Plus className="h-4 w-4" /> Add admin</Button>}
      />
      <Panel>
        <div className="p-4 border-b border-border">
          <Tabs tabs={["ALL", "ACTIVE", "INACTIVE"]} active={tab} onChange={setTab} />
          <div className="mt-4"><Input placeholder="Search by email..." className="w-72" /></div>
        </div>
        <Table head={["Email", "Role", "Status", "Last login", ""]}>
          {rows.map((a) => (
            <Tr key={a.id}>
              <Td className="font-medium">{a.email}</Td>
              <Td><Badge tone="success">{a.role}</Badge></Td>
              <Td><StatusBadge status={a.status} /></Td>
              <Td className="text-muted-foreground text-xs">{a.lastLogin}</Td>
              <Td><RowActions /></Td>
            </Tr>
          ))}
        </Table>
      </Panel>
    </div>
  );
}
