import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, StatCard, Panel, Badge, Select } from "@/components/admin/ui";
import { chartData, recentActivity } from "@/lib/mock";
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { ArrowUpRight } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard · GymmerzHub Admin" },
      { name: "description", content: "Platform overview for GymmerzHub — members, subscriptions, revenue and activity." },
      { property: "og:title", content: "Dashboard · GymmerzHub Admin" },
      { property: "og:description", content: "Platform overview for GymmerzHub." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Platform overview for GymmerzHub"
        actions={
          <>
            <Select defaultValue="15">
              <option value="15">Last 15 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </Select>
            <Select defaultValue="all">
              <option value="all">All regions</option>
              <option value="us">United States</option>
              <option value="eu">Europe</option>
            </Select>
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active Members" value="1,742" delta="+128" hint="vs. prior 15 days" />
        <StatCard label="Active $3 Subscriptions" value="1,584" delta="+96" hint="90.9% of active members" />
        <StatCard label="Pending Join Requests" value="47" delta="+12" hint="Owner action required" />
        <StatCard label="Monthly Platform Revenue" value="$4,752" delta="+8.2%" hint="MRR · USD" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
        <Panel className="lg:col-span-2" title="Revenue · last 30 days" actions={<Badge tone="success">+12.4%</Badge>}>
          <div className="h-72 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
                <defs>
                  <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.92 0.22 125)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="oklch(0.92 0.22 125)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                <XAxis dataKey="day" stroke="#555" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis stroke="#555" tickLine={false} axisLine={false} fontSize={11} />
                <Tooltip contentStyle={{ background: "#111", border: "1px solid #2a2a2a", borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="value" stroke="oklch(0.92 0.22 125)" strokeWidth={2} fill="url(#fill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Recent activity">
          <ul className="p-2">
            {recentActivity.map((a, i) => (
              <li key={i} className="flex items-start gap-3 rounded-md px-3 py-2.5 hover:bg-panel-2">
                <span className={`mt-1.5 h-1.5 w-1.5 rounded-full ${
                  a.tone === "success" ? "bg-lime" :
                  a.tone === "warn" ? "bg-amber-400" :
                  a.tone === "danger" ? "bg-red-400" : "bg-sky-400"
                }`} />
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-foreground">{a.text}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{a.time}</div>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
        <StatCard label="Active Gyms" value="42" hint="+3 this month" />
        <StatCard label="AI Plans Created" value="1,204" hint="member self-serve" />
        <StatCard label="Platform Check-ins" value="18,392" hint="last 30 days" />
        <StatCard label="Churn %" value="2.1%" delta="-0.4%" hint="30-day rolling" />
      </div>

      <div className="mt-4">
        <Panel title="Top gyms by revenue share">
          <div className="p-2">
            {[
              { name: "Kinetic Athletics", city: "Miami, FL", value: 273.60 },
              { name: "Peak Strength Club", city: "Denver, CO", value: 205.20 },
              { name: "Forge Fitness Co.", city: "Boston, MA", value: 160.20 },
              { name: "Ironline Fitness", city: "Austin, TX", value: 128.40 },
            ].map((g) => (
              <div key={g.name} className="flex items-center justify-between px-3 py-2.5 rounded-md hover:bg-panel-2">
                <div>
                  <div className="text-sm font-medium">{g.name}</div>
                  <div className="text-xs text-muted-foreground">{g.city}</div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-lime font-medium">${g.value.toFixed(2)}</span>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
