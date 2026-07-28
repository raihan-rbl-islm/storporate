import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

import { HeroFlourish } from "@/components/landing/hero-flourish";
import { MatchingOrbit } from "@/components/landing/matching-orbit";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function LandingHero() {
  return (
    <section
      aria-labelledby="hero-heading"
      className="relative overflow-hidden"
      data-testid="landing-hero"
    >
      <HeroFlourish />

      <div className="mx-auto grid max-w-6xl gap-12 px-6 pt-16 pb-20 sm:pt-24 sm:pb-28 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:pt-28 lg:pb-32">
        {/* Copy column */}
        <div className="flex flex-col items-start gap-6">
          <Badge variant="outline" className="gap-1.5 border-primary/30 bg-primary/5 text-foreground">
            <Sparkles aria-hidden="true" className="size-3 text-primary" />
            AI-Powered Smart Matching · Unified 3-Way Ecosystem
          </Badge>

          <h1
            id="hero-heading"
            className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl"
          >
            Where{" "}
            <span className="bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent">
              students, clubs,
            </span>{" "}
            and{" "}
            <span className="bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent">
              companies
            </span>{" "}
            find each other.
          </h1>

          <p className="text-muted-foreground max-w-xl text-lg leading-relaxed">
            Storporate bridges the academic-industry gap. An intelligent, AI-driven networking ecosystem that uses semantic embeddings to dynamically calculate compatibility metrics for hiring, sponsorships, and strategic collaborations.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:gap-3">
            <Link
              href="/signup"
              className={cn(
                buttonVariants({ variant: "default", size: "lg" }),
                "group/cta px-5",
              )}
            >
              Get started for free
              <ArrowRight
                aria-hidden="true"
                className="size-4 transition-transform group-hover/cta:translate-x-0.5"
              />
            </Link>
          </div>

          <ul className="text-muted-foreground mt-2 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
            <li className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-primary" />
              Verified Institutional Identities
            </li>
            <li className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-accent" />
              Visibility with Privacy Control
            </li>
            <li className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-primary" />
              Data-Driven Insights
            </li>
          </ul>
        </div>

        {/* Visual column */}
        <div className="relative flex items-center justify-center">
          <MatchingOrbit />
        </div>
      </div>
    </section>
  );
}

export default LandingHero;