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

import type { studentAchievements as AchievementsTable } from "@/lib/server/db/schema";

import {
  AchievementForm,
  type AchievementInitial,
} from "./achievement-form";
import { deleteAchievement } from "./actions";

type AchievementRow = typeof AchievementsTable.$inferSelect;

interface AchievementsListProps {
  initialRows: AchievementRow[];
}

const KIND_LABELS: Record<string, string> = {
  award: "Award",
  publication: "Publication",
  talk: "Talk",
  certification: "Certification",
  competition: "Competition",
};

function rowToInitial(row: AchievementRow): AchievementInitial {
  return {
    id: row.id,
    kind: row.kind as AchievementInitial["kind"],
    title: row.title,
    issuer: row.issuer,
    date: row.date,
    url: row.url,
    description: row.description,
  };
}

export function AchievementsList({ initialRows }: AchievementsListProps) {
  const [rows, setRows] = React.useState<AchievementRow[]>(initialRows);
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
      "Delete this achievement? This cannot be undone.",
    );
    if (!ok) return;
    await deleteAchievement(id);
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle>
            <h2 className="text-lg font-semibold">Achievements</h2>
          </CardTitle>
          {openPanel === null ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setOpenPanel({ mode: "create" })}
            >
              Add achievement
            </Button>
          ) : null}
        </div>
        <p className="text-sm text-muted-foreground">
          Awards, publications, talks, certifications, and competitions.
        </p>
      </CardHeader>
      <CardContent className="grid gap-4">
        {openPanel?.mode === "create" ? (
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <AchievementForm
              mode="create"
              onDone={() => setOpenPanel(null)}
              onCancel={() => setOpenPanel(null)}
            />
          </div>
        ) : null}

        {rows.length === 0 && openPanel === null ? (
          <p className="text-sm text-muted-foreground">
            No achievements yet. Click <em>Add achievement</em> to log one.
          </p>
        ) : null}

        <ul className="grid gap-3">
          {rows.map((row) => (
            <li key={row.id}>
              {openPanel?.mode === "edit" && openPanel.id === row.id ? (
                <div className="rounded-lg border border-border bg-muted/30 p-4">
                  <AchievementForm
                    mode="edit"
                    initial={rowToInitial(row)}
                    onDone={() => setOpenPanel(null)}
                    onCancel={() => setOpenPanel(null)}
                  />
                </div>
              ) : (
                <AchievementCardRow
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

function AchievementCardRow({
  row,
  onEdit,
  onDelete,
}: {
  row: AchievementRow;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const kindLabel = KIND_LABELS[row.kind] ?? row.kind;
  return (
    <div className="rounded-lg border border-border p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="grid gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{kindLabel}</Badge>
            <span className="font-medium">{row.title}</span>
            {row.issuer ? (
              <span className="text-sm text-muted-foreground">
                · {row.issuer}
              </span>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground">
            {row.date ? row.date : ""}
            {row.url ? (
              <>
                {" · "}
                <a
                  href={row.url}
                  className="text-primary underline-offset-4 hover:underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  Link
                </a>
              </>
            ) : null}
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
      {row.description ? (
        <p className="mt-2 text-sm">{row.description}</p>
      ) : null}
    </div>
  );
}

export default AchievementsList;