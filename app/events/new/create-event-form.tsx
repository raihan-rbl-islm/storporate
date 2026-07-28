"use client";

import * as React from "react";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ChipInput } from "@/components/onboarding/chip-input";

import {
  createEvent,
  type EventFormState,
} from "@/app/events/actions";
import { dhakaLocalISOString } from "@/lib/datetime/dhaka";

export interface CreateEventFormProps {
  initialValue?: {
    title: string;
    description: string;
    startsAtLocal: string;
    endsAtLocal: string;
    venue: string;
    locationLabel: string;
    isVirtual: boolean;
    registrationUrl: string;
    capacity: number | null;
    tags: string[];
  };
  /** When provided, the form submits via updateEvent(eventId, …). */
  eventId?: string;
  submitLabel?: string;
  /** "create" = creates and redirects on success; "edit" = stays on page. */
  mode?: "create" | "edit";
}

const INITIAL: EventFormState = { status: "idle" };

/** Tomorrow at 18:00 in Asia/Dhaka. Used to pre-fill starts_at on create. */
export function defaultStartsAtLocal(now: Date = new Date()): string {
  const tomorrowUtc = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  // Start with the same calendar day but snap to 18:00 Dhaka time, then
  // re-format in Dhaka TZ.
  const guess = new Date(
    tomorrowUtc.getUTCFullYear(),
    tomorrowUtc.getUTCMonth(),
    tomorrowUtc.getUTCDate(),
    18,
    0,
    0,
  );
  return dhakaLocalISOString(guess);
}

export function CreateEventForm({
  initialValue,
  eventId,
  submitLabel,
  mode = "create",
}: CreateEventFormProps) {
  const router = useRouter();
  const [tags, setTags] = useState<string[]>(initialValue?.tags ?? []);
  const [isVirtual, setIsVirtual] = useState<boolean>(
    initialValue?.isVirtual ?? false,
  );

  const startsAtDefault = useMemo(
    () =>
      initialValue?.startsAtLocal ??
      defaultStartsAtLocal(new Date()),
    [initialValue],
  );

  const [state, formAction] = useActionState<EventFormState, FormData>(
    async (prev, fd) => {
      if (mode === "edit" && eventId) {
        // Lazy require to avoid pulling the edit path into create-only builds.
        const { updateEvent } = await import("@/app/events/actions");
        return updateEvent(eventId, prev, fd);
      }
      return createEvent(prev, fd);
    },
    INITIAL,
  );

  const errorBannerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (state.status === "error") {
      errorBannerRef.current?.focus();
    } else if (state.status === "success" && mode === "edit") {
      // revalidatePath on the manage page refreshes data; no redirect.
      router.refresh();
    }
  }, [state, mode, router]);

  const errors =
    state.status === "error" ? state.fieldErrors : ({} as Record<string, string>);
  const titleError = errors.title;
  const descriptionError = errors.description;
  const startsAtError = errors.startsAt;
  const endsAtError = errors.endsAt;
  const venueError = errors.venue;
  const locationError = errors.locationLabel;
  const registrationUrlError = errors.registrationUrl;
  const capacityError = errors.capacity;
  const tagsError = errors.tags;
  const isVirtualError = errors.isVirtual;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {mode === "create" ? "Create a new event" : "Edit event"}
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
              placeholder="What is this event about? What should attendees expect?"
            />
            {descriptionError ? (
              <p className="text-xs text-destructive">{descriptionError}</p>
            ) : null}
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="startsAt">Starts at (Asia/Dhaka)</Label>
              <Input
                id="startsAt"
                name="startsAt"
                type="datetime-local"
                defaultValue={startsAtDefault}
                required
                aria-invalid={startsAtError ? true : undefined}
              />
              {startsAtError ? (
                <p className="text-xs text-destructive">{startsAtError}</p>
              ) : null}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="endsAt">Ends at (optional)</Label>
              <Input
                id="endsAt"
                name="endsAt"
                type="datetime-local"
                defaultValue={initialValue?.endsAtLocal ?? ""}
                aria-invalid={endsAtError ? true : undefined}
              />
              {endsAtError ? (
                <p className="text-xs text-destructive">{endsAtError}</p>
              ) : null}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="venue">Venue</Label>
              <Input
                id="venue"
                name="venue"
                defaultValue={initialValue?.venue ?? ""}
                placeholder="e.g. BRAC University Auditorium"
                aria-invalid={venueError ? true : undefined}
              />
              {venueError ? (
                <p className="text-xs text-destructive">{venueError}</p>
              ) : null}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="locationLabel">Location (city/area)</Label>
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
              id="isVirtual"
              checked={isVirtual}
              onCheckedChange={(checked) => setIsVirtual(checked === true)}
            />
            <input
              type="hidden"
              name="isVirtual"
              value={isVirtual ? "true" : "false"}
            />
            <Label htmlFor="isVirtual">This is a virtual event</Label>
            {isVirtualError ? (
              <p className="ml-2 text-xs text-destructive">{isVirtualError}</p>
            ) : null}
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="registrationUrl">
                External registration link or contact email
              </Label>
              <Input
                id="registrationUrl"
                name="registrationUrl"
                type="text"
                defaultValue={initialValue?.registrationUrl ?? ""}
                placeholder="https://forms.gle/… or hello@yourclub.bd"
                aria-invalid={registrationUrlError ? true : undefined}
              />
              {registrationUrlError ? (
                <p className="text-xs text-destructive">
                  {registrationUrlError}
                </p>
              ) : null}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="capacity">Capacity (optional)</Label>
              <Input
                id="capacity"
                name="capacity"
                type="number"
                min={1}
                max={100000}
                defaultValue={
                  initialValue?.capacity !== null &&
                  initialValue?.capacity !== undefined
                    ? String(initialValue.capacity)
                    : ""
                }
                placeholder="Leave blank for unlimited"
                aria-invalid={capacityError ? true : undefined}
              />
              {capacityError ? (
                <p className="text-xs text-destructive">{capacityError}</p>
              ) : null}
            </div>
          </div>
          <ChipInput
            name="tags"
            label="Tags"
            value={tags}
            onChange={setTags}
            placeholder="Add a tag and press Enter"
            invalid={Boolean(tagsError)}
          />
        </CardContent>
        <CardFooter>
          <Button type="submit">
            {submitLabel ?? (mode === "create" ? "Create event" : "Save changes")}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
