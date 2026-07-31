import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingHero } from "@/components/landing/landing-hero";
import { LandingNav } from "@/components/landing/landing-nav";
import { ScenarioPlayground } from "@/components/landing/scenario-playground";
import { DemoTour } from "@/components/landing/demo-tour";

export default async function Home() {
  const nav = await LandingNav();
  return (
    <>
      {nav}
      <main className="bg-background text-foreground">
        <LandingHero />
        <ScenarioPlayground />
        <DemoTour />
      </main>
      <LandingFooter />
    </>
  );
}