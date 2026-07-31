"use client";

import * as React from "react";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ChipInput } from "@/components/onboarding/chip-input";
import { FieldError } from "@/components/onboarding/field-error";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Building2, Globe, HeartHandshake } from "lucide-react";
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
  "talentNeeds",
  "sponsorshipInterests",
  "csrFocus",
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
    <div className="grid gap-8">
      <Card className="border-primary/10 shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/30 border-b pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="size-5 text-primary" /> Organization Profile
          </CardTitle>
          <CardDescription>Basic information about your company.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 pt-6">
          <FieldWithError id="organizationName" label="Organization name" error={errors?.organizationName}>
            <Input
              id="organizationName"
              name="organizationName"
              defaultValue={value.organizationName}
              readOnly={!isEditable("organizationName")}
              aria-invalid={errors?.organizationName ? true : undefined}
              aria-describedby={errors?.organizationName ? "organizationName-err" : undefined}
            />
          </FieldWithError>
          <div className="grid gap-6 sm:grid-cols-2">
            <FieldWithError id="industry" label="Industry" error={errors?.industry}>
              <Input
                id="industry"
                name="industry"
                defaultValue={value.industry}
                readOnly={!isEditable("industry")}
                aria-invalid={errors?.industry ? true : undefined}
                aria-describedby={errors?.industry ? "industry-err" : undefined}
              />
            </FieldWithError>
            <FieldWithError id="location" label="Location" error={errors?.location}>
              <Input
                id="location"
                name="location"
                defaultValue={value.location}
                readOnly={!isEditable("location")}
                aria-invalid={errors?.location ? true : undefined}
                aria-describedby={errors?.location ? "location-err" : undefined}
              />
            </FieldWithError>
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary/10 shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/30 border-b pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Globe className="size-5 text-primary" /> Strategy & Focus
          </CardTitle>
          <CardDescription>Your organizational goals and CSR focus.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 pt-6">
          <FieldWithError id="csrFocus" label="" error={errors?.csrFocus}>
            <ChipInput
              name="csrFocus"
              label="CSR Focus"
              value={chipValues.csrFocus}
              onChange={(v) => onChipChange("csrFocus", v)}
              invalid={Boolean(errors?.csrFocus)}
              describedById="csrFocus-err"
            />
          </FieldWithError>
        </CardContent>
      </Card>

      <Card className="border-primary/10 shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/30 border-b pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <HeartHandshake className="size-5 text-primary" /> Needs & Matching
          </CardTitle>
          <CardDescription>What you are looking for in candidates and clubs.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 pt-6">
          <FieldWithError id="talentNeeds" label="" error={errors?.talentNeeds}>
            <ChipInput
              name="talentNeeds"
              label="Talent needs"
              value={chipValues.talentNeeds}
              onChange={(v) => onChipChange("talentNeeds", v)}
              invalid={Boolean(errors?.talentNeeds)}
              describedById="talentNeeds-err"
            />
          </FieldWithError>
          <FieldWithError id="sponsorshipInterests" label="" error={errors?.sponsorshipInterests}>
            <ChipInput
              name="sponsorshipInterests"
              label="Sponsorship interests"
              value={chipValues.sponsorshipInterests}
              onChange={(v) => onChipChange("sponsorshipInterests", v)}
              invalid={Boolean(errors?.sponsorshipInterests)}
              describedById="sponsorshipInterests-err"
            />
          </FieldWithError>
        </CardContent>
      </Card>
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