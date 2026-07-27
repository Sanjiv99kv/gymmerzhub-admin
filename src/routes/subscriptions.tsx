import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel, Table, Tr, Td, StatusBadge, StatCard, Select } from "@/components/admin/ui";
import { subscriptions } from "@/lib/mock";

export const Route = createFileRoute("/subscriptions")({
  head: () => ({
    meta: [
      { title: "Subscriptions · GymmerzHub Admin" },
      { name: "description", content: "Track member $3/month platform subscriptions, MRR and failed payments." },
      { property: "og:title", content: "Subscriptions · GymmerzHub Admin" },
      { property: "og:description", content: "Track member platform subscriptions and MRR." },
    ],
  }),
  component: SubsPage,
});

function SubsPage() {
  return (
    <div>
      <PageHeader title="Subscriptions" subtitle="Every member pays $3/month for the GymmerzHub app." />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Active subs" value="1,584" delta="+96" />
        <StatCard label="MRR" value="$4,752" delta="+8.2%" />
        <StatCard label="Failed payments" value="18" hint="past 30 days" />
        <StatCard label="Cancellations · month" value="24" hint="churn 2.1%" />
      </div>
      <Panel>
        <div className="flex items-center gap-2 p-4 border-b border-border">
          <Select defaultValue="all"><option value="all">All statuses</option><option>Active</option><option>Past Due</option><option>Canceled</option></Select>
          <div className="ml-auto text-xs text-muted-foreground">{subscriptions.length} subscriptions</div>
        </div>
        <Table head={["Member", "Email", "Gym", "Status", "Amount", "Next billing", "Started"]}>
          {subscriptions.map((s) => (
            <Tr key={s.id}>
              <Td className="font-medium">{s.member}</Td>
              <Td className="text-muted-foreground">{s.email}</Td>
              <Td>{s.gym}</Td>
              <Td><StatusBadge status={s.status} /></Td>
              <Td className="tabular-nums">${s.amount.toFixed(2)}</Td>
              <Td className="text-muted-foreground text-xs">{s.nextBilling}</Td>
              <Td className="text-muted-foreground text-xs">{s.started}</Td>
            </Tr>
          ))}
        </Table>
      </Panel>
    </div>
  );
}
