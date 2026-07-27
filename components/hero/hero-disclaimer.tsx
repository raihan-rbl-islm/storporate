interface HeroDisclaimerProps {
  personaName: string;
  corporateName: string;
}

/**
 * Disclaimer shown on the hero rationale page (Tasnim → bKash).
 * Explicitly states this is a prepared Demo scenario, NOT an audited
 * employment outcome or an endorsement by the named organization.
 */
export function HeroDisclaimer({
  personaName,
  corporateName,
}: HeroDisclaimerProps) {
  return (
    <aside
      aria-labelledby="hero-disclaimer-heading"
      className="rounded-md border border-primary/30 bg-primary/5 p-4 text-sm"
      data-testid="hero-disclaimer"
    >
      <h3
        id="hero-disclaimer-heading"
        className="font-semibold"
      >
        Prepared Demo scenario
      </h3>
      <p>
        {personaName} and {corporateName} are referenced as Demo placeholders.
        The match percentage is produced by the same scoring engine used for
        every persona; it is not an audited employment outcome.
      </p>
    </aside>
  );
}