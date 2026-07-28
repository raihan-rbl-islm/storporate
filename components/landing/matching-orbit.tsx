import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Pure-SVG + CSS animated hero visual.
 *
 * Three persona nodes (Student / Club / Corporate) drift around a central
 * compatibility score. Connection lines fade in/out as each node passes the
 * center, suggesting "matches forming".
 *
 * Phase 1 constraint: no framer-motion, no client boundary. Animation is
 * driven entirely by CSS keyframes defined in app/globals.css. The
 * prefers-reduced-motion media query in globals.css neutralizes the motion.
 */
export interface MatchingOrbitProps {
  className?: string;
}

export function MatchingOrbit({ className }: MatchingOrbitProps) {
  return (
    <div
      data-testid="matching-orbit"
      aria-hidden="true"
      className={cn(
        "relative aspect-square w-full max-w-md mx-auto",
        className,
      )}
    >
      {/* Outer halo */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/15 via-transparent to-accent/20 blur-2xl" />

      <svg
        viewBox="0 0 400 400"
        xmlns="http://www.w3.org/2000/svg"
        className="relative h-full w-full"
      >
        <defs>
          <radialGradient id="orbit-core" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.18" />
            <stop offset="60%" stopColor="var(--primary)" stopOpacity="0.04" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="orbit-line" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0" />
            <stop offset="50%" stopColor="var(--primary)" stopOpacity="0.6" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Concentric rings */}
        <circle
          cx="200"
          cy="200"
          r="190"
          fill="none"
          stroke="var(--border)"
          strokeWidth="1"
          strokeDasharray="2 6"
          opacity="0.6"
        />
        <circle
          cx="200"
          cy="200"
          r="140"
          fill="none"
          stroke="var(--border)"
          strokeWidth="1"
          strokeDasharray="2 4"
          opacity="0.5"
        />
        <circle cx="200" cy="200" r="110" fill="url(#orbit-core)" />

        {/* Animated connection lines from each orbit node toward center */}
        <g className="orbit-line-a">
          <line
            x1="200"
            y1="200"
            x2="320"
            y2="120"
            stroke="url(#orbit-line)"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </g>
        <g className="orbit-line-b">
          <line
            x1="200"
            y1="200"
            x2="100"
            y2="280"
            stroke="url(#orbit-line)"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </g>
        <g className="orbit-line-c">
          <line
            x1="200"
            y1="200"
            x2="320"
            y2="300"
            stroke="url(#orbit-line)"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </g>

        {/* Center score node */}
        <g>
          <circle
            cx="200"
            cy="200"
            r="46"
            fill="var(--background)"
            stroke="var(--primary)"
            strokeWidth="2"
          />
          <circle
            cx="200"
            cy="200"
            r="46"
            fill="none"
            stroke="var(--primary)"
            strokeWidth="2"
            className="orbit-pulse-ring"
          />
          <text
            x="200"
            y="194"
            textAnchor="middle"
            className="fill-foreground"
            style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.08em" }}
          >
            MATCH
          </text>
          <text
            x="200"
            y="216"
            textAnchor="middle"
            className="fill-primary"
            style={{ fontSize: "22px", fontWeight: 700 }}
          >
            87
          </text>
        </g>

        {/* Three orbiting persona nodes */}
        <g className="orbit-node-a">
          <foreignObject x="288" y="88" width="64" height="64">
            <div className="orbit-node-inner flex h-full w-full items-center justify-center rounded-2xl border border-primary/30 bg-card text-xs font-medium shadow-sm">
              <span className="flex flex-col items-center gap-0.5">
                <span aria-hidden="true" className="text-base">
                  🎓
                </span>
                <span className="text-[10px] leading-none">Student</span>
              </span>
            </div>
          </foreignObject>
        </g>

        <g className="orbit-node-b">
          <foreignObject x="68" y="248" width="64" height="64">
            <div className="orbit-node-inner flex h-full w-full items-center justify-center rounded-2xl border border-accent/40 bg-card text-xs font-medium shadow-sm">
              <span className="flex flex-col items-center gap-0.5">
                <span aria-hidden="true" className="text-base">
                  🏛️
                </span>
                <span className="text-[10px] leading-none">Club</span>
              </span>
            </div>
          </foreignObject>
        </g>

        <g className="orbit-node-c">
          <foreignObject x="288" y="268" width="64" height="64">
            <div className="orbit-node-inner flex h-full w-full items-center justify-center rounded-2xl border border-primary/30 bg-card text-xs font-medium shadow-sm">
              <span className="flex flex-col items-center gap-0.5">
                <span aria-hidden="true" className="text-base">
                  🏢
                </span>
                <span className="text-[10px] leading-none">Corporate</span>
              </span>
            </div>
          </foreignObject>
        </g>

        {/* Floating match chips */}
        <g className="orbit-chip-a">
          <foreignObject x="240" y="40" width="100" height="32">
            <div className="flex h-full w-full items-center justify-center rounded-full border border-primary/20 bg-card/90 px-3 text-[10px] font-medium text-foreground shadow-sm backdrop-blur">
              +1 new match
            </div>
          </foreignObject>
        </g>
        <g className="orbit-chip-b">
          <foreignObject x="20" y="160" width="100" height="32">
            <div className="flex h-full w-full items-center justify-center rounded-full border border-accent/30 bg-card/90 px-3 text-[10px] font-medium text-foreground shadow-sm backdrop-blur">
              Compatibility 92
            </div>
          </foreignObject>
        </g>
        <g className="orbit-chip-c">
          <foreignObject x="240" y="356" width="100" height="32">
            <div className="flex h-full w-full items-center justify-center rounded-full border border-primary/20 bg-card/90 px-3 text-[10px] font-medium text-foreground shadow-sm backdrop-blur">
              Draft ready
            </div>
          </foreignObject>
        </g>
      </svg>
    </div>
  );
}

export default MatchingOrbit;