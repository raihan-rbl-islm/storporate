"use client";

import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import type { studentActivities as ActivitiesTable } from "@/lib/server/db/schema";

import {
  ActivityForm,
  type ActivityInitial,
} from "./activity-form";
import { deleteActivity } from "./actions";

type ActivityRow = typeof ActivitiesTable.$inferSelect;

interface ActivitiesListProps {
  initialRows: ActivityRow[];
}

const KIND_LABELS: Record<string, string> = {
  club: "Club",
  society: "Society",
  mentorship: "Mentorship",
  volunteering: "Volunteering",
  other: "Other",
};

function rowToInitial(row: ActivityRow): ActivityInitial {
  return {
    id: row.id,
    kind: row.kind as ActivityInitial["kind"],
    role: row.role,
    organization: row.organization,
    startDate: row.startDate,
    endDate: row.endDate,
  };
}

export function ActivitiesList({ initialRows }: ActivitiesListProps) {
  const [rows, setRows] = React.useState<ActivityRow[]>(initialRows);
  const [openPanel, setOpenPanel] = React.useState<
    | { mode: "create" }
    | { mode: "edit"; id: string }
    | null
  >(null);

  React.useEffect(() => {
    setRows(initialRows);
  }, [initialRows]);

  async function handleDelete(id: string) {
    const ok = window.confirm(
      "Delete this activity? This cannot be undone.",
    );
    if (!ok) return;
    await deleteActivity(id);
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle>
            <h2 className="text-lg font-semibold">Activities</h2>
          </CardTitle>
          {openPanel === null ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setOpenPanel({ mode: "create" })}
            >
              Add activity
            </Button>
          ) : null}
        </div>
        <p className="text-sm text-muted-foreground">
          Clubs, societies, mentorship, volunteering, and other involvement.
        </p>
      </CardHeader>
      <CardContent className="grid gap-4">
        {openPanel?.mode === "create" ? (
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <ActivityForm
              mode="create"
              onDone={() => setOpenPanel(null)}
              onCancel={() => setOpenPanel(null)}
            />
          </div>
        ) : null}

        {rows.length === 0 && openPanel === null ? (
          <p className="text-sm text-muted-foreground">
            No activities yet. Click <em>Add activity</em> to log one.
          </p>
        ) : null}

        <ul className="grid gap-3">
          {rows.map((row) => (
            <li key={row.id}>
              {openPanel?.mode === "edit" && openPanel.id === row.id ? (
                <div className="rounded-lg border border-border bg-muted/30 p-4">
                  <ActivityForm
                    mode="edit"
                    initial={rowToInitial(row)}
                    onDone={() => setOpenPanel(null)}
                    onCancel={() => setOpenPanel(null)}
                  />
                </div>
              ) : (
                <ActivityCardRow
                  row={row}
                  onEdit={() =>
                    setOpenPanel({ mode: "edit", id: row.id })
                  }
                  onDelete={() => handleDelete(row.id)}
                />
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function ActivityCardRow({
  row,
  onEdit,
  onDelete,
}: {
  row: ActivityRow;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const kindLabel = KIND_LABELS[row.kind] ?? row.kind;
  const startLabel = row.startDate || "—";
  const endLabel =
    row.endDate && row.endDate !== "Present" ? row.endDate : "Present";

  return (
    <div className="rounded-lg border border-border p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="grid gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{kindLabel}</Badge>
            <span className="font-medium">{row.role}</span>
            <span className="text-sm text-muted-foreground">
              · {row.organization}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {startLabel} – {endLabel}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button size="xs" variant="outline" onClick={onEdit}>
            Edit
          </Button>
          <Button size="xs" variant="destructive" onClick={onDelete}>
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ActivitiesList;