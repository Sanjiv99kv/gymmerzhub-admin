import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel, StatusBadge, Button, RowActions } from "@/components/admin/ui";
import { workouts } from "@/lib/mock";
import { Plus, Sparkles } from "lucide-react";

export const Route = createFileRoute("/workouts")({
  head: () => ({
    meta: [
      { title: "Workout Templates · GymmerzHub Admin" },
      { name: "description", content: "Admin-built global workout templates offered to all members." },
      { property: "og:title", content: "Workout Templates · GymmerzHub Admin" },
      { property: "og:description", content: "Admin-built global workout templates." },
    ],
  }),
  component: WorkoutsPage,
});

function WorkoutsPage() {
  return (
    <div>
      <PageHeader
        title="Workout Templates"
        subtitle="Platform ships 2–3 common workout plans. Members can also generate personal AI plans."
        actions={<Button><Plus className="h-4 w-4" /> Create template</Button>}
      />
      <div className="mb-4 flex items-start gap-3 rounded-lg border border-lime/25 bg-lime/5 p-4 text-sm">
        <Sparkles className="h-4 w-4 mt-0.5 text-lime" />
        <div className="text-muted-foreground">These are the <span className="text-foreground">official global templates</span>. Keep the catalog small and well-curated.</div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {workouts.map((w) => (
          <div key={w.id} className="rounded-xl border border-border bg-panel p-5 flex flex-col">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">{w.goal}</div>
                <div className="mt-1 text-lg font-semibold">{w.name}</div>
              </div>
              <RowActions />
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="rounded-full border border-border px-2 py-0.5">{w.level}</span>
              <span className="rounded-full border border-border px-2 py-0.5">{w.days} days / week</span>
            </div>
            <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
              <StatusBadge status={w.status} />
              <div className="flex items-center gap-2">
                {w.status === "Published"
                  ? <Button size="sm" variant="secondary">Unpublish</Button>
                  : <Button size="sm">Publish</Button>}
                <Button size="sm" variant="ghost">Duplicate</Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
