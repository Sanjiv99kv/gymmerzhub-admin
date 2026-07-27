import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { PageHeader, Panel, StatusBadge, Button, Table, Tr, Td, Tabs, StatCard } from "@/components/admin/ui";
import { gyms, members } from "@/lib/mock";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/gyms/$id")({
  loader: ({ params }) => {
    const gym = gyms.find(g => g.id === params.id);
    if (!gym) throw notFound();
    return { gym };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.gym.name ?? "Gym"} · GymmerzHub Admin` },
      { name: "description", content: `Gym detail and audit for ${loaderData?.gym.name ?? "gym"}.` },
    ],
  }),
  component: GymDetail,
});

function GymDetail() {
  const { gym } = Route.useLoaderData();
  const [tab, setTab] = useState("Overview");
  const gymMembers = members.filter(m => m.gym === gym.name);

  return (
    <div>
      <PageHeader
        breadcrumb={<><Link to="/gyms" className="hover:text-lime">Gyms</Link> / {gym.name}</> as any}
        title={gym.name}
        subtitle={`${gym.city} · Owner ${gym.owner}`}
        actions={
          <>
            <Button variant="secondary">Edit</Button>
            {gym.status === "Suspended"
              ? <Button onClick={() => toast.success("Gym reinstated")}>Reinstate</Button>
              : <Button variant="danger" onClick={() => toast.warning("Gym suspended")}>Suspend</Button>}
          </>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <StatusBadge status={gym.status} />
        <span className="text-xs text-muted-foreground">Created {gym.created}</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Members" value={String(gym.members)} />
        <StatCard label="Active subs" value={String(Math.round(gym.members * 0.72))} />
        <StatCard label="Revenue share due" value={`$${gym.revenueDue.toFixed(2)}`} />
        <StatCard label="Check-ins (30d)" value="1,204" />
      </div>

      <Tabs tabs={["Overview", "Members", "Packages", "Notices", "Attendance", "Revenue share"]} active={tab} onChange={setTab} />

      <div className="mt-6">
        {tab === "Overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Panel title="Details">
              <dl className="p-5 space-y-3 text-sm">
                {[
                  ["Owner", gym.owner],
                  ["Contact", "owner@" + gym.name.toLowerCase().replace(/\W+/g, "") + ".com"],
                  ["Address", `${gym.city}, 4200 Ridge Ave, Suite 12`],
                  ["Created", gym.created],
                  ["Status", <StatusBadge status={gym.status} />],
                ].map(([k, v]) => (
                  <div key={String(k)} className="flex items-center justify-between border-b border-border/60 pb-2">
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="font-medium">{v}</dd>
                  </div>
                ))}
              </dl>
            </Panel>
            <Panel title="Notes">
              <div className="p-5 text-sm text-muted-foreground">No admin notes on file.</div>
            </Panel>
          </div>
        )}

        {tab === "Members" && (
          <Panel>
            <Table head={["Name", "Email", "Gym status", "Sub status", "Joined"]}>
              {gymMembers.length ? gymMembers.map(m => (
                <Tr key={m.id}>
                  <Td className="font-medium">{m.name}</Td>
                  <Td className="text-muted-foreground">{m.email}</Td>
                  <Td><StatusBadge status={m.gymStatus} /></Td>
                  <Td><StatusBadge status={m.subStatus} /></Td>
                  <Td className="text-muted-foreground text-xs">{m.joined}</Td>
                </Tr>
              )) : <Tr><Td className="text-muted-foreground">No members yet.</Td><Td/><Td/><Td/><Td/></Tr>}
            </Table>
          </Panel>
        )}

        {tab === "Packages" && (
          <Panel>
            <Table head={["Package", "Duration", "Price", "Active members"]}>
              {[
                ["Monthly", "1 month", "$40", 128],
                ["Quarterly", "3 months", "$105", 62],
                ["Annual", "12 months", "$360", 24],
              ].map((r) => (
                <Tr key={String(r[0])}>
                  <Td className="font-medium">{r[0]}</Td>
                  <Td className="text-muted-foreground">{r[1]}</Td>
                  <Td>{r[2]}</Td>
                  <Td className="tabular-nums">{r[3]}</Td>
                </Tr>
              ))}
            </Table>
          </Panel>
        )}

        {tab === "Notices" && (
          <Panel>
            <ul className="p-2">
              {[
                { t: "Holiday hours — closed July 4", ago: "2d ago" },
                { t: "New olympic platform installed", ago: "1w ago" },
                { t: "Deadlift class starts Monday", ago: "2w ago" },
              ].map((n) => (
                <li key={n.t} className="flex items-center justify-between px-3 py-2.5 rounded-md hover:bg-panel-2">
                  <span className="text-sm">{n.t}</span>
                  <span className="text-xs text-muted-foreground">{n.ago}</span>
                </li>
              ))}
            </ul>
          </Panel>
        )}

        {tab === "Attendance" && (
          <div className="grid grid-cols-3 gap-4">
            <StatCard label="Today" value="87" />
            <StatCard label="This week" value="612" />
            <StatCard label="This month" value="2,441" />
          </div>
        )}

        {tab === "Revenue share" && (
          <Panel>
            <Table head={["Period", "Active subs", "Gross", "Gym share (20%)", "Status"]}>
              {[
                ["Jul 2026", Math.round(gym.members * 0.72), gym.members * 3 * 0.72, gym.revenueDue, "Pending"],
                ["Jun 2026", Math.round(gym.members * 0.7), gym.members * 3 * 0.7, gym.members * 3 * 0.7 * 0.2, "Paid"],
                ["May 2026", Math.round(gym.members * 0.68), gym.members * 3 * 0.68, gym.members * 3 * 0.68 * 0.2, "Paid"],
              ].map((r, i) => (
                <Tr key={i}>
                  <Td className="font-medium">{r[0]}</Td>
                  <Td className="tabular-nums">{r[1]}</Td>
                  <Td className="tabular-nums">${Number(r[2]).toFixed(2)}</Td>
                  <Td className="tabular-nums text-lime">${Number(r[3]).toFixed(2)}</Td>
                  <Td><StatusBadge status={String(r[4])} /></Td>
                </Tr>
              ))}
            </Table>
          </Panel>
        )}
      </div>
    </div>
  );
}
