"use client";
import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { RoleFieldsStudent } from "@/components/onboarding/role-fields-student";
import { RoleFieldsClub } from "@/components/onboarding/role-fields-club";
import { RoleFieldsCorporate } from "@/components/onboarding/role-fields-corporate";
import type { PersonaRole } from "@/lib/server/personas/current";
import type {
  StudentFormInput,
  ClubFormInput,
  CorporateFormInput,
} from "@/lib/server/personas/schemas";

export type FormState =
  | { status: "idle" }
  | { status: "error"; errors: Record<string, string>; formMessage?: string }
  | { status: "success"; message: string };

export interface OnboardingFormProps {
  role: PersonaRole;
  mode: "create" | "edit";
  initialValue:
    | StudentFormInput
    | ClubFormInput
    | CorporateFormInput;
  editableFields?: ReadonlyArray<string>;
  submitLabel: string;
  successHref?: string;
  action: (
    prev: FormState,
    fd: FormData,
  ) => Promise<FormState>;
}

const INITIAL: FormState = { status: "idle" };

/** Pick the initial committed-chip map for the role. In edit mode we
 *  restrict to the keys present in `editableFields`; in create mode we
 *  pick all chip fields for the role. */
function initialChips(
  role: PersonaRole,
  value: StudentFormInput | ClubFormInput | CorporateFormInput,
  editableFields?: ReadonlyArray<string>,
): Record<string, string[]> {
  const editable = editableFields
    ? new Set(editableFields as ReadonlyArray<string>)
    : null;
  function pick(keys: ReadonlyArray<string>): Record<string, string[]> {
    const out: Record<string, string[]> = {};
    for (const k of keys) {
      if (editable !== null && !editable.has(k)) continue;
      const v = (value as Record<string, unknown>)[k];
      if (Array.isArray(v)) out[k] = v as string[];
    }
    return out;
  }
  if (role === "student") return pick(["skills", "careerInterests"]);
  if (role === "club")
    return pick(["categories", "eventFocus", "sponsorshipNeeds"]);
  return pick([
    "talentNeeds",
    "sponsorshipInterests",
    "csrFocus",
  ]);
}

export function OnboardingForm(props: OnboardingFormProps) {
  // Native inputs (Input, Textarea, RadioGroupItem) are uncontrolled — they
  // use `defaultValue` and submit via FormData. Chip inputs are mirrored
  // into React state so re-renders show the right chips and FormData picks
  // up `${name}[]` hidden inputs.
  const [chipState, setChipState] = useState<Record<string, string[]>>(() =>
    initialChips(props.role, props.initialValue, props.editableFields),
  );

  function setChip(field: string, next: string[]) {
    setChipState((prev) => ({ ...prev, [field]: next }));
  }

  const router = useRouter();
  const [state, formAction] = useActionState<FormState, FormData>(
    props.action,
    INITIAL,
  );
  const errorBannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state.status === "error") {
      errorBannerRef.current?.focus();
    } else if (state.status === "success" && props.successHref) {
      router.push(props.successHref);
    }
  }, [state, router, props.successHref]);

  const errors =
    state.status === "error" ? state.errors : ({} as Record<string, string>);

  return (
    <div className="w-full">
      <form action={formAction} noValidate className="space-y-12 mt-8">
        <div className="grid gap-10">
          {state.status === "error" && state.formMessage ? (
            <div
              ref={errorBannerRef}
              role="alert"
              tabIndex={-1}
              className="rounded-lg border border-destructive bg-destructive/10 p-4 text-sm text-destructive font-medium"
            >
              {state.formMessage}
            </div>
          ) : null}
          {props.role === "student" ? (
            <RoleFieldsStudent
              value={props.initialValue as StudentFormInput}
              chipValues={{
                skills: chipState.skills ?? (props.initialValue as StudentFormInput).skills,
                careerInterests:
                  chipState.careerInterests ??
                  (props.initialValue as StudentFormInput).careerInterests,
              }}
              onChipChange={setChip}
              errors={errors as Partial<Record<keyof StudentFormInput, string>>}
              editableFields={
                props.editableFields as ReadonlyArray<keyof StudentFormInput>
              }
            />
          ) : null}
          {props.role === "club" ? (
            <RoleFieldsClub
              value={props.initialValue as ClubFormInput}
              chipValues={{
                categories:
                  chipState.categories ??
                  (props.initialValue as ClubFormInput).categories,
                eventFocus:
                  chipState.eventFocus ??
                  (props.initialValue as ClubFormInput).eventFocus,
                sponsorshipNeeds:
                  chipState.sponsorshipNeeds ??
                  (props.initialValue as ClubFormInput).sponsorshipNeeds,
              }}
              onChipChange={setChip}
              errors={errors as Partial<Record<keyof ClubFormInput, string>>}
              editableFields={
                props.editableFields as ReadonlyArray<keyof ClubFormInput>
              }
            />
          ) : null}
          {props.role === "corporate" ? (
            <RoleFieldsCorporate
              value={props.initialValue as CorporateFormInput}
              chipValues={{
                talentNeeds:
                  chipState.talentNeeds ??
                  (props.initialValue as CorporateFormInput).talentNeeds,
                sponsorshipInterests:
                  chipState.sponsorshipInterests ??
                  (props.initialValue as CorporateFormInput)
                    .sponsorshipInterests,
                csrFocus:
                  chipState.csrFocus ??
                  (props.initialValue as CorporateFormInput).csrFocus,
              }}
              onChipChange={setChip}
              errors={
                errors as Partial<Record<keyof CorporateFormInput, string>>
              }
              editableFields={
                props.editableFields as ReadonlyArray<keyof CorporateFormInput>
              }
            />
          ) : null}
        </div>
        <div className="pt-8 border-t border-border flex justify-end">
          <Button type="submit" size="lg" className="rounded-full px-10 h-14 text-lg font-semibold shadow-xl hover:shadow-primary/25 transition-all w-full sm:w-auto">
            {props.submitLabel}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default OnboardingForm;
