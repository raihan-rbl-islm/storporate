import { Database, FileText, BrainCircuit, Activity, Target, MessageSquare } from "lucide-react";


const PIPELINE_STEPS = [
  {
    icon: Database,
    label: "Data Ingestion",
    description: "Profiles & Posts",
  },
  {
    icon: FileText,
    label: "Text Understanding",
    description: "Context Extraction",
  },
  {
    icon: BrainCircuit,
    label: "Embedding Generation",
    description: "Gemini 768-dim",
  },
  {
    icon: Activity,
    label: "Similarity Comparison",
    description: "Cosine + Hybrid Score",
  },
  {
    icon: Target,
    label: "Relevance Ranking",
    description: "0-100 Match Score",
  },
  {
    icon: MessageSquare,
    label: "Results Delivered",
    description: "Personalized Feed",
  },
] as const;

export function MatchingBrainSection() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20 sm:py-28 relative">
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      
      <div className="mx-auto max-w-2xl text-center mb-20">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm text-primary mb-6">
          <BrainCircuit className="size-4" />
          <span>The Matching Brain</span>
        </div>
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Behind the Scenes: AI Matching Engine
        </h2>
        <p className="mt-4 text-muted-foreground text-base leading-relaxed">
          How we transform unstructured data into precise, actionable connections using Google&apos;s Gemini embedding models and hybrid scoring algorithms.
        </p>
      </div>

      <div className="relative mt-16 max-w-5xl mx-auto">
        {/* Decorative connecting line for desktop */}
        <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent -translate-y-1/2 overflow-hidden">
          <div className="h-full w-1/3 bg-gradient-to-r from-transparent via-primary to-transparent animate-[shimmer_2s_infinite]"></div>
        </div>

        <div className="grid gap-8 md:grid-cols-6 relative z-10">
          {PIPELINE_STEPS.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div key={step.label} className="flex flex-row md:flex-col items-center gap-4 group">
                {/* Mobile connector line */}
                {idx !== 0 && (
                  <div className="md:hidden w-0.5 h-8 bg-border absolute -top-8 left-6"></div>
                )}
                
                <div className="relative">
                  <div className="absolute -inset-2 rounded-full bg-primary/20 opacity-0 blur-md transition-opacity duration-500 group-hover:opacity-100"></div>
                  <div className="grid size-12 place-items-center rounded-xl border border-border bg-background shadow-sm transition-transform duration-300 group-hover:scale-110 relative z-10 group-hover:border-primary/50 group-hover:text-primary">
                    <Icon className="size-5" />
                  </div>
                </div>

                <div className="md:text-center">
                  <h4 className="text-sm font-semibold text-foreground whitespace-nowrap">
                    {step.label}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-20 rounded-2xl border border-border bg-card/50 backdrop-blur-sm p-8 text-center max-w-3xl mx-auto shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">
            Our pipeline continuously learns and improves with every interaction, ensuring the most relevant students, clubs, and companies find each other instantly.
          </p>
        </div>
      </div>
    </section>
  );
}
