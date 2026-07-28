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

import type { studentExperiences as ExperiencesTable } from "@/lib/server/db/schema";

import {
  ExperienceForm,
  type ExperienceInitial,
} from "./experience-form";
import {
  deleteExperience,
  reorderExperience,
} from "./actions";

type ExperienceRow = typeof ExperiencesTable.$inferSelect;

interface ExperiencesListProps {
  studentId: string;
  initialRows: ExperienceRow[];
}

const KIND_LABELS: Record<string, string> = {
  work: "Work",
  research: "Research",
  volunteer: "Volunteer",
  project: "Project",
};

function rowToInitial(row: ExperienceRow): ExperienceInitial {
  return {
    id: row.id,
    kind: row.kind as ExperienceInitial["kind"],
    title: row.title,
    organization: row.organization,
    location: row.location,
    startDate: row.startDate,
    endDate: row.endDate,
    description: row.description,
    tags: row.tags,
  };
}

export function ExperiencesList({
  studentId,
  initialRows,
}: ExperiencesListProps) {
  const [rows, setRows] = React.useState<ExperienceRow[]>(initialRows);
  const [openPanel, setOpenPanel] = React.useState<
    | { mode: "create" }
    | { mode: "edit"; id: string }
    | null
  >(null);

  // After a successful save the server action calls `revalidatePath`, the
  // section re-renders, and we get fresh `initialRows`. We sync local
  // state only when the upstream id-set changes — that way optimistic
  // edits from this client don't get clobbered.
  React.useEffect(() => {
    setRows(initialRows);
  }, [initialRows]);

  async function handleDelete(id: string) {
    // Keep the existing window.confirm() path — base-ui Dialog is overkill
    // for a destructive action that's always one-click away.
    const ok = window.confirm(
      "Delete this experience? This cannot be undone.",
    );
    if (!ok) return;
    await deleteExperience(id);
  }

  async function handleMove(id: string, direction: "up" | "down") {
    const idx = rows.findIndex((r) => r.id === id);
    if (idx < 0) return;
    const target = direction === "up" ? idx - 1 : idx + 1;
    if (target < 0 || target >= rows.length) return;
    const next = [...rows];
    const [moved] = next.splice(idx, 1);
    next.splice(target, 0, moved);
    setRows(next);
    await reorderExperience(next.map((r) => r.id));
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle>
            <h2 className="text-lg font-semibold">Experiences</h2>
          </CardTitle>
          {openPanel === null ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setOpenPanel({ mode: "create" })}
            >
              Add experience
            </Button>
          ) : null}
        </div>
        <p className="text-sm text-muted-foreground">
          Work, research, volunteer, and project entries. Sorted in the order
          you want them to appear.
        </p>
      </CardHeader>
      <CardContent className="grid gap-4">
        {openPanel?.mode === "create" ? (
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <ExperienceForm
              mode="create"
              onDone={() => setOpenPanel(null)}
              onCancel={() => setOpenPanel(null)}
            />
          </div>
        ) : null}

        {rows.length === 0 && openPanel === null ? (
          <p className="text-sm text-muted-foreground">
            No experiences yet. Click <em>Add experience</em> to log one.
          </p>
        ) : null}

        <ul className="grid gap-3">
          {rows.map((row, idx) => (
            <li key={row.id}>
              {openPanel?.mode === "edit" && openPanel.id === row.id ? (
                <div className="rounded-lg border border-border bg-muted/30 p-4">
                  <ExperienceForm
                    mode="edit"
                    initial={rowToInitial(row)}
                    onDone={() => setOpenPanel(null)}
                    onCancel={() => setOpenPanel(null)}
                  />
                </div>
              ) : (
                <ExperienceCardRow
                  row={row}
                  isFirst={idx === 0}
                  isLast={idx === rows.length - 1}
                  onEdit={() =>
                    setOpenPanel({ mode: "edit", id: row.id })
                  }
                  onDelete={() => handleDelete(row.id)}
                  onMove={(direction) => handleMove(row.id, direction)}
                />
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function ExperienceCardRow({
  row,
  isFirst,
  isLast,
  onEdit,
  onDelete,
  onMove,
}: {
  row: ExperienceRow;
  isFirst: boolean;
  isLast: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onMove: (direction: "up" | "down") => void;
}) {
  const kindLabel = KIND_LABELS[row.kind] ?? row.kind;
  const startLabel = row.startDate || "—";
  const endLabel = row.endDate && row.endDate !== "Present"
    ? row.endDate
    : "Present";

  return (
    <div
      data-testid={`experience-row-${row.id}`}
      className="rounded-lg border border-border p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="grid gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{kindLabel}</Badge>
            <span className="font-medium">{row.title}</span>
            <span className="text-sm text-muted-foreground">
              · {row.organization}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {row.location ? `${row.location} · ` : ""}
            {startLabel} – {endLabel}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="icon-xs"
            variant="ghost"
            aria-label="Move up"
            disabled={isFirst}
            onClick={() => onMove("up")}
          >
            ↑
          </Button>
          <Button
            size="icon-xs"
            variant="ghost"
            aria-label="Move down"
            disabled={isLast}
            onClick={() => onMove("down")}
          >
            ↓
          </Button>
          <Button size="xs" variant="outline" onClick={onEdit}>
            Edit
          </Button>
          <Button size="xs" variant="destructive" onClick={onDelete}>
            Delete
          </Button>
        </div>
      </div>
      {row.description ? (
        <p className="mt-2 text-sm">{row.description}</p>
      ) : null}
      {row.tags.length > 0 ? (
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {row.tags.map((t, i) => (
            <li key={`${t}-${i}`}>
              <Badge variant="outline">{t}</Badge>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export default ExperiencesList;