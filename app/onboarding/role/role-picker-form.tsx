"use client";

import * as React from "react";
import { useTransition } from "react";
import { GraduationCap, Landmark, Building2, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { selectRole } from "@/app/onboarding/role/actions";

interface RoleOption {
  id: "student" | "club" | "corporate";
  title: string;
  shortLabel: string;
  icon: React.ReactNode;
  description: string;
  bullets: readonly string[];
}

const OPTIONS: readonly RoleOption[] = [
  {
    id: "student",
    title: "Student or alumni",
    shortLabel: "Student",
    icon: <GraduationCap aria-hidden="true" className="size-5" />,
    description:
      "You're looking for internships, graduate roles, or research positions aligned with what you've studied.",
    bullets: [
      "Show up in company shortlists",
      "Draft applications tailored to each role",
    ],
  },
  {
    id: "club",
    title: "Student club",
    shortLabel: "Club",
    icon: <Landmark aria-hidden="true" className="size-5" />,
    description:
      "You run or help run a university club. You're looking for sponsors and partners aligned with your events.",
    bullets: [
      "Reach sponsors who care about your event focus",
      "Track interest signals across your shortlist",
    ],
  },
  {
    id: "corporate",
    title: "Company",
    shortLabel: "Company",
    icon: <Building2 aria-hidden="true" className="size-5" />,
    description:
      "You hire or sponsor. You're looking for candidates and clubs whose profile matches what your team needs.",
    bullets: [
      "Browse ranked candidates and clubs",
      "Express interest with one click",
    ],
  },
];

export function RolePickerForm() {
  const [selected, setSelected] = React.useState<RoleOption["id"] | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = React.useState<string | null>(null);

  function submit() {
    if (!selected) return;
    setError(null);
    const fd = new FormData();
    fd.set("role", selected);
    startTransition(async () => {
      try {
        await selectRole(fd);
        // Server action redirects on success — this branch is only for
        // truly unexpected errors.
      } catch (e) {
        console.error("[role-picker] failed", e);
        setError("Couldn't save your choice. Please try again.");
      }
    });
  }

  return (
    <div className="grid gap-6">
      <div
        role="radiogroup"
        aria-label="Choose your account type"
        className="grid gap-4 md:grid-cols-3"
      >
        {OPTIONS.map((opt) => {
          const isActive = selected === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={isActive}
              data-testid={`role-option-${opt.id}`}
              onClick={() => setSelected(opt.id)}
              className={cn(
                "group/role text-left transition-all",
                "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
              )}
            >
              <Card
                className={cn(
                  "h-full cursor-pointer border-border/60 transition-all hover:-translate-y-0.5 hover:shadow-md",
                  isActive && "border-primary ring-2 ring-primary/30",
                )}
              >
                <CardHeader>
                  <span
                    aria-hidden="true"
                    className={cn(
                      "grid size-10 place-items-center rounded-xl transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "bg-primary/10 text-primary",
                    )}
                  >
                    {opt.icon}
                  </span>
                  <CardTitle>
                    <h3 className="text-lg font-medium">{opt.title}</h3>
                  </CardTitle>
                  <CardDescription className="leading-relaxed">
                    {opt.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="text-muted-foreground space-y-1.5 text-sm">
                    {opt.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-2">
                        <span className="bg-primary mt-1.5 size-1.5 shrink-0 rounded-full" />
                        {b}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-border/60 pt-5">
        <p className="text-muted-foreground text-xs">
          You can change this later from your profile.
        </p>
        <Button
          type="button"
          onClick={submit}
          disabled={!selected || isPending}
          className="group/btn"
        >
          {isPending ? "Saving…" : "Continue"}
          <ArrowRight
            aria-hidden="true"
            className="size-4 transition-transform group-hover/btn:translate-x-0.5"
          />
        </Button>
      </div>

      {error ? (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export default RolePickerForm;