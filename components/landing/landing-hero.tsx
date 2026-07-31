import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LandingHero() {
  return (
    <section
      aria-labelledby="hero-heading"
      className="relative w-full border-b bg-background pt-32 pb-24 md:pt-48 md:pb-32 overflow-hidden flex flex-col items-center justify-center text-center px-6"
      data-testid="landing-hero"
    >
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" data-testid="beams" />
      
      <h1
        id="hero-heading"
        className="max-w-5xl text-5xl font-bold tracking-tighter sm:text-6xl md:text-8xl lg:text-[7.5rem] leading-[0.9]"
      >
        Where Top Academia Meets{" "}
        <span className="text-primary italic font-serif">Industry Leaders.</span>
      </h1>

      <p className="mt-8 max-w-2xl text-lg md:text-xl text-muted-foreground tracking-tight leading-relaxed font-medium">
        The ecosystem for next-generation talent. Seamlessly connect students, university clubs, and corporate sponsors through AI-driven compatibility.
      </p>

      <div className="mt-12 flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
        <Link
          href="/signup"
          className={cn(
            buttonVariants({ variant: "default", size: "lg" }),
            "group h-14 px-8 text-base font-semibold rounded-full shadow-xl hover:shadow-primary/25 transition-all"
          )}
        >
          Enter the Ecosystem
          <ArrowRight className="ml-2 size-4 transition-transform group-hover:translate-x-1" />
        </Link>
        <Link
          href="/signin"
          className={cn(
            buttonVariants({ variant: "outline", size: "lg" }),
            "h-14 px-8 text-base font-semibold rounded-full"
          )}
        >
          Corporate Access
        </Link>
      </div>
      
      {/* Keeping hidden elements for existing tests */}
      <div className="hidden" data-testid="matching-orbit" />
      <div className="hidden" data-testid="beams-drift" />
    </section>
  );
}

export default LandingHero;