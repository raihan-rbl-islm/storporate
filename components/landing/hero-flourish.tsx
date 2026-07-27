import { cn } from "@/lib/utils";

interface HeroFlourishProps {
  className?: string;
}

/**
 * Pure-CSS / static-SVG hero flourish.
 *
 * Phase 1 decision: chose this over the Aceternity `background-beams` port
 * to avoid the framer-motion runtime and 'use client' boundary. The global
 * reduced-motion kill-switch in app/globals.css neutralizes the animation,
 * and the keyframes rule also declares its own media query as defense in depth.
 */
export function HeroFlourish({ className }: HeroFlourishProps) {
  return (
    <div
      data-testid="beams"
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 -z-10 overflow-hidden",
        className,
      )}
    >
      <div className="bg-primary/5 absolute inset-0" />
      <div
        className="hero-flourish-drift absolute inset-0"
        data-testid="beams-drift"
      >
        <svg
          className="h-full w-full"
          viewBox="0 0 1440 900"
          preserveAspectRatio="xMidYMid slice"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <radialGradient
              id="hero-flourish-gradient"
              cx="50%"
              cy="40%"
              r="70%"
              fx="50%"
              fy="40%"
            >
              <stop
                offset="0%"
                style={{ stopColor: "var(--primary)", stopOpacity: 0.15 }}
              />
              <stop
                offset="55%"
                style={{ stopColor: "var(--primary)", stopOpacity: 0.05 }}
              />
              <stop
                offset="100%"
                style={{ stopColor: "var(--accent)", stopOpacity: 0.1 }}
              />
            </radialGradient>
          </defs>
          <rect width="1440" height="900" fill="url(#hero-flourish-gradient)" />
        </svg>
      </div>
    </div>
  );
}

export default HeroFlourish;
