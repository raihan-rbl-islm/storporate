"use client";

import * as React from "react";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  registerForEvent,
  unregisterFromEvent,
  type RegistrationFormState,
} from "@/app/events/actions";

export interface RegistrationButtonProps {
  eventId: string;
  /** True if the viewer can register (i.e. signed-in student). */
  canRegister: boolean;
  /** True if the event is at capacity (only relevant when canRegister). */
  isFull: boolean;
  /** True if the viewer is already registered. */
  isRegistered: boolean;
  /** True if the event has already passed. */
  isPast: boolean;
}

export function RegistrationButton({
  eventId,
  canRegister,
  isFull,
  isRegistered,
  isPast,
}: RegistrationButtonProps) {
  const [showMotivation, setShowMotivation] = useState(false);
  const [motivation, setMotivation] = useState("");
  const [result, setResult] = useState<RegistrationFormState>({
    status: "idle",
  });
  const [pending, startTransition] = useTransition();

  if (isPast) {
    return (
      <div className="rounded-md border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
        Event has passed.
      </div>
    );
  }

  if (!canRegister) {
    return (
      <Button
        variant="outline"
        render={
          <a
            href={`/signin?next=${encodeURIComponent(
              typeof window === "undefined" ? "" : window.location.pathname,
            )}`}
          >
            Sign in as a student to register
          </a>
        }
      />
    );
  }

  if (isRegistered) {
    return (
      <div className="flex flex-col gap-2">
        <Button
          variant="outline"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await unregisterFromEvent(eventId);
              setResult({ status: "success", message: "Registration removed." });
            })
          }
        >
          {pending ? "Removing…" : "Cancel registration"}
        </Button>
        {result.status === "success" ? (
          <p className="text-xs text-muted-foreground">{result.message}</p>
        ) : null}
      </div>
    );
  }

  if (isFull) {
    return (
      <Button variant="outline" disabled>
        Event full
      </Button>
    );
  }

  function submitRegistration(note?: string) {
    startTransition(async () => {
      const r = await registerForEvent(eventId, note);
      setResult(r);
      if (r.status === "success") {
        setShowMotivation(false);
      }
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          onClick={() => submitRegistration(motivation)}
          disabled={pending}
        >
          {pending ? "Registering…" : "Register"}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={pending}
          onClick={() => setShowMotivation((v) => !v)}
        >
          {showMotivation ? "Hide note" : "Add a note (optional)"}
        </Button>
      </div>
      {showMotivation ? (
        <div className="grid gap-2">
          <Textarea
            value={motivation}
            onChange={(e) => setMotivation(e.target.value)}
            placeholder="Why do you want to attend? (optional, max 1000 chars)"
            rows={3}
            maxLength={1000}
          />
          <p className="text-xs text-muted-foreground">
            Your note is shared with the event organizer.
          </p>
        </div>
      ) : null}
      {result.status === "error" ? (
        <p className="text-sm text-destructive">{result.formMessage}</p>
      ) : null}
      {result.status === "success" ? (
        <p className="text-sm text-emerald-700 dark:text-emerald-400">
          {result.message}
        </p>
      ) : null}
    </div>
  );
}
