"use client";

import * as React from "react";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ChipInput } from "@/components/onboarding/chip-input";
import { FieldError } from "@/components/onboarding/field-error";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { CorporateFormInput } from "@/lib/server/personas/schemas";

type Errors = Partial<Record<keyof CorporateFormInput, string>>;

export interface RoleFieldsCorporateProps {
  value: CorporateFormInput;
  chipValues: {
    talentNeeds: string[];
    sponsorshipInterests: string[];
    csrFocus: string[];
  };
  onChipChange: (field: string, next: string[]) => void;
  errors?: Errors;
  editableFields?: ReadonlyArray<keyof CorporateFormInput>;
}

const ALL: ReadonlyArray<keyof CorporateFormInput> = [
  "organizationName",
  "industry",
  "location",
  "description",
  "talentNeeds",
  "sponsorshipInterests",
  "csrFocus",
  "budgetRange",
  "collaborationIntent",
];

export function RoleFieldsCorporate({
  value,
  chipValues,
  onChipChange,
  errors,
  editableFields,
}: RoleFieldsCorporateProps) {
  const editable = editableFields ?? ALL;
  const isEditable = (k: keyof CorporateFormInput) =>
    (editable as ReadonlyArray<string>).includes(k as string);
  return (
    <div className="grid gap-4">
      <FieldWithError
        id="organizationName"
        label="Organization name"
        error={errors?.organizationName}
      >
        <Input
          id="organizationName"
          name="organizationName"
          defaultValue={value.organizationName}
          readOnly={!isEditable("organizationName")}
          aria-invalid={errors?.organizationName ? true : undefined}
          aria-describedby={
            errors?.organizationName ? "organizationName-err" : undefined
          }
        />
      </FieldWithError>
      <FieldWithError
        id="industry"
        label="Industry"
        error={errors?.industry}
      >
        <Input
          id="industry"
          name="industry"
          defaultValue={value.industry}
          readOnly={!isEditable("industry")}
          aria-invalid={errors?.industry ? true : undefined}
          aria-describedby={errors?.industry ? "industry-err" : undefined}
        />
      </FieldWithError>
      <FieldWithError
        id="location"
        label="Location"
        error={errors?.location}
      >
        <Input
          id="location"
          name="location"
          defaultValue={value.location}
          readOnly={!isEditable("location")}
          aria-invalid={errors?.location ? true : undefined}
          aria-describedby={errors?.location ? "location-err" : undefined}
        />
      </FieldWithError>
      <FieldWithError id="description" label="Description">
        <Textarea
          id="description"
          name="description"
          defaultValue={value.description}
          readOnly={!isEditable("description")}
        />
      </FieldWithError>
      <FieldWithError
        id="talentNeeds"
        label=""
        error={errors?.talentNeeds}
      >
        <ChipInput
          name="talentNeeds"
          label="Talent needs"
          value={chipValues.talentNeeds}
          onChange={(v) => onChipChange("talentNeeds", v)}
          invalid={Boolean(errors?.talentNeeds)}
          describedById="talentNeeds-err"
        />
      </FieldWithError>
      <FieldWithError
        id="sponsorshipInterests"
        label=""
        error={errors?.sponsorshipInterests}
      >
        <ChipInput
          name="sponsorshipInterests"
          label="Sponsorship interests"
          value={chipValues.sponsorshipInterests}
          onChange={(v) =>
            onChipChange("sponsorshipInterests", v)
          }
          invalid={Boolean(errors?.sponsorshipInterests)}
          describedById="sponsorshipInterests-err"
        />
      </FieldWithError>
      <FieldWithError id="csrFocus" label="" error={errors?.csrFocus}>
        <ChipInput
          name="csrFocus"
          label="CSR focus"
          value={chipValues.csrFocus}
          onChange={(v) => onChipChange("csrFocus", v)}
          invalid={Boolean(errors?.csrFocus)}
          describedById="csrFocus-err"
        />
      </FieldWithError>
      <FieldWithError
        id="budgetRange"
        label="Budget range (illustrative)"
        error={errors?.budgetRange}
      >
        <Input
          id="budgetRange"
          name="budgetRange"
          defaultValue={value.budgetRange}
          readOnly={!isEditable("budgetRange")}
          placeholder="Leave blank or write a band like BDT 500k-1M"
          aria-invalid={errors?.budgetRange ? true : undefined}
          aria-describedby={
            errors?.budgetRange ? "budgetRange-err" : undefined
          }
        />
      </FieldWithError>
      <FieldWithError
        id="collaborationIntent"
        label="Collaboration intent"
        error={errors?.collaborationIntent}
      >
        <RadioGroup
          name="collaborationIntent"
          defaultValue={value.collaborationIntent}
          disabled={!isEditable("collaborationIntent")}
          aria-describedby={
            errors?.collaborationIntent
              ? "collaborationIntent-err"
              : undefined
          }
          aria-invalid={errors?.collaborationIntent ? true : undefined}
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem
              value="hiring"
              id="intent-hiring"
            />
            <Label htmlFor="intent-hiring">Hiring</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem
              value="sponsorship"
              id="intent-sponsorship"
            />
            <Label htmlFor="intent-sponsorship">Sponsorship</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem
              value="both"
              id="intent-both"
            />
            <Label htmlFor="intent-both">Both</Label>
          </div>
        </RadioGroup>
        {/* Hidden fallback so submit always has a value even when the radio
            above is `disabled` and the user cannot change it. The DOM value
            still wins when the radio is enabled. */}
        <input
          type="hidden"
          name="collaborationIntent"
          value={value.collaborationIntent}
        />
      </FieldWithError>
    </div>
  );
}

function FieldWithError({
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
    <div className="flex flex-col gap-1">
      {label ? (
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
      ) : null}
      {children}
      <FieldError id={`${id}-err`} message={error} />
    </div>
  );
}

export default RoleFieldsCorporate;