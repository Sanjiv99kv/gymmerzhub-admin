import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  PageHeader,
  StatCard,
  Panel,
  Badge,
  StatusBadge,
  Select,
} from "@/components/admin/ui";
import {
  gyms,
  members,
  aiPlans,
  payouts,
  revenueShare,
  chartData,
  auditLogs,
} from "@/lib/mock";
import { fetchAdminJoinRequestSummary } from "@/lib/admin-join-requests";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  ArrowUpRight,
  Building2,
  CreditCard,
  Banknote,
  AlertTriangle,
  ClipboardList,
  Sparkles,
  ShieldAlert,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard · GymmerzHub Admin" },
      {
        name: "description",
        content:
          "Platform overview for GymmerzHub — gyms, members, subscriptions, revenue and ops attention.",
      },
    ],
  }),
  component: Dashboard,
});

function money(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function moneyExact(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(n);
}

function Dashboard() {
  const [pendingJoins, setPendingJoins] = useState(0);
  const verifiedGyms = gyms.filter((g) => g.status === "Verified").length;
  const pendingGyms = gyms.filter((g) => g.status === "Pending").length;
  const suspendedGyms = gyms.filter((g) => g.status === "Suspended").length;
  const activeMembers = members.filter((m) => m.status === "active").length;
  const pastDue = members.filter((m) => m.status === "suspended").length;
  const flaggedPlans = aiPlans.filter((p) =>
    ["Flagged", "Hidden"].includes(p.status),
  ).length;

  useEffect(() => {
    let cancelled = false;
    void fetchAdminJoinRequestSummary()
      .then((summary) => {
        if (!cancelled) setPendingJoins(summary.pending ?? 0);
      })
      .catch(() => {
        if (!cancelled) setPendingJoins(0);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  const pendingPayoutTotal = payouts
    .filter((p) => p.status === "Pending")
    .reduce((sum, p) => sum + p.amount, 0);
  const pendingPayoutCount = payouts.filter((p) => p.status === "Pending").length;
  const mrr = activeMembers * 3;
  const topGyms = [...revenueShare].sort((a, b) => b.share - a.share).slice(0, 5);
  const chartTotal = chartData.reduce((s, d) => s + d.value, 0);
  const chartPrev = chartData.slice(0, 15).reduce((s, d) => s + d.value, 0);
  const chartCurr = chartData.slice(15).reduce((s, d) => s + d.value, 0);
  const revenueDeltaPct =
    chartPrev > 0 ? (((chartCurr - chartPrev) / chartPrev) * 100).toFixed(1) : "0";

  const attention = [
    {
      label: "Gyms awaiting verification",
      count: pendingGyms,
      tone: "warn" as const,
      to: "/gyms",
      icon: Building2,
    },
    {
      label: "Pending join requests",
      count: pendingJoins,
      tone: "warn" as const,
      to: "/join-requests",
      icon: ClipboardList,
    },
    {
      label: "Past-due subscriptions",
      count: pastDue,
      tone: "danger" as const,
      to: "/subscriptions",
      icon: CreditCard,
    },
    {
      label: "AI plans needing review",
      count: flaggedPlans,
      tone: "warn" as const,
      to: "/ai-plans",
      icon: Sparkles,
    },
    {
      label: "Suspended gyms",
      count: suspendedGyms,
      tone: "danger" as const,
      to: "/gyms",
      icon: ShieldAlert,
    },
    {
      label: "Payouts ready to release",
      count: pendingPayoutCount,
      tone: "info" as const,
      to: "/payouts",
      icon: Banknote,
    },
  ].filter((item) => item.count > 0);

  const attentionTotal = attention.reduce((s, a) => s + a.count, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle="Platform pulse — what needs action, and how GymmerzHub is performing."
        actions={
          <>
            <Select defaultValue="30" aria-label="Date range">
              <option value="15">Last 15 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </Select>
            <Link
              to="/payouts"
              className="inline-flex h-8 items-center justify-center rounded-md border border-border bg-panel-2 px-3 text-xs font-medium transition-colors hover:bg-accent"
            >
              Review payouts
            </Link>
          </>
        }
      />

      {/* Primary KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Verified gyms"
          value={String(verifiedGyms)}
          delta={`+${pendingGyms} pending`}
          hint={`${gyms.length} total · ${suspendedGyms} suspended`}
        />
        <StatCard
          label="Active members"
          value={activeMembers.toLocaleString()}
          delta={`${members.filter((m) => m.status === "inactive").length} inactive`}
          hint={`${members.length} total accounts on platform`}
        />
        <StatCard
          label="Platform MRR"
          value={money(mrr)}
          delta="+8.2%"
          hint="$3 / active member subscription"
        />
        <StatCard
          label="Payouts queued"
          value={moneyExact(pendingPayoutTotal)}
          hint={`${pendingPayoutCount} gym payouts this period`}
        />
      </div>

      {/* Attention + chart */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <Panel
          className="xl:col-span-3"
          title="Platform revenue"
          actions={
            <Badge tone={Number(revenueDeltaPct) >= 0 ? "success" : "danger"}>
              {Number(revenueDeltaPct) >= 0 ? "+" : ""}
              {revenueDeltaPct}% vs prior half
            </Badge>
          }
        >
          <div className="flex items-baseline justify-between gap-4 border-b border-border px-5 py-4">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                30-day volume
              </div>
              <div className="mt-1 text-2xl font-semibold tracking-tight">
                {money(chartTotal)}
              </div>
            </div>
            <div className="text-right text-xs text-muted-foreground">
              Member subscription collections
              <br />
              before gym revenue share
            </div>
          </div>
          <div className="h-64 p-4 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
                <defs>
                  <linearGradient id="dashFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.92 0.22 125)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="oklch(0.92 0.22 125)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                <XAxis
                  dataKey="day"
                  stroke="#555"
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  interval={4}
                />
                <YAxis stroke="#555" tickLine={false} axisLine={false} fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: "#111",
                    border: "1px solid #2a2a2a",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(value: number) => [money(value), "Revenue"]}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="oklch(0.92 0.22 125)"
                  strokeWidth={2}
                  fill="url(#dashFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel
          className="xl:col-span-2"
          title="Needs attention"
          actions={
            attentionTotal > 0 ? (
              <Badge tone="warn">{attentionTotal} open</Badge>
            ) : (
              <Badge tone="success">Clear</Badge>
            )
          }
        >
          {attention.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-5 py-12 text-center">
              <div className="mb-3 grid h-10 w-10 place-items-center rounded-full bg-lime/15 text-lime">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div className="text-sm font-medium">Nothing urgent</div>
              <div className="mt-1 text-xs text-muted-foreground">
                No verification, payout, or review queues right now.
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-border/60">
              {attention.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.label}>
                    <Link
                      to={item.to}
                      className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-panel-2/60"
                    >
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-border bg-panel-2 text-muted-foreground">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium">{item.label}</div>
                        <div className="text-[11px] text-muted-foreground">Open queue</div>
                      </div>
                      <Badge tone={item.tone}>{item.count}</Badge>
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>

      {/* Top gyms + audit */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <Panel
          className="xl:col-span-3"
          title="Top gyms by revenue share"
          actions={
            <Link to="/revenue-share" className="text-xs font-medium text-lime hover:text-lime/80">
              View all
            </Link>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {["Gym", "Active subs", "Gross", "Gym share (20%)"].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topGyms.map((g, i) => (
                  <tr
                    key={g.gym}
                    className="border-b border-border/60 transition-colors hover:bg-panel-2/50"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="grid h-7 w-7 place-items-center rounded-md bg-panel-2 text-[11px] font-semibold text-muted-foreground">
                          {i + 1}
                        </span>
                        <div>
                          <div className="font-medium">{g.gym}</div>
                          <div className="text-[11px] text-muted-foreground">{g.period}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground">{g.activeSubs}</td>
                    <td className="px-5 py-3.5">{moneyExact(g.gross)}</td>
                    <td className="px-5 py-3.5 font-medium text-lime">{moneyExact(g.share)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel
          className="xl:col-span-2"
          title="Recent platform events"
          actions={
            <Link to="/audit-logs" className="text-xs font-medium text-lime hover:text-lime/80">
              Audit log
            </Link>
          }
        >
          <ul className="divide-y divide-border/60">
            {auditLogs.slice(0, 6).map((log) => (
              <li key={`${log.time}-${log.action}`} className="px-5 py-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{log.target}</div>
                    <div className="mt-0.5 truncate text-[11px] text-muted-foreground">
                      {log.action.replaceAll(".", " · ")} · {log.actor}
                    </div>
                  </div>
                  <div className="shrink-0 text-[10px] tabular-nums text-muted-foreground">
                    {log.time.split(" ")[1]}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      {/* Health strip */}
      <Panel title="Subscription health">
        <div className="grid grid-cols-2 gap-px bg-border sm:grid-cols-4">
          {[
            {
              label: "Active",
              value: activeMembers,
              tone: "success" as const,
            },
            {
              label: "Inactive",
              value: members.filter((m) => m.status === "inactive").length,
              tone: "info" as const,
            },
            {
              label: "Suspended",
              value: pastDue,
              tone: "warn" as const,
            },
            {
              label: "Total",
              value: members.length,
              tone: "danger" as const,
            },
          ].map((item) => (
            <div key={item.label} className="bg-panel px-5 py-4">
              <div className="flex items-center justify-between gap-2">
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  {item.label}
                </div>
                <StatusBadge status={item.label} />
              </div>
              <div className="mt-2 text-2xl font-semibold tracking-tight">{item.value}</div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
