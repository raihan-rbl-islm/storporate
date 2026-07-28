"use client";

import * as React from "react";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/onboarding/field-error";

import {
  createActivity,
  updateActivity,
} from "./actions";
import type { FormState } from "@/components/onboarding/onboarding-form";

export type ActivityFormKind =
  | "club"
  | "society"
  | "mentorship"
  | "volunteering"
  | "other";

export interface ActivityInitial {
  id?: string;
  kind: ActivityFormKind;
  role: string;
  organization: string;
  startDate: string;
  endDate: string;
}

interface ActivityFormProps {
  mode: "create" | "edit";
  initial?: ActivityInitial;
  onDone?: () => void;
  onCancel?: () => void;
}

const INITIAL: FormState = { status: "idle" };

export function ActivityForm({
  mode,
  initial,
  onDone,
  onCancel,
}: ActivityFormProps) {
  const boundUpdate = React.useMemo(() => {
    if (mode === "edit" && initial?.id) {
      const id = initial.id;
      return async (_prev: FormState, fd: FormData) =>
        updateActivity(id, fd);
    }
    return null;
  }, [mode, initial?.id]);

  const action = mode === "edit" && boundUpdate ? boundUpdate : createActivity;

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
          id={`${mode}-activity-kind`}
          label="Kind"
          error={errors.kind}
        >
          <select
            id={`${mode}-activity-kind`}
            name="kind"
            defaultValue={initial?.kind ?? "club"}
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="club">Club</option>
            <option value="society">Society</option>
            <option value="mentorship">Mentorship</option>
            <option value="volunteering">Volunteering</option>
            <option value="other">Other</option>
          </select>
        </Field>
        <Field
          id={`${mode}-activity-role`}
          label="Role"
          error={errors.role}
        >
          <Input
            id={`${mode}-activity-role`}
            name="role"
            defaultValue={initial?.role ?? ""}
            placeholder="e.g. President, Volunteer"
            aria-invalid={Boolean(errors.role)}
          />
        </Field>
      </div>

      <Field
        id={`${mode}-activity-org`}
        label="Organization"
        error={errors.organization}
      >
        <Input
          id={`${mode}-activity-org`}
          name="organization"
          defaultValue={initial?.organization ?? ""}
          placeholder="e.g. BRAC University Debate Club"
          aria-invalid={Boolean(errors.organization)}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          id={`${mode}-activity-start`}
          label="Start month"
          error={errors.startDate}
        >
          <Input
            id={`${mode}-activity-start`}
            name="start_date"
            type="month"
            defaultValue={initial?.startDate ?? ""}
          />
        </Field>
        <Field
          id={`${mode}-activity-end`}
          label="End month (or leave blank for Present)"
          error={errors.endDate}
        >
          <Input
            id={`${mode}-activity-end`}
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
              : "Add activity"}
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

export default ActivityForm;
