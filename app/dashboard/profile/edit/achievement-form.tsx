"use client";

import * as React from "react";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FieldError } from "@/components/onboarding/field-error";

import {
  createAchievement,
  updateAchievement,
  type FormState,
} from "./actions";

export type AchievementFormKind =
  | "award"
  | "publication"
  | "talk"
  | "certification"
  | "competition";

export interface AchievementInitial {
  id?: string;
  kind: AchievementFormKind;
  title: string;
  issuer: string;
  date: string;
  url: string;
  description: string;
}

interface AchievementFormProps {
  mode: "create" | "edit";
  initial?: AchievementInitial;
  onDone?: () => void;
  onCancel?: () => void;
}

const INITIAL: FormState = { status: "idle" };

export function AchievementForm({
  mode,
  initial,
  onDone,
  onCancel,
}: AchievementFormProps) {
  const boundUpdate = React.useMemo(() => {
    if (mode === "edit" && initial?.id) {
      const id = initial.id;
      return async (_prev: FormState, fd: FormData) =>
        updateAchievement(id, fd);
    }
    return null;
  }, [mode, initial?.id]);

  const action =
    mode === "edit" && boundUpdate ? boundUpdate : createAchievement;

  const [state, formAction, pending] = useActionState<FormState, FormData>(
    action,
    INITIAL,
  );

  const errors =
    state.status === "error" ? state.errors : ({} as Record<string, string>);

  React.useEffect(() => {
    if (state.status === "success") onDone?.();
  }, [state, onDone]);

  return (
    <form action={formAction} noValidate className="grid gap-4">
      {state.status === "error" && state.formMessage ? (
        <p
          role="alert"
          className="rounded-md border border-destructive bg-destructive/10 p-2 text-sm text-destructive"
        >
          {state.formMessage}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          id={`${mode}-achievement-kind`}
          label="Kind"
          error={errors.kind}
        >
          <select
            id={`${mode}-achievement-kind`}
            name="kind"
            defaultValue={initial?.kind ?? "award"}
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="award">Award</option>
            <option value="publication">Publication</option>
            <option value="talk">Talk</option>
            <option value="certification">Certification</option>
            <option value="competition">Competition</option>
          </select>
        </Field>
        <Field
          id={`${mode}-achievement-title`}
          label="Title"
          error={errors.title}
        >
          <Input
            id={`${mode}-achievement-title`}
            name="title"
            defaultValue={initial?.title ?? ""}
            placeholder="e.g. Dean's List"
            aria-invalid={Boolean(errors.title)}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          id={`${mode}-achievement-issuer`}
          label="Issuer / Venue"
          error={errors.issuer}
        >
          <Input
            id={`${mode}-achievement-issuer`}
            name="issuer"
            defaultValue={initial?.issuer ?? ""}
            placeholder="e.g. BRAC University"
          />
        </Field>
        <Field
          id={`${mode}-achievement-date`}
          label="Date"
          error={errors.date}
        >
          <Input
            id={`${mode}-achievement-date`}
            name="date"
            type="month"
            defaultValue={initial?.date ?? ""}
          />
        </Field>
      </div>

      <Field
        id={`${mode}-achievement-url`}
        label="Link (optional)"
        error={errors.url}
      >
        <Input
          id={`${mode}-achievement-url`}
          name="url"
          type="url"
          defaultValue={initial?.url ?? ""}
          placeholder="https://…"
        />
      </Field>

      <Field
        id={`${mode}-achievement-desc`}
        label="Description"
        error={errors.description}
      >
        <Textarea
          id={`${mode}-achievement-desc`}
          name="description"
          defaultValue={initial?.description ?? ""}
          placeholder="A short summary — scope, outcome, anything notable."
          rows={3}
        />
      </Field>

      <div className="flex justify-end gap-2 border-t border-border/60 pt-3">
        {onCancel ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={pending}
          >
            Cancel
          </Button>
        ) : null}
        <Button type="submit" size="sm" disabled={pending}>
          {pending
            ? "Saving…"
            : mode === "edit"
              ? "Save changes"
              : "Add achievement"}
        </Button>
      </div>
    </form>
  );
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      <FieldError id={`${id}-err`} message={error} />
    </div>
  );
}

export default AchievementForm;