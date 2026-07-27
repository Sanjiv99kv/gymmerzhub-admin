import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, Button, Panel, Table, Tr, Td, StatusBadge, Input, Select, RowActions } from "@/components/admin/ui";
import { gyms } from "@/lib/mock";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/gyms")({
  head: () => ({
    meta: [
      { title: "Gyms · GymmerzHub Admin" },
      { name: "description", content: "Manage gyms on the GymmerzHub platform — status, owners, members and revenue share." },
      { property: "og:title", content: "Gyms · GymmerzHub Admin" },
      { property: "og:description", content: "Manage gyms on the GymmerzHub platform." },
    ],
  }),
  component: GymsPage,
});

function GymsPage() {
  return (
    <div>
      <PageHeader
        title="Gyms"
        subtitle="All gym locations on the platform. Add gyms and their owner contact — members are invited by owners, not admins."
        actions={<Button><Plus className="h-4 w-4" /> Add gym</Button>}
      />

      <Panel>
        <div className="flex flex-wrap items-center gap-2 p-4 border-b border-border">
          <Input placeholder="Search gyms..." className="w-64" />
          <Select defaultValue="all"><option value="all">All statuses</option><option>Verified</option><option>Pending</option><option>Suspended</option></Select>
          <Select defaultValue="all"><option value="all">All cities</option><option>Austin</option><option>Denver</option><option>Miami</option></Select>
          <div className="ml-auto text-xs text-muted-foreground">{gyms.length} gyms</div>
        </div>
        <Table head={["Gym name", "City", "Owner", "Members", "Status", "Revenue share due", "Created", ""]}>
          {gyms.map((g) => (
            <Tr key={g.id}>
              <Td>
                <Link to="/gyms/$id" params={{ id: g.id }} className="font-medium hover:text-lime">{g.name}</Link>
              </Td>
              <Td className="text-muted-foreground">{g.city}</Td>
              <Td>{g.owner}</Td>
              <Td className="tabular-nums">{g.members}</Td>
              <Td><StatusBadge status={g.status} /></Td>
              <Td className="tabular-nums">{g.revenueDue > 0 ? <span className="text-lime">${g.revenueDue.toFixed(2)}</span> : <span className="text-muted-foreground">—</span>}</Td>
              <Td className="text-muted-foreground text-xs">{g.created}</Td>
              <Td><RowActions /></Td>
            </Tr>
          ))}
        </Table>
      </Panel>
    </div>
  );
}
