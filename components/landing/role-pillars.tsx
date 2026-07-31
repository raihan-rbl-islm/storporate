"use client";

import { useState } from "react";
import { GraduationCap, Landmark, Building2, BrainCircuit, Search, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

type Role = "students" | "clubs" | "companies";

const ROLES = [
  { id: "students", label: "For Students", icon: GraduationCap },
  { id: "clubs", label: "For Clubs", icon: Landmark },
  { id: "companies", label: "For Companies", icon: Building2 },
] as const;

const BENTO_CONTENT = {
  students: {
    pitch: "Stop throwing resumes into the void. Get matched with companies whose hiring priorities align with your skills and graduation timeline.",
    features: [
      { title: "Semantic Matching", desc: "Our AI understands your coursework and projects to find hidden-gem roles.", icon: BrainCircuit, colSpan: "md:col-span-2" },
      { title: "Smart Inbox", desc: "Manage outreach and applications securely.", icon: ShieldCheck, colSpan: "md:col-span-1" },
    ]
  },
  clubs: {
    pitch: "Fund your next major event. Reach companies whose CSR and sponsorship priorities match your event scale and impact area.",
    features: [
      { title: "Sponsor Discovery", desc: "Search sponsors by budget range and exact collaboration intent.", icon: Search, colSpan: "md:col-span-1" },
      { title: "Pitch Securely", desc: "Send tailored sponsorship proposals directly to decision makers.", icon: ShieldCheck, colSpan: "md:col-span-2" },
    ]
  },
  companies: {
    pitch: "Discover students and clubs whose skills, interests, and contexts perfectly align with your hiring and CSR goals.",
    features: [
      { title: "Precision Sourcing", desc: "Vector search across thousands of student portfolios.", icon: BrainCircuit, colSpan: "md:col-span-2" },
      { title: "Brand Presence", desc: "Post jobs, events, and company news.", icon: Building2, colSpan: "md:col-span-1" },
    ]
  }
};

export function RolePillars() {
  const [activeRole, setActiveRole] = useState<Role>("students");

  const content = BENTO_CONTENT[activeRole];

  return (
    <section
      aria-labelledby="pillars-heading"
      className="mx-auto max-w-6xl px-6 py-24 sm:py-32"
      data-testid="role-pillars"
    >
      <div className="flex flex-col items-center mb-16">
        <h2 id="pillars-heading" className="text-3xl font-bold tracking-tighter sm:text-5xl mb-8">
          A Surface Tuned to You
        </h2>
        
        <div className="flex p-1.5 bg-muted/50 rounded-full border border-border/50 backdrop-blur-sm shadow-inner">
          {ROLES.map((role) => {
            const Icon = role.icon;
            const isActive = activeRole === role.id;
            return (
              <button
                key={role.id}
                onClick={() => setActiveRole(role.id as Role)}
                className={cn(
                  "flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold transition-all duration-300",
                  isActive 
                    ? "bg-background text-foreground shadow-sm ring-1 ring-border" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <Icon className={cn("size-4", isActive ? "text-primary" : "")} />
                {role.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3 auto-rows-[200px]" data-testid="how-it-works">
        {/* Large Pitch Box */}
        <div className="md:col-span-3 lg:col-span-2 row-span-2 bg-card border border-border/60 rounded-3xl p-10 flex flex-col justify-between shadow-sm">
          <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6">
            {ROLES.find(r => r.id === activeRole)?.icon && (() => {
              const Icon = ROLES.find(r => r.id === activeRole)!.icon;
              return <Icon className="size-6" />;
            })()}
          </div>
          <div>
            <h3 className="text-3xl font-bold tracking-tight mb-4">
              {ROLES.find(r => r.id === activeRole)?.label}
            </h3>
            <p className="text-muted-foreground text-lg leading-relaxed max-w-lg">
              {content.pitch}
            </p>
          </div>
        </div>

        {/* Dynamic Feature Boxes */}
        {content.features.map((feature) => {
          const Icon = feature.icon;
          return (
            <div 
              key={feature.title}
              className={cn(
                "bg-card border border-border/60 rounded-3xl p-8 shadow-sm flex flex-col justify-between group hover:border-primary/40 transition-colors",
                feature.colSpan,
                "lg:col-span-1 row-span-1 lg:row-span-2" // override for lg layout
              )}
            >
              <Icon className="size-8 text-accent mb-4 group-hover:text-primary transition-colors" />
              <div>
                <h4 className="text-xl font-bold tracking-tight mb-2">{feature.title}</h4>
                <p className="text-muted-foreground text-sm">{feature.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default RolePillars;