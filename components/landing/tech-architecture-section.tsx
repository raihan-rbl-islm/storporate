import { Database, Server, Lock, Layers, Zap, Activity } from "lucide-react";

const TECH_PILLARS = [
  {
    icon: Layers,
    title: "Tech Stack",
    description: "Built on Next.js 15 (App Router) and React 19, offering blazingly fast server actions and API routes. Styled with Tailwind CSS & shadcn/ui.",
  },
  {
    icon: Database,
    title: "Database Architecture",
    description: "Powered by PostgreSQL with pgvector for high-dimensional embedding storage. Handled elegantly through Drizzle ORM and Supabase Auth.",
  },
  {
    icon: Zap,
    title: "AI Matching Engine",
    description: "Google's gemini-embedding-001 generates 768-dim semantic vectors. We use hybrid scoring combining cosine similarity with skill & tag overlap.",
  },
  {
    icon: Lock,
    title: "Security & Verification",
    description: "Only verified institutional email accounts allowed. Enforced via Row Level Security (RLS) ensuring data access is strictly role-controlled.",
  },
  {
    icon: Server,
    title: "Infrastructure & Caching",
    description: "Upstash Redis handles sliding window rate limiting. Hosted seamlessly on Vercel with edge deployments and isolated environments.",
  },
  {
    icon: Activity,
    title: "Quality & Monitoring",
    description: "Real-time edge & client issue monitoring via Sentry. End-to-end testing with Playwright, Unit testing via Vitest, and strict CI/CD pipelines.",
  },
];

export function TechArchitectureSection() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
      <div className="mx-auto max-w-2xl text-center mb-16">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Technical Implementation
        </h2>
        <p className="mt-4 text-muted-foreground text-base leading-relaxed">
          An enterprise-grade stack engineered for security, speed, and AI-driven precision.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {TECH_PILLARS.map((pillar) => {
          const Icon = pillar.icon;
          return (
            <div
              key={pillar.title}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-8 transition-colors hover:border-primary/50 hover:bg-muted/50"
            >
              <div className="mb-6 inline-flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="size-5" />
              </div>
              <h3 className="mb-3 text-lg font-semibold text-foreground">
                {pillar.title}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {pillar.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
