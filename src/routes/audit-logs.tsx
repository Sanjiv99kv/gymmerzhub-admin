import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel, Table, Tr, Td, Select, Input } from "@/components/admin/ui";
import { auditLogs } from "@/lib/mock";

export const Route = createFileRoute("/audit-logs")({
  head: () => ({
    meta: [
      { title: "Audit Logs · GymmerzHub Admin" },
      { name: "description", content: "Immutable audit log of platform admin actions." },
      { property: "og:title", content: "Audit Logs · GymmerzHub Admin" },
      { property: "og:description", content: "Immutable audit log of platform admin actions." },
    ],
  }),
  component: AuditLogsPage,
});

function AuditLogsPage() {
  return (
    <div>
      <PageHeader breadcrumb="System / Audit logs" title="Audit Logs" subtitle="Every consequential action taken by admins and the platform." />
      <Panel>
        <div className="flex flex-wrap items-center gap-2 p-4 border-b border-border">
          <Input placeholder="Filter actor or target..." className="w-64" />
          <Select defaultValue="all">
            <option value="all">All actions</option>
            <option>template.published</option>
            <option>gym.suspended</option>
            <option>payout.marked_paid</option>
            <option>member.force_verified</option>
          </Select>
          <Select defaultValue="7"><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option></Select>
          <div className="ml-auto text-xs text-muted-foreground">{auditLogs.length} events</div>
        </div>
        <Table head={["Time", "Actor", "Action", "Target", "Metadata"]}>
          {auditLogs.map((l, i) => (
            <Tr key={i}>
              <Td className="text-muted-foreground text-xs whitespace-nowrap">{l.time}</Td>
              <Td className="font-medium">{l.actor}</Td>
              <Td><code className="rounded border border-border bg-panel-2 px-1.5 py-0.5 text-xs text-lime">{l.action}</code></Td>
              <Td>{l.target}</Td>
              <Td className="text-muted-foreground text-xs">{l.meta}</Td>
            </Tr>
          ))}
        </Table>
      </Panel>
    </div>
  );
}
