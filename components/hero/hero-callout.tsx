import Link from "next/link";
import { Sparkles } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export interface HeroCalloutProps {
  personaName: string;
  topMatch: {
    corporateId: string;
    corporateName: string;
    role: string;
    scorePercent: number;
  };
}

export function HeroCallout({ personaName, topMatch }: HeroCalloutProps) {
  return (
    <Card data-testid="hero-callout" className="border-primary/30">
      <CardHeader>
        <CardTitle>
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Sparkles aria-hidden="true" className="text-primary size-4" />
            Demo hero scenario
          </h2>
        </CardTitle>
        <CardDescription>
          {personaName}&apos;s prepared Demo path to{" "}
          <strong>{topMatch.corporateName}</strong>.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-3 pt-0">
        <div>
          <p className="text-base font-medium">
            {topMatch.corporateName} · {topMatch.role}
          </p>
          <p className="text-muted-foreground text-sm">
            {topMatch.scorePercent}% match
          </p>
        </div>
        <Link
          href={`/dashboard/matches/${topMatch.corporateId}`}
          className={buttonVariants({ variant: "default", size: "sm" })}
          prefetch={false}
        >
          View rationale
        </Link>
      </CardContent>
    </Card>
  );
}
