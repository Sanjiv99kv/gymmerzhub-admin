import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, Panel, Table, Tr, Td, StatusBadge, Tabs, Button } from "@/components/admin/ui";
import { aiPlans } from "@/lib/mock";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/ai-plans")({
  head: () => ({
    meta: [
      { title: "AI Plans · GymmerzHub Admin" },
      { name: "description", content: "Moderate member-created, AI-generated diet and workout plans." },
      { property: "og:title", content: "AI Plans · GymmerzHub Admin" },
      { property: "og:description", content: "Moderate member-created, AI-generated plans." },
    ],
  }),
  component: AIPlans,
});

function AIPlans() {
  const [tab, setTab] = useState("ALL");
  const rows = aiPlans.filter(p => tab === "ALL" || p.status.toUpperCase() === tab);

  return (
    <div>
      <PageHeader
        title="AI Plans"
        subtitle="Member self-created plans generated with AI. Moderate content, flag or hide as needed."
        actions={<span className="inline-flex items-center gap-2 text-xs text-muted-foreground"><Sparkles className="h-4 w-4 text-lime" /> Created by members · AI-assisted</span>}
      />
      <Panel>
        <div className="p-4 border-b border-border"><Tabs tabs={["ALL", "ACTIVE", "FLAGGED", "HIDDEN"]} active={tab} onChange={setTab} /></div>
        <Table head={["Member", "Type", "Title", "Created", "Status", ""]}>
          {rows.map((p) => (
            <Tr key={p.id}>
              <Td className="font-medium">{p.member}</Td>
              <Td><span className="rounded-full border border-border px-2 py-0.5 text-xs">{p.type}</span></Td>
              <Td>{p.title}</Td>
              <Td className="text-muted-foreground text-xs">{p.created}</Td>
              <Td><StatusBadge status={p.status} /></Td>
              <Td className="text-right">
                <div className="inline-flex gap-2">
                  {p.status !== "Flagged" && <Button size="sm" variant="secondary" onClick={() => toast.warning("Plan flagged")}>Flag</Button>}
                  {p.status !== "Hidden"
                    ? <Button size="sm" variant="danger" onClick={() => toast.error("Plan hidden")}>Hide</Button>
                    : <Button size="sm" onClick={() => toast.success("Plan restored")}>Restore</Button>}
                </div>
              </Td>
            </Tr>
          ))}
        </Table>
      </Panel>
    </div>
  );
}
