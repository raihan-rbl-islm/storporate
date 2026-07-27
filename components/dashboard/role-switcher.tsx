"use client";

import { useState, useTransition } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { setRole } from "@/app/(dashboard)/dashboard/actions";
import type { PersonaRole } from "@/data/personas";

const ROLES: readonly PersonaRole[] = ["student", "club", "corporate"];

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function RoleSwitcher({ currentRole }: { currentRole: PersonaRole }) {
  const [isPending, startTransition] = useTransition();
  // Keep the last attempted role so we can show a focused, contextual
  // error message ("Couldn't switch to Club — try again") without a
  // toast dependency.
  const [errorFor, setErrorFor] = useState<PersonaRole | null>(null);
  const [open, setOpen] = useState(false);

  function invokeSetRole(role: PersonaRole) {
    setErrorFor(null);
    const fd = new FormData();
    fd.set("role", role);
    startTransition(async () => {
      try {
        await setRole(fd);
        setOpen(false);
      } catch (err) {
        // The Server Action itself only throws on the network/programmer
        // path; the cookie is set before revalidatePath, so this branch
        // is reached only on truly unexpected failures. Surface the
        // error inline rather than swallowing.
        console.error("[role-switcher] setRole failed", err);
        setErrorFor(role);
      }
    });
  }

  const errorMessage =
    errorFor !== null
      ? `Couldn't switch to ${capitalize(errorFor)}. Try again.`
      : null;

  return (
    <div className="flex flex-col items-end gap-1">
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger
          className="inline-flex h-8 items-center justify-center rounded-md border border-border bg-background px-3 text-sm font-medium transition-colors hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
          aria-label="Switch role"
          aria-busy={isPending}
          disabled={isPending}
        >
          {isPending ? "Switching…" : "Switch role"}
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {ROLES.map((r) => {
            const isActive = r === currentRole;
            return (
              <DropdownMenuItem
                key={r}
                data-active={isActive}
                onClick={() => invokeSetRole(r)}
                disabled={isPending}
                aria-label={`Switch to ${capitalize(r)}`}
              >
                {isActive ? "\u2713 " : ""}
                {capitalize(r)}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
      {/* Live region so the error is announced by screen readers without
          stealing focus. We use role="status" (polite) — never
          role="alert", which can interrupt the user. */}
      <span
        role="status"
        aria-live="polite"
        className={
          errorMessage
            ? "text-destructive text-xs"
            : "sr-only"
        }
        data-testid="role-switcher-status"
      >
        {errorMessage ?? ""}
      </span>
    </div>
  );
}