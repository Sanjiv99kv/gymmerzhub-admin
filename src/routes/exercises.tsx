import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel, Table, Tr, Td, StatusBadge, Input, Select, Button, RowActions } from "@/components/admin/ui";
import { exercises } from "@/lib/mock";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/exercises")({
  head: () => ({
    meta: [
      { title: "Exercise Library · GymmerzHub Admin" },
      { name: "description", content: "Curate the global exercise library used in workout templates." },
      { property: "og:title", content: "Exercise Library · GymmerzHub Admin" },
      { property: "og:description", content: "Curate the global exercise library." },
    ],
  }),
  component: ExercisesPage,
});

function ExercisesPage() {
  return (
    <div>
      <PageHeader
        title="Exercise Library"
        subtitle="Global movements available to admin-built workout templates."
        actions={<Button><Plus className="h-4 w-4" /> Add exercise</Button>}
      />
      <Panel>
        <div className="flex flex-wrap items-center gap-2 p-4 border-b border-border">
          <Input placeholder="Search exercises..." className="w-64" />
          <Select defaultValue="all"><option value="all">All muscle groups</option><option>Chest</option><option>Back</option><option>Legs</option></Select>
          <Select defaultValue="all"><option value="all">All equipment</option><option>Barbell</option><option>Dumbbell</option><option>Bodyweight</option></Select>
          <div className="ml-auto text-xs text-muted-foreground">{exercises.length} exercises</div>
        </div>
        <Table head={["Name", "Muscle group", "Equipment", "Difficulty", "Status", ""]}>
          {exercises.map((e) => (
            <Tr key={e.id}>
              <Td className="font-medium">{e.name}</Td>
              <Td className="text-muted-foreground">{e.muscle}</Td>
              <Td className="text-muted-foreground">{e.equipment}</Td>
              <Td className="text-muted-foreground">{e.difficulty}</Td>
              <Td><StatusBadge status={e.status} /></Td>
              <Td><RowActions /></Td>
            </Tr>
          ))}
        </Table>
      </Panel>
    </div>
  );
}
