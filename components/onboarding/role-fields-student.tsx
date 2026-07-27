"use client";

import * as React from "react";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ChipInput } from "@/components/onboarding/chip-input";
import { FieldError } from "@/components/onboarding/field-error";
import type { StudentFormInput } from "@/lib/server/personas/schemas";

type Errors = Partial<Record<keyof StudentFormInput, string>>;

export interface RoleFieldsStudentProps {
  value: StudentFormInput;
  chipValues: { skills: string[]; careerInterests: string[] };
  onChipChange: (field: string, next: string[]) => void;
  errors?: Errors;
  editableFields?: ReadonlyArray<keyof StudentFormInput>;
}

const ALL: ReadonlyArray<keyof StudentFormInput> = [
  "fullName",
  "university",
  "studyProgram",
  "expectedGraduation",
  "location",
  "bio",
  "skills",
  "careerInterests",
];

export function RoleFieldsStudent({
  value,
  chipValues,
  onChipChange,
  errors,
  editableFields,
}: RoleFieldsStudentProps) {
  const editable = editableFields ?? ALL;
  const isEditable = (k: keyof StudentFormInput) =>
    (editable as ReadonlyArray<string>).includes(k as string);
  return (
    <div className="grid gap-4">
      <FieldWithError
        id="fullName"
        label="Full name"
        error={errors?.fullName}
      >
        <Input
          id="fullName"
          name="fullName"
          defaultValue={value.fullName}
          readOnly={!isEditable("fullName")}
          aria-invalid={errors?.fullName ? true : undefined}
          aria-describedby={errors?.fullName ? "fullName-err" : undefined}
        />
      </FieldWithError>
      <FieldWithError
        id="university"
        label="University"
        error={errors?.university}
      >
        <Input
          id="university"
          name="university"
          defaultValue={value.university}
          readOnly={!isEditable("university")}
          aria-invalid={errors?.university ? true : undefined}
          aria-describedby={errors?.university ? "university-err" : undefined}
        />
      </FieldWithError>
      <div className="grid gap-4 sm:grid-cols-2">
        <FieldWithError
          id="studyProgram"
          label="Study program"
          error={errors?.studyProgram}
        >
          <Input
            id="studyProgram"
            name="studyProgram"
            defaultValue={value.studyProgram}
            readOnly={!isEditable("studyProgram")}
            aria-invalid={errors?.studyProgram ? true : undefined}
            aria-describedby={
              errors?.studyProgram ? "studyProgram-err" : undefined
            }
          />
        </FieldWithError>
        <FieldWithError
          id="expectedGraduation"
          label="Expected graduation"
          error={errors?.expectedGraduation}
        >
          <Input
            id="expectedGraduation"
            name="expectedGraduation"
            defaultValue={value.expectedGraduation}
            readOnly={!isEditable("expectedGraduation")}
            aria-invalid={errors?.expectedGraduation ? true : undefined}
            aria-describedby={
              errors?.expectedGraduation
                ? "expectedGraduation-err"
                : undefined
            }
            placeholder="e.g. '26 or Spring 2026"
          />
        </FieldWithError>
      </div>
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
      <FieldWithError id="bio" label="Short bio">
        <Textarea
          id="bio"
          name="bio"
          defaultValue={value.bio}
          readOnly={!isEditable("bio")}
        />
      </FieldWithError>
      <FieldWithError id="skills" label="" error={errors?.skills}>
        <ChipInput
          name="skills"
          label="Skills"
          value={chipValues.skills}
          onChange={(v) => onChipChange("skills", v)}
          invalid={Boolean(errors?.skills)}
          describedById="skills-err"
        />
      </FieldWithError>
      <FieldWithError
        id="careerInterests"
        label=""
        error={errors?.careerInterests}
      >
        <ChipInput
          name="careerInterests"
          label="Career interests"
          value={chipValues.careerInterests}
          onChange={(v) => onChipChange("careerInterests", v)}
          invalid={Boolean(errors?.careerInterests)}
          describedById="careerInterests-err"
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

export default RoleFieldsStudent;