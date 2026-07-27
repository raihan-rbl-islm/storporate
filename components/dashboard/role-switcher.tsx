"use client";

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

export function RoleSwitcher({
  currentRole,
}: {
  currentRole: PersonaRole;
}) {
  async function invokeSetRole(role: PersonaRole) {
    const fd = new FormData();
    fd.set("role", role);
    await setRole(fd);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="inline-flex h-8 items-center justify-center rounded-md border border-border bg-background px-3 text-sm font-medium transition-colors hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus:outline-none"
        aria-label="Switch role"
      >
        Switch role
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {ROLES.map((r) => {
          const isActive = r === currentRole;
          return (
            <DropdownMenuItem
              key={r}
              data-active={isActive}
              onClick={() => invokeSetRole(r)}
            >
              {isActive ? "\u2713 " : ""}
              {capitalize(r)}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
