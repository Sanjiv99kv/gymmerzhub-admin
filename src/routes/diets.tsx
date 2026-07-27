import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Button, RowActions, StatusBadge } from "@/components/admin/ui";
import { diets } from "@/lib/mock";
import { Plus, Flame } from "lucide-react";

export const Route = createFileRoute("/diets")({
  head: () => ({
    meta: [
      { title: "Diet Templates · GymmerzHub Admin" },
      { name: "description", content: "Admin-built global diet templates for the platform." },
      { property: "og:title", content: "Diet Templates · GymmerzHub Admin" },
      { property: "og:description", content: "Admin-built global diet templates for the platform." },
    ],
  }),
  component: DietsPage,
});

function DietsPage() {
  return (
    <div>
      <PageHeader
        title="Diet Templates"
        subtitle="Platform ships 2–3 common diet plans. Members may also self-create AI-generated plans."
        actions={<Button><Plus className="h-4 w-4" /> Create diet plan</Button>}
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {diets.map((d) => (
          <div key={d.id} className="rounded-xl border border-border bg-panel p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">{d.goal}</div>
                <div className="mt-1 text-lg font-semibold">{d.name}</div>
              </div>
              <RowActions />
            </div>
            <div className="mt-5 flex items-center gap-2 text-lime">
              <Flame className="h-4 w-4" />
              <div className="text-2xl font-semibold">{d.kcal}<span className="text-xs text-muted-foreground ml-1">kcal / day</span></div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              {[["Protein", `${d.protein}g`], ["Carbs", `${d.carbs}g`], ["Fat", `${d.fat}g`]].map(([k, v]) => (
                <div key={k} className="rounded-md border border-border bg-panel-2 py-2">
                  <div className="text-[10px] uppercase text-muted-foreground tracking-wide">{k}</div>
                  <div className="text-sm font-semibold mt-0.5">{v}</div>
                </div>
              ))}
            </div>
            <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
              <StatusBadge status={d.status} />
              <div className="flex gap-2">
                <Button size="sm" variant="secondary">Unpublish</Button>
                <Button size="sm" variant="ghost">Duplicate</Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
