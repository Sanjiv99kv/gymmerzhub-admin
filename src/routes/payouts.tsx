import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel, Table, Tr, Td, StatusBadge, Button } from "@/components/admin/ui";
import { payouts } from "@/lib/mock";
import { Download } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/payouts")({
  head: () => ({
    meta: [
      { title: "Payouts · GymmerzHub Admin" },
      { name: "description", content: "Mark gym revenue-share payouts as paid and export payout reports." },
      { property: "og:title", content: "Payouts · GymmerzHub Admin" },
      { property: "og:description", content: "Mark gym revenue-share payouts as paid." },
    ],
  }),
  component: PayoutsPage,
});

function PayoutsPage() {
  return (
    <div>
      <PageHeader
        title="Payouts"
        subtitle="Track and mark gym revenue-share payouts."
        actions={<Button variant="secondary"><Download className="h-4 w-4" /> Export CSV</Button>}
      />
      <Panel>
        <Table head={["Gym", "Period", "Amount due", "Status", "Paid at", ""]}>
          {payouts.map((p) => (
            <Tr key={p.id}>
              <Td className="font-medium">{p.gym}</Td>
              <Td className="text-muted-foreground">{p.period}</Td>
              <Td className="tabular-nums text-lime">${p.amount.toFixed(2)}</Td>
              <Td><StatusBadge status={p.status} /></Td>
              <Td className="text-muted-foreground text-xs">{p.paidAt || "—"}</Td>
              <Td className="text-right">
                <div className="inline-flex gap-2">
                  <Button size="sm" variant="ghost">Breakdown</Button>
                  {p.status === "Pending" && (
                    <Button size="sm" onClick={() => {
                      if (confirm(`Mark payout for ${p.gym} (${p.period}) as paid?`)) toast.success("Payout marked as paid");
                    }}>Mark paid</Button>
                  )}
                </div>
              </Td>
            </Tr>
          ))}
        </Table>
      </Panel>
    </div>
  );
}
