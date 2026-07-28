import { HowItWorks } from "@/components/landing/how-it-works";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingHero } from "@/components/landing/landing-hero";
import { LandingNav } from "@/components/landing/landing-nav";
import { RolePillars } from "@/components/landing/role-pillars";
import { ProblemSolutionSection } from "@/components/landing/problem-solution-section";
import { MatchingBrainSection } from "@/components/landing/matching-brain-section";
import { TechArchitectureSection } from "@/components/landing/tech-architecture-section";

export default async function Home() {
  const nav = await LandingNav();
  return (
    <>
      {nav}
      <main className="bg-background text-foreground">
        <LandingHero />
        <ProblemSolutionSection />
        <HowItWorks />
        <RolePillars />
        <MatchingBrainSection />
        <TechArchitectureSection />
      </main>
      <LandingFooter />
    </>
  );
}