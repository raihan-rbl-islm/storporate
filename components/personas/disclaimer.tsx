import { FIXTURE_DISCLAIMER } from "@/data/personas";

interface DisclaimerProps {
  className?: string;
}

/**
 * Server Component that renders the verbatim FIXTURE_DISCLAIMER string.
 * Use on every page that displays a real-org persona (landing, demo,
 * dashboard layout, dashboard page).
 */
export function Disclaimer({ className }: DisclaimerProps) {
  return (
    <p
      className={
        "text-muted-foreground text-xs leading-relaxed " + (className ?? "")
      }
      data-testid="fixture-disclaimer"
    >
      {FIXTURE_DISCLAIMER}
    </p>
  );
}