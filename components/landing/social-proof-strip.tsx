export function SocialProofStrip() {
  const stats: ReadonlyArray<{ value: string; label: string }> = [
    { value: "3 roles", label: "Students · Clubs · Corporates" },
    { value: "0–100", label: "Transparent compatibility score" },
    { value: "🇧🇩", label: "Built for Bangladesh first" },
    { value: "Email + Google", label: "Two ways to sign in" },
  ] as const;

  return (
    <section
      aria-label="At a glance"
      className="border-y border-border/60 bg-muted/30"
      data-testid="social-proof"
    >
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px overflow-hidden bg-border/60 sm:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col gap-1 bg-background px-6 py-5"
          >
            <span className="text-foreground text-2xl font-semibold tracking-tight">
              {stat.value}
            </span>
            <span className="text-muted-foreground text-xs">{stat.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default SocialProofStrip;