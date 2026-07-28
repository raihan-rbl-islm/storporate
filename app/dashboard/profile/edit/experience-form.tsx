"use client";

import * as React from "react";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ChipInput } from "@/components/onboarding/chip-input";
import { FieldError } from "@/components/onboarding/field-error";

import {
  createExperience,
  updateExperience,
} from "./actions";
import type { FormState } from "@/components/onboarding/onboarding-form";

export type ExperienceFormKind =
  | "work"
  | "research"
  | "volunteer"
  | "project";

export interface ExperienceInitial {
  id?: string;
  kind: ExperienceFormKind;
  title: string;
  organization: string;
  location: string;
  startDate: string;
  endDate: string;
  description: string;
  tags: string[];
}

interface ExperienceFormProps {
  /** When `mode === "edit"`, `initial.id` must be set. */
  mode: "create" | "edit";
  initial?: ExperienceInitial;
  /** Called after a successful save so the parent can collapse the panel. */
  onDone?: () => void;
  /** Called when the user clicks "Cancel" without saving. */
  onCancel?: () => void;
}

const INITIAL: FormState = { status: "idle" };

export function ExperienceForm({
  mode,
  initial,
  onDone,
  onCancel,
}: ExperienceFormProps) {
  // `useActionState` needs a `(prev, formData) => Promise<FormState>` action.
  // For create mode we pass `createExperience` directly. For edit mode we
  // bind the row id into a closure so the action signature stays
  // `(prev, formData)`.
  const boundUpdate = React.useMemo(() => {
    if (mode === "edit" && initial?.id) {
      const id = initial.id;
      return async (_prev: FormState, fd: FormData) =>
        updateExperience(id, fd);
    }
    return null;
  }, [mode, initial?.id]);

  const action = mode === "edit" && boundUpdate ? boundUpdate : createExperience;

  const [state, formAction, pending] = useActionState<FormState, FormData>(
    action,
    INITIAL,
  );

  const errors =
    state.status === "error" ? state.errors : ({} as Record<string, string>);

  // Tags are mirrored into state so the chip-input UI can re-render them.
  const [tags, setTags] = React.useState<string[]>(initial?.tags ?? []);

  // After a successful save, fire onDone. We don't auto-clear the form
  // because revalidatePath rerenders the whole section with the new server
  // data, which replaces this panel.
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
          id={`${mode}-experience-kind`}
          label="Kind"
          error={errors.kind}
        >
          <select
            id={`${mode}-experience-kind`}
            name="kind"
            defaultValue={initial?.kind ?? "work"}
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="work">Work</option>
            <option value="research">Research</option>
            <option value="volunteer">Volunteer</option>
            <option value="project">Project</option>
          </select>
        </Field>
        <Field id={`${mode}-experience-title`} label="Title" error={errors.title}>
          <Input
            id={`${mode}-experience-title`}
            name="title"
            defaultValue={initial?.title ?? ""}
            placeholder="e.g. ML Research Intern"
            aria-invalid={Boolean(errors.title)}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          id={`${mode}-experience-org`}
          label="Organization"
          error={errors.organization}
        >
          <Input
            id={`${mode}-experience-org`}
            name="organization"
            defaultValue={initial?.organization ?? ""}
            placeholder="e.g. BRAC University"
            aria-invalid={Boolean(errors.organization)}
          />
        </Field>
        <Field
          id={`${mode}-experience-loc`}
          label="Location"
          error={errors.location}
        >
          <Input
            id={`${mode}-experience-loc`}
            name="location"
            defaultValue={initial?.location ?? ""}
            placeholder="e.g. Dhaka, Bangladesh"
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          id={`${mode}-experience-start`}
          label="Start month"
          error={errors.startDate}
        >
          <Input
            id={`${mode}-experience-start`}
            name="start_date"
            type="month"
            defaultValue={initial?.startDate ?? ""}
          />
        </Field>
        <Field
          id={`${mode}-experience-end`}
          label="End month (or leave blank for Present)"
          error={errors.endDate}
        >
          <Input
            id={`${mode}-experience-end`}
            name="end_date"
            type="month"
            defaultValue={
              initial?.endDate && initial.endDate !== "Present"
                ? initial.endDate
                : ""
            }
            placeholder="Present"
          />
        </Field>
      </div>

      <Field
        id={`${mode}-experience-desc`}
        label="Description"
        error={errors.description}
      >
        <Textarea
          id={`${mode}-experience-desc`}
          name="description"
          defaultValue={initial?.description ?? ""}
          placeholder="What did you do, ship, or learn?"
          rows={3}
        />
      </Field>

      <div className="grid gap-1.5">
        <ChipInput
          name="tags"
          label="Tags"
          value={tags}
          onChange={setTags}
          placeholder="Add a tag — e.g. python, nlp, healthcare"
          invalid={Boolean(errors.tags)}
          describedById={`${mode}-experience-tags-err`}
        />
        <FieldError
          id={`${mode}-experience-tags-err`}
          message={errors.tags}
        />
      </div>

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
          {pending ? "Saving…" : mode === "edit" ? "Save changes" : "Add experience"}
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

export default ExperienceForm;
