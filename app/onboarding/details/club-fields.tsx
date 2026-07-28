"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChipInput } from "@/components/onboarding/chip-input";
import { FieldError } from "@/components/onboarding/field-error";

export interface ClubFieldsProps {
  defaultValue: {
    clubName: string;
    university: string;
    categories: string[];
    audienceReachLabel: string;
    eventFocus: string[];
    sponsorshipNeeds: string[];
    contactRole: string;
  };
  errors: Record<string, string>;
  onChips: (field: "categories" | "eventFocus" | "sponsorshipNeeds", v: string[]) => void;
}

export function ClubFields({ defaultValue, errors, onChips }: ClubFieldsProps) {
  return (
    <div className="grid gap-5">
      <Field id="clubName" label="Club name" error={errors.clubName}>
        <Input
          id="clubName"
          name="clubName"
          defaultValue={defaultValue.clubName}
          required
          aria-invalid={Boolean(errors.clubName)}
          aria-describedby={errors.clubName ? "clubName-err" : undefined}
        />
      </Field>
      <Field id="university" label="University" error={errors.university}>
        <Input
          id="university"
          name="university"
          defaultValue={defaultValue.university}
          placeholder="e.g. North South University"
          required
          aria-invalid={Boolean(errors.university)}
          aria-describedby={errors.university ? "university-err" : undefined}
        />
      </Field>
      <div className="grid gap-1.5">
        <ChipInput
          name="categories"
          label="Categories"
          value={defaultValue.categories}
          onChange={(v) => onChips("categories", v)}
          placeholder="e.g. Robotics, Debate, Cultural"
          invalid={Boolean(errors.categories)}
          describedById="categories-err"
        />
        <FieldError id="categories-err" message={errors.categories} />
      </div>
      <Field
        id="audienceReachLabel"
        label="Audience or member reach"
        error={errors.audienceReachLabel}
      >
        <Input
          id="audienceReachLabel"
          name="audienceReachLabel"
          defaultValue={defaultValue.audienceReachLabel}
          placeholder="e.g. 200 active members, 1.5k event reach"
          required
          aria-invalid={Boolean(errors.audienceReachLabel)}
          aria-describedby={
            errors.audienceReachLabel ? "audienceReachLabel-err" : undefined
          }
        />
      </Field>
      <div className="grid gap-1.5">
        <ChipInput
          name="eventFocus"
          label="Event focus"
          value={defaultValue.eventFocus}
          onChange={(v) => onChips("eventFocus", v)}
          placeholder="e.g. Robotics shows, Hackathons, Cultural nights"
          invalid={Boolean(errors.eventFocus)}
          describedById="eventFocus-err"
        />
        <FieldError id="eventFocus-err" message={errors.eventFocus} />
      </div>
      <div className="grid gap-1.5">
        <ChipInput
          name="sponsorshipNeeds"
          label="Sponsorship needs"
          value={defaultValue.sponsorshipNeeds}
          onChange={(v) => onChips("sponsorshipNeeds", v)}
          placeholder="e.g. Cash prize, swag, food, venue"
          invalid={Boolean(errors.sponsorshipNeeds)}
          describedById="sponsorshipNeeds-err"
        />
        <FieldError id="sponsorshipNeeds-err" message={errors.sponsorshipNeeds} />
      </div>
      <Field id="contactRole" label="Your role in the club" error={errors.contactRole}>
        <Input
          id="contactRole"
          name="contactRole"
          defaultValue={defaultValue.contactRole}
          placeholder="e.g. President, Treasurer"
          required
          aria-invalid={Boolean(errors.contactRole)}
          aria-describedby={errors.contactRole ? "contactRole-err" : undefined}
        />
      </Field>
    </div>
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

export default ClubFields;