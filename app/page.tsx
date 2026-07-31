import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingHero } from "@/components/landing/landing-hero";
import { LandingNav } from "@/components/landing/landing-nav";
import { RolePillars } from "@/components/landing/role-pillars";

export default async function Home() {
  const nav = await LandingNav();
  return (
    <>
      {nav}
      <main className="bg-background text-foreground">
        <LandingHero />
        <RolePillars />
      </main>
      <LandingFooter />
    </>
  );
}