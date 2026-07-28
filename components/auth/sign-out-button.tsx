"use client";

import { LogOut } from "lucide-react";
import { useTransition } from "react";

import { signOut } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const [isPending, startTransition] = useTransition();
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          try {
            await signOut();
          } catch (e) {
            console.error("[sign-out] failed", e);
          }
        })
      }
      aria-label="Sign out"
    >
      <LogOut aria-hidden="true" className="size-4" />
      <span className="hidden sm:inline">
        {isPending ? "Signing out…" : "Sign out"}
      </span>
    </Button>
  );
}

export default SignOutButton;