import { AlertTriangle, Lightbulb, Users, Network, ShieldCheck, UserCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function ProblemSolutionSection() {
  return (
    <section className="relative mx-auto max-w-6xl px-6 py-24 sm:py-32 overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background"></div>
      
      <div className="mx-auto max-w-2xl text-center mb-16">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
          The Academic-Industry Gap
        </h2>
        <p className="mt-4 text-muted-foreground text-lg leading-relaxed">
          In Bangladesh&apos;s higher education ecosystem, a fundamental disconnect exists between academia and industry.
        </p>
      </div>

      <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-stretch">
        {/* Problem Side */}
        <div className="relative group">
          <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-destructive/20 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
          <Card className="h-full relative bg-background/50 backdrop-blur-sm border-destructive/20 overflow-hidden">
            <CardContent className="p-8 flex flex-col gap-8 h-full">
              <div className="flex items-center gap-4 border-b border-destructive/10 pb-6">
                <div className="grid size-12 place-items-center rounded-full bg-destructive/10 text-destructive">
                  <AlertTriangle className="size-6" />
                </div>
                <h3 className="text-2xl font-medium text-foreground">The Problem</h3>
              </div>
              
              <div className="space-y-6 flex-1">
                <div className="flex gap-4 items-start">
                  <div className="mt-1 shrink-0 rounded-full bg-destructive/10 p-2 text-destructive">
                    <Users className="size-4" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground text-lg">Talent Misalignment</h4>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                      Industry recruiters lack real-time visibility into evolving skills. Students struggle to find suitable opportunities, leading to underemployment and misaligned career paths.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="mt-1 shrink-0 rounded-full bg-destructive/10 p-2 text-destructive">
                    <Network className="size-4" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground text-lg">Friction in Campus Collaboration</h4>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                      Corporates lack structured data on club activities and demographics for brand engagement. Clubs face massive hurdles reaching out to aligned corporate sponsors.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Solution Side */}
        <div className="relative group">
          <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-primary/20 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
          <Card className="h-full relative bg-primary/5 backdrop-blur-sm border-primary/20 overflow-hidden">
            <CardContent className="p-8 flex flex-col gap-8 h-full">
              <div className="flex items-center gap-4 border-b border-primary/10 pb-6">
                <div className="grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
                  <Lightbulb className="size-6" />
                </div>
                <h3 className="text-2xl font-medium text-foreground">Our Innovation</h3>
              </div>
              
              <div className="space-y-6 flex-1">
                <div className="flex gap-4 items-start">
                  <div className="mt-1 shrink-0 rounded-full bg-primary/10 p-2 text-primary">
                    <Network className="size-4" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground text-lg">Unified 3-Way Ecosystem</h4>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                      Connecting Students, Clubs, and Corporates on one platform for hiring, sponsorships, and long-term partnerships driven by intelligent matching.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="mt-1 shrink-0 rounded-full bg-primary/10 p-2 text-primary">
                    <UserCheck className="size-4" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground text-lg">Verified Institutional Identities</h4>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                      Strict university email verification ensures absolute authenticity and builds inherent trust across the entire ecosystem.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="mt-1 shrink-0 rounded-full bg-primary/10 p-2 text-primary">
                    <ShieldCheck className="size-4" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground text-lg">Visibility with Privacy Control</h4>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                      Contact details and sensitive information are revealed dynamically only after a meaningful interaction is established, ensuring safe professional communication.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
