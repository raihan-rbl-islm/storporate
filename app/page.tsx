import { HeroFlourish } from "@/components/landing/hero-flourish";

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section
        aria-labelledby="hero-heading"
        className="relative overflow-hidden"
      >
        <HeroFlourish />
        <h1 id="hero-heading" className="text-5xl font-semibold tracking-tight">
          Storporate
        </h1>
      </section>
    </main>
  );
}
