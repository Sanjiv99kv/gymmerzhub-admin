import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, Panel, Table, Tr, Td, StatCard } from "@/components/admin/ui";
import { revenueShare } from "@/lib/mock";
import { PercentCircle, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/revenue-share")({
  head: () => ({
    meta: [
      { title: "Revenue Share · GymmerzHub Admin" },
      { name: "description", content: "Gyms earn 20% of platform subscription revenue from linked members." },
      { property: "og:title", content: "Revenue Share · GymmerzHub Admin" },
      { property: "og:description", content: "20% platform subscription revenue share to gyms." },
    ],
  }),
  component: RevenueSharePage,
});

function RevenueSharePage() {
  const gross = revenueShare.reduce((a, b) => a + b.gross, 0);
  const share = revenueShare.reduce((a, b) => a + b.share, 0);
  const keep = gross - share;

  return (
    <div>
      <PageHeader title="Revenue Share" subtitle="How platform subscription revenue is split with gyms." />

      <div className="mb-6 flex items-start gap-3 rounded-lg border border-lime/25 bg-lime/5 p-4 text-sm">
        <PercentCircle className="h-4 w-4 mt-0.5 text-lime" />
        <div className="text-muted-foreground">Gyms earn <span className="text-foreground font-medium">20%</span> of platform subscription revenue from members linked to their gym.</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard label="Gross subscription revenue" value={`$${gross.toFixed(2)}`} hint="Jul 2026" />
        <StatCard label="Gym share (20%)" value={`$${share.toFixed(2)}`} hint="owed this period" />
        <StatCard label="Platform keep (80%)" value={`$${keep.toFixed(2)}`} />
      </div>

      <Panel
        title="By gym · Jul 2026"
        actions={<Link to="/payouts" className="text-xs text-lime hover:underline inline-flex items-center gap-1">View payouts <ArrowRight className="h-3 w-3" /></Link>}
      >
        <Table head={["Gym", "Active subscribed members", "Gross", "Gym share (20%)", "Period"]}>
          {revenueShare.map((r) => (
            <Tr key={r.gym}>
              <Td className="font-medium">{r.gym}</Td>
              <Td className="tabular-nums">{r.activeSubs}</Td>
              <Td className="tabular-nums">${r.gross.toFixed(2)}</Td>
              <Td className="tabular-nums text-lime">${r.share.toFixed(2)}</Td>
              <Td className="text-muted-foreground text-xs">{r.period}</Td>
            </Tr>
          ))}
        </Table>
      </Panel>
    </div>
  );
}
