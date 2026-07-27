import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel, Button, Input } from "@/components/admin/ui";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings · GymmerzHub Admin" },
      { name: "description", content: "Platform-wide settings: pricing, revenue share, and feature flags." },
      { property: "og:title", content: "Settings · GymmerzHub Admin" },
      { property: "og:description", content: "Platform-wide settings for GymmerzHub." },
    ],
  }),
  component: SettingsPage,
});

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="grid md:grid-cols-3 gap-3 py-4 border-b border-border/60">
      <div>
        <div className="text-sm font-medium">{label}</div>
        {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
      </div>
      <div className="md:col-span-2">{children}</div>
    </div>
  );
}

function Toggle({ defaultOn = false, label }: { defaultOn?: boolean; label: string }) {
  return (
    <label className="flex items-center justify-between gap-4 py-2">
      <span className="text-sm">{label}</span>
      <input type="checkbox" defaultChecked={defaultOn} className="peer sr-only" />
      <span className="relative inline-block h-5 w-9 rounded-full bg-panel-2 border border-border after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-muted-foreground after:transition-all peer-checked:bg-lime/30 peer-checked:after:left-4 peer-checked:after:bg-lime" />
    </label>
  );
}

function SettingsPage() {
  return (
    <div>
      <PageHeader
        breadcrumb="System / Settings"
        title="Settings"
        subtitle="Platform-wide configuration for GymmerzHub."
        actions={<Button onClick={() => toast.success("Settings saved")}>Save changes</Button>}
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title="Billing">
          <div className="px-5">
            <Row label="Platform subscription price" hint="Charged per member per month."><div className="flex items-center gap-2"><span className="text-muted-foreground">$</span><Input defaultValue="3.00" className="w-28" /><span className="text-xs text-muted-foreground">USD · INR can be added later</span></div></Row>
            <Row label="Revenue share to gyms" hint="Percent of member sub revenue paid to the linked gym."><div className="flex items-center gap-2"><Input defaultValue="20" className="w-24" /><span className="text-muted-foreground">%</span></div></Row>
            <Row label="Trial days" hint="Optional free trial before first charge."><Input defaultValue="7" className="w-24" /></Row>
          </div>
        </Panel>

        <Panel title="Support">
          <div className="px-5">
            <Row label="Support email"><Input defaultValue="support@gymmerzhub.com" className="w-full max-w-sm" /></Row>
            <Row label="Region"><Input defaultValue="Global" className="w-full max-w-sm" /></Row>
          </div>
        </Panel>

        <Panel title="Feature flags" className="lg:col-span-2">
          <div className="px-5 py-2">
            <Toggle defaultOn label="AI plan generation enabled" />
            <Toggle label="Gym online fee payments (coming soon)" />
            <Toggle defaultOn label="Owner invite links" />
            <Toggle label="Member referral rewards" />
          </div>
        </Panel>
      </div>
    </div>
  );
}
