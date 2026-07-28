import { DemoTour } from "@/components/landing/demo-tour";
import { HowItWorks } from "@/components/landing/how-it-works";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingHero } from "@/components/landing/landing-hero";
import { LandingNav } from "@/components/landing/landing-nav";
import { RolePillars } from "@/components/landing/role-pillars";
import { ScenarioPlayground } from "@/components/landing/scenario-playground";
import { SocialProofStrip } from "@/components/landing/social-proof-strip";

export default async function Home() {
  const nav = await LandingNav();
  return (
    <>
      {nav}
      <main className="bg-background text-foreground">
        <LandingHero />
        <SocialProofStrip />
        <HowItWorks />
        <RolePillars />
        <ScenarioPlayground />
        <DemoTour />
      </main>
      <LandingFooter />
    </>
  );
}