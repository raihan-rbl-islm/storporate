"use client";

import * as React from "react";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ChipInput } from "@/components/onboarding/chip-input";
import { FieldError } from "@/components/onboarding/field-error";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Target, HeartHandshake } from "lucide-react";
import type { ClubFormInput } from "@/lib/server/personas/schemas";

type Errors = Partial<Record<keyof ClubFormInput, string>>;

export interface RoleFieldsClubProps {
  value: ClubFormInput;
  chipValues: {
    categories: string[];
    eventFocus: string[];
    sponsorshipNeeds: string[];
  };
  onChipChange: (field: string, next: string[]) => void;
  errors?: Errors;
  editableFields?: ReadonlyArray<keyof ClubFormInput>;
}

const ALL: ReadonlyArray<keyof ClubFormInput> = [
  "clubName",
  "university",
  "categories",
  "mission",
  "audienceReachLabel",
  "eventFocus",
  "sponsorshipNeeds",
  "location",
  "contactRole",
];

export function RoleFieldsClub({
  value,
  chipValues,
  onChipChange,
  errors,
  editableFields,
}: RoleFieldsClubProps) {
  const editable = editableFields ?? ALL;
  const isEditable = (k: keyof ClubFormInput) =>
    (editable as ReadonlyArray<string>).includes(k as string);
  return (
    <div className="grid gap-8">
      <Card className="border-primary/10 shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/30 border-b pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="size-5 text-primary" /> Club Identity
          </CardTitle>
          <CardDescription>Basic information about your organization.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 pt-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <FieldWithError id="clubName" label="Club name" error={errors?.clubName}>
              <Input
                id="clubName"
                name="clubName"
                defaultValue={value.clubName}
                readOnly={!isEditable("clubName")}
                aria-invalid={errors?.clubName ? true : undefined}
                aria-describedby={errors?.clubName ? "clubName-err" : undefined}
              />
            </FieldWithError>
            <FieldWithError id="university" label="University" error={errors?.university}>
              <Input
                id="university"
                name="university"
                defaultValue={value.university}
                readOnly={!isEditable("university")}
                aria-invalid={errors?.university ? true : undefined}
                aria-describedby={errors?.university ? "university-err" : undefined}
              />
            </FieldWithError>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
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
            <FieldWithError id="contactRole" label="Your Role (e.g. President)" error={errors?.contactRole}>
              <Input
                id="contactRole"
                name="contactRole"
                defaultValue={value.contactRole}
                readOnly={!isEditable("contactRole")}
                aria-invalid={errors?.contactRole ? true : undefined}
                aria-describedby={errors?.contactRole ? "contactRole-err" : undefined}
              />
            </FieldWithError>
          </div>
          <FieldWithError id="categories" label="" error={errors?.categories}>
            <ChipInput
              name="categories"
              label="Categories"
              value={chipValues.categories}
              onChange={(v) => onChipChange("categories", v)}
              invalid={Boolean(errors?.categories)}
              describedById="categories-err"
            />
          </FieldWithError>
        </CardContent>
      </Card>

      <Card className="border-primary/10 shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/30 border-b pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="size-5 text-primary" /> Mission & Reach
          </CardTitle>
          <CardDescription>Tell us about your audience and goals.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 pt-6">
          <FieldWithError id="mission" label="Mission" error={errors?.mission}>
            <Textarea
              id="mission"
              name="mission"
              defaultValue={value.mission}
              readOnly={!isEditable("mission")}
              className="min-h-[100px]"
            />
          </FieldWithError>
          <FieldWithError id="audienceReachLabel" label="Audience or member reach (self-reported)" error={errors?.audienceReachLabel}>
            <Input
              id="audienceReachLabel"
              name="audienceReachLabel"
              defaultValue={value.audienceReachLabel}
              readOnly={!isEditable("audienceReachLabel")}
              aria-invalid={errors?.audienceReachLabel ? true : undefined}
              aria-describedby={errors?.audienceReachLabel ? "audienceReachLabel-err" : undefined}
            />
          </FieldWithError>
          <FieldWithError id="eventFocus" label="" error={errors?.eventFocus}>
            <ChipInput
              name="eventFocus"
              label="Event focus"
              value={chipValues.eventFocus}
              onChange={(v) => onChipChange("eventFocus", v)}
              invalid={Boolean(errors?.eventFocus)}
              describedById="eventFocus-err"
            />
          </FieldWithError>
        </CardContent>
      </Card>

      <Card className="border-primary/10 shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/30 border-b pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <HeartHandshake className="size-5 text-primary" /> Logistics & Sponsorships
          </CardTitle>
          <CardDescription>What you need from corporate partners.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 pt-6">
          <FieldWithError id="sponsorshipNeeds" label="" error={errors?.sponsorshipNeeds}>
            <ChipInput
              name="sponsorshipNeeds"
              label="Sponsorship needs"
              value={chipValues.sponsorshipNeeds}
              onChange={(v) => onChipChange("sponsorshipNeeds", v)}
              invalid={Boolean(errors?.sponsorshipNeeds)}
              describedById="sponsorshipNeeds-err"
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