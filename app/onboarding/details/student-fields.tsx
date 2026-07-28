"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChipInput } from "@/components/onboarding/chip-input";
import { FieldError } from "@/components/onboarding/field-error";

export interface StudentFieldsProps {
  defaultValue: {
    fullName: string;
    university: string;
    studyProgram: string;
    expectedGraduation: string;
    location: string;
    skills: string[];
    careerInterests: string[];
  };
  errors: Record<string, string>;
  onSkillsChange: (v: string[]) => void;
  onInterestsChange: (v: string[]) => void;
}

export function StudentFields({
  defaultValue,
  errors,
  onSkillsChange,
  onInterestsChange,
}: StudentFieldsProps) {
  return (
    <div className="grid gap-5">
      <Field id="fullName" label="Full name" error={errors.fullName}>
        <Input
          id="fullName"
          name="fullName"
          defaultValue={defaultValue.fullName}
          required
          aria-invalid={Boolean(errors.fullName)}
          aria-describedby={errors.fullName ? "fullName-err" : undefined}
        />
      </Field>
      <Field id="university" label="University" error={errors.university}>
        <Input
          id="university"
          name="university"
          defaultValue={defaultValue.university}
          placeholder="e.g. BRAC University"
          required
          aria-invalid={Boolean(errors.university)}
          aria-describedby={errors.university ? "university-err" : undefined}
        />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="studyProgram" label="Study program" error={errors.studyProgram}>
          <Input
            id="studyProgram"
            name="studyProgram"
            defaultValue={defaultValue.studyProgram}
            placeholder="e.g. B.Sc. in Computer Science"
            required
            aria-invalid={Boolean(errors.studyProgram)}
            aria-describedby={errors.studyProgram ? "studyProgram-err" : undefined}
          />
        </Field>
        <Field
          id="expectedGraduation"
          label="Expected graduation"
          error={errors.expectedGraduation}
        >
          <Input
            id="expectedGraduation"
            name="expectedGraduation"
            defaultValue={defaultValue.expectedGraduation}
            placeholder="e.g. Spring 2026"
            required
            aria-invalid={Boolean(errors.expectedGraduation)}
            aria-describedby={
              errors.expectedGraduation ? "expectedGraduation-err" : undefined
            }
          />
        </Field>
      </div>
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
      <div className="grid gap-1.5">
        <ChipInput
          name="skills"
          label="Skills"
          value={defaultValue.skills}
          onChange={onSkillsChange}
          placeholder="Add a skill — e.g. Python, React, research"
          invalid={Boolean(errors.skills)}
          describedById="skills-err"
        />
        <FieldError id="skills-err" message={errors.skills} />
      </div>
      <div className="grid gap-1.5">
        <ChipInput
          name="careerInterests"
          label="Career interests"
          value={defaultValue.careerInterests}
          onChange={onInterestsChange}
          placeholder="Add an interest — e.g. ML, fintech, climate tech"
          invalid={Boolean(errors.careerInterests)}
          describedById="careerInterests-err"
        />
        <FieldError id="careerInterests-err" message={errors.careerInterests} />
      </div>
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

export default StudentFields;