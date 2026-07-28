"use client";

import * as React from "react";
import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChipInput } from "@/components/onboarding/chip-input";

import {
  createJob,
  type JobFormState,
} from "@/app/(pages)/jobs/actions";

export interface CreateJobFormProps {
  initialValue?: {
    title: string;
    description: string;
    employmentType: string;
    locationLabel: string;
    isRemote: boolean;
    startsOn: string;
    endsOn: string;
    applyUrl: string;
    applyEmail: string;
    skills: string[];
  };
  jobId?: string;
  submitLabel?: string;
  mode?: "create" | "edit";
}

const INITIAL: JobFormState = { status: "idle" };

export function CreateJobForm({
  initialValue,
  jobId,
  submitLabel,
  mode = "create",
}: CreateJobFormProps) {
  const router = useRouter();
  const [skills, setSkills] = useState<string[]>(initialValue?.skills ?? []);
  const [isRemote, setIsRemote] = useState<boolean>(
    initialValue?.isRemote ?? false,
  );
  const [employmentType, setEmploymentType] = useState<string>(
    initialValue?.employmentType ?? "internship",
  );

  const [state, formAction] = useActionState<JobFormState, FormData>(
    async (prev, fd) => {
      if (mode === "edit" && jobId) {
        const { updateJob } = await import("@/app/(pages)/jobs/actions");
        return updateJob(jobId, prev, fd);
      }
      return createJob(prev, fd);
    },
    INITIAL,
  );

  const errorBannerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (state.status === "error") {
      errorBannerRef.current?.focus();
    } else if (state.status === "success" && mode === "edit") {
      router.refresh();
    }
  }, [state, mode, router]);

  const errors =
    state.status === "error" ? state.fieldErrors : ({} as Record<string, string>);
  const titleError = errors.title;
  const descriptionError = errors.description;
  const employmentError = errors.employmentType;
  const locationError = errors.locationLabel;
  const startsOnError = errors.startsOn;
  const endsOnError = errors.endsOn;
  const applyUrlError = errors.applyUrl;
  const applyEmailError = errors.applyEmail;
  const skillsError = errors.skills;
  const isRemoteError = errors.isRemote;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {mode === "create" ? "Post a new job" : "Edit job"}
        </CardTitle>
      </CardHeader>
      <form action={formAction} noValidate>
        <CardContent className="grid gap-5">
          {state.status === "error" && state.formMessage ? (
            <div
              ref={errorBannerRef}
              role="alert"
              tabIndex={-1}
              className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive"
            >
              {state.formMessage}
            </div>
          ) : null}
          {state.status === "success" && mode === "edit" ? (
            <div
              role="status"
              className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100"
            >
              {state.message}
            </div>
          ) : null}
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              defaultValue={initialValue?.title ?? ""}
              required
              minLength={3}
              aria-invalid={titleError ? true : undefined}
            />
            {titleError ? (
              <p className="text-xs text-destructive">{titleError}</p>
            ) : null}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={initialValue?.description ?? ""}
              rows={5}
              aria-invalid={descriptionError ? true : undefined}
              placeholder="What will this person do? What experience or skills matter most?"
            />
            {descriptionError ? (
              <p className="text-xs text-destructive">{descriptionError}</p>
            ) : null}
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="employmentType">Employment type</Label>
              <input
                type="hidden"
                name="employmentType"
                value={employmentType}
              />
              <Select
                value={employmentType}
                onValueChange={(v) =>
                  setEmploymentType(typeof v === "string" ? v : "internship")
                }
              >
                <SelectTrigger
                  id="employmentType"
                  aria-invalid={employmentError ? true : undefined}
                >
                  <SelectValue placeholder="Select a type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="internship">Internship</SelectItem>
                  <SelectItem value="full-time">Full-time</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="research">Research</SelectItem>
                </SelectContent>
              </Select>
              {employmentError ? (
                <p className="text-xs text-destructive">{employmentError}</p>
              ) : null}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="locationLabel">Location</Label>
              <Input
                id="locationLabel"
                name="locationLabel"
                defaultValue={initialValue?.locationLabel ?? ""}
                placeholder="e.g. Dhaka, Bangladesh"
                aria-invalid={locationError ? true : undefined}
              />
              {locationError ? (
                <p className="text-xs text-destructive">{locationError}</p>
              ) : null}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="isRemote"
              checked={isRemote}
              onCheckedChange={(checked) => setIsRemote(checked === true)}
            />
            <input
              type="hidden"
              name="isRemote"
              value={isRemote ? "true" : "false"}
            />
            <Label htmlFor="isRemote">Open to remote candidates</Label>
            {isRemoteError ? (
              <p className="ml-2 text-xs text-destructive">{isRemoteError}</p>
            ) : null}
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="startsOn">Starts from (optional)</Label>
              <Input
                id="startsOn"
                name="startsOn"
                type="month"
                defaultValue={initialValue?.startsOn ?? ""}
                aria-invalid={startsOnError ? true : undefined}
              />
              {startsOnError ? (
                <p className="text-xs text-destructive">{startsOnError}</p>
              ) : null}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="endsOn">Apply by (optional)</Label>
              <Input
                id="endsOn"
                name="endsOn"
                type="month"
                defaultValue={initialValue?.endsOn ?? ""}
                aria-invalid={endsOnError ? true : undefined}
              />
              {endsOnError ? (
                <p className="text-xs text-destructive">{endsOnError}</p>
              ) : null}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="applyUrl">Apply URL</Label>
              <Input
                id="applyUrl"
                name="applyUrl"
                type="text"
                defaultValue={initialValue?.applyUrl ?? ""}
                placeholder="https://yourcompany.bd/careers/…"
                aria-invalid={applyUrlError ? true : undefined}
              />
              {applyUrlError ? (
                <p className="text-xs text-destructive">{applyUrlError}</p>
              ) : null}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="applyEmail">Apply email</Label>
              <Input
                id="applyEmail"
                name="applyEmail"
                type="email"
                defaultValue={initialValue?.applyEmail ?? ""}
                placeholder="careers@yourcompany.bd"
                aria-invalid={applyEmailError ? true : undefined}
              />
              {applyEmailError ? (
                <p className="text-xs text-destructive">{applyEmailError}</p>
              ) : null}
              <p className="text-xs text-muted-foreground">
                At least one of URL or email is required.
              </p>
            </div>
          </div>
          <ChipInput
            name="skills"
            label="Skills"
            value={skills}
            onChange={setSkills}
            placeholder="Add a skill (e.g. React) and press Enter"
            invalid={Boolean(skillsError)}
          />
        </CardContent>
        <CardFooter>
          <Button type="submit">
            {submitLabel ?? (mode === "create" ? "Post job" : "Save changes")}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

export default CreateJobForm;