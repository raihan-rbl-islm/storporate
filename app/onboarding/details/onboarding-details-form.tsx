"use client";

import * as React from "react";
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

import {
  submitMinimumProfile,
  type DetailsFormState,
} from "./actions";
import { StudentFields } from "./student-fields";
import { ClubFields } from "./club-fields";
import { CorporateFields } from "./corporate-fields";
import type { PersonaRole } from "@/data/personas";

const INITIAL: DetailsFormState = { status: "idle" };

interface OnboardingDetailsFormProps {
  role: PersonaRole;
  initialValue: Record<string, unknown>;
}

export function OnboardingDetailsForm({
  role,
  initialValue,
}: OnboardingDetailsFormProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<DetailsFormState, FormData>(
    submitMinimumProfile,
    INITIAL,
  );
  const errors =
    state.status === "error" ? state.fieldErrors : ({} as Record<string, string>);

  // Chip values are mirrored into React state so we can re-render them as
  // they change without losing the FormData hidden inputs.
  const [skills, setSkills] = React.useState<string[]>(
    (initialValue.skills as string[]) ?? [],
  );
  const [interests, setInterests] = React.useState<string[]>(
    (initialValue.careerInterests as string[]) ?? [],
  );
  const [categories, setCategories] = React.useState<string[]>(
    (initialValue.categories as string[]) ?? [],
  );
  const [eventFocus, setEventFocus] = React.useState<string[]>(
    (initialValue.eventFocus as string[]) ?? [],
  );
  const [sponsorshipNeeds, setSponsorshipNeeds] = React.useState<string[]>(
    (initialValue.sponsorshipNeeds as string[]) ?? [],
  );
  const [talentNeeds, setTalentNeeds] = React.useState<string[]>(
    (initialValue.talentNeeds as string[]) ?? [],
  );
  const [sponsorshipInterests, setSponsorshipInterests] = React.useState<string[]>(
    (initialValue.sponsorshipInterests as string[]) ?? [],
  );
  const [csrFocus, setCsrFocus] = React.useState<string[]>(
    (initialValue.csrFocus as string[]) ?? [],
  );

  // Server action redirects to /dashboard on success — this effect is
  // just a fallback in case the action returns a success state without
  // throwing a redirect (e.g. middleware interop).
  useEffect(() => {
    if (state.status === "success") router.push("/dashboard");
  }, [state, router]);

  return (
    <form action={formAction} noValidate className="grid gap-6">
      {state.status === "error" && state.formMessage ? (
        <p
          role="alert"
          className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive"
        >
          {state.formMessage}
        </p>
      ) : null}

      {role === "student" ? (
        <StudentFields
          defaultValue={{
            fullName: (initialValue.fullName as string) ?? "",
            university: (initialValue.university as string) ?? "",
            studyProgram: (initialValue.studyProgram as string) ?? "",
            expectedGraduation:
              (initialValue.expectedGraduation as string) ?? "",
            location: (initialValue.location as string) ?? "",
            skills,
            careerInterests: interests,
          }}
          errors={errors}
          onSkillsChange={setSkills}
          onInterestsChange={setInterests}
        />
      ) : null}

      {role === "club" ? (
        <ClubFields
          defaultValue={{
            clubName: (initialValue.clubName as string) ?? "",
            university: (initialValue.university as string) ?? "",
            categories,
            audienceReachLabel:
              (initialValue.audienceReachLabel as string) ?? "",
            eventFocus,
            sponsorshipNeeds,
            contactRole: (initialValue.contactRole as string) ?? "",
          }}
          errors={errors}
          onChips={(field, v) => {
            if (field === "categories") setCategories(v);
            if (field === "eventFocus") setEventFocus(v);
            if (field === "sponsorshipNeeds") setSponsorshipNeeds(v);
          }}
        />
      ) : null}

      {role === "corporate" ? (
        <CorporateFields
          defaultValue={{
            organizationName:
              (initialValue.organizationName as string) ?? "",
            industry: (initialValue.industry as string) ?? "",
            location: (initialValue.location as string) ?? "",
            talentNeeds,
            sponsorshipInterests,
            csrFocus,
            collaborationIntent:
              ((initialValue.collaborationIntent as
                | "hiring"
                | "sponsorship"
                | "both") ?? "hiring"),
          }}
          errors={errors}
          onChips={(field, v) => {
            if (field === "talentNeeds") setTalentNeeds(v);
            if (field === "sponsorshipInterests")
              setSponsorshipInterests(v);
            if (field === "csrFocus") setCsrFocus(v);
          }}
        />
      ) : null}

      <div className="flex items-center justify-between gap-3 border-t border-border/60 pt-5">
        <p className="text-muted-foreground text-xs">
          You can fill the rest of your profile later from the dashboard.
        </p>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Continue to dashboard"}
        </Button>
      </div>
    </form>
  );
}

export default OnboardingDetailsForm;