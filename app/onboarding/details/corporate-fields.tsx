"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChipInput } from "@/components/onboarding/chip-input";
import { FieldError } from "@/components/onboarding/field-error";

export interface CorporateFieldsProps {
  defaultValue: {
    organizationName: string;
    industry: string;
    location: string;
    talentNeeds: string[];
    sponsorshipInterests: string[];
    csrFocus: string[];
    collaborationIntent: "hiring" | "sponsorship" | "both";
  };
  errors: Record<string, string>;
  onChips: (
    field: "talentNeeds" | "sponsorshipInterests" | "csrFocus",
    v: string[],
  ) => void;
}

export function CorporateFields({
  defaultValue,
  errors,
  onChips,
}: CorporateFieldsProps) {
  return (
    <div className="grid gap-5">
      <Field
        id="organizationName"
        label="Organization name"
        error={errors.organizationName}
      >
        <Input
          id="organizationName"
          name="organizationName"
          defaultValue={defaultValue.organizationName}
          required
          aria-invalid={Boolean(errors.organizationName)}
          aria-describedby={
            errors.organizationName ? "organizationName-err" : undefined
          }
        />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="industry" label="Industry" error={errors.industry}>
          <Input
            id="industry"
            name="industry"
            defaultValue={defaultValue.industry}
            placeholder="e.g. Fintech"
            required
            aria-invalid={Boolean(errors.industry)}
            aria-describedby={errors.industry ? "industry-err" : undefined}
          />
        </Field>
        <Field id="location" label="Location" error={errors.location}>
          <Input
            id="location"
            name="location"
            defaultValue={defaultValue.location}
            placeholder="e.g. Dhaka, Bangladesh"
            required
            aria-invalid={Boolean(errors.location)}
            aria-describedby={errors.location ? "location-err" : undefined}
          />
        </Field>
      </div>
      <div className="grid gap-1.5">
        <ChipInput
          name="talentNeeds"
          label="Talent needs"
          value={defaultValue.talentNeeds}
          onChange={(v) => onChips("talentNeeds", v)}
          placeholder="e.g. ML engineers, Product designers"
          invalid={Boolean(errors.talentNeeds)}
          describedById="talentNeeds-err"
        />
        <FieldError id="talentNeeds-err" message={errors.talentNeeds} />
      </div>
      <div className="grid gap-1.5">
        <ChipInput
          name="sponsorshipInterests"
          label="Sponsorship interests"
          value={defaultValue.sponsorshipInterests}
          onChange={(v) => onChips("sponsorshipInterests", v)}
          placeholder="e.g. Hackathons, STEM outreach, Career fairs"
          invalid={Boolean(errors.sponsorshipInterests)}
          describedById="sponsorshipInterests-err"
        />
        <FieldError
          id="sponsorshipInterests-err"
          message={errors.sponsorshipInterests}
        />
      </div>
      <div className="grid gap-1.5">
        <ChipInput
          name="csrFocus"
          label="CSR focus areas"
          value={defaultValue.csrFocus}
          onChange={(v) => onChips("csrFocus", v)}
          placeholder="e.g. Education, Financial inclusion"
          invalid={Boolean(errors.csrFocus)}
          describedById="csrFocus-err"
        />
        <FieldError id="csrFocus-err" message={errors.csrFocus} />
      </div>

      <fieldset className="grid gap-2">
        <legend className="text-sm font-medium">
          What are you here to do?
        </legend>
        <div className="flex flex-wrap gap-2">
          {(
            [
              { id: "hiring", label: "Hire talent" },
              { id: "sponsorship", label: "Sponsor clubs or events" },
              { id: "both", label: "Both" },
            ] as const
          ).map((opt) => (
            <label
              key={opt.id}
              className="border-input bg-background hover:bg-muted flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5"
            >
              <input
                type="radio"
                name="collaborationIntent"
                value={opt.id}
                defaultChecked={defaultValue.collaborationIntent === opt.id}
                className="accent-primary size-4"
              />
              {opt.label}
            </label>
          ))}
        </div>
        <FieldError
          id="collaborationIntent-err"
          message={errors.collaborationIntent}
        />
      </fieldset>
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

export default CorporateFields;