import { cn } from "@/lib/utils";

export interface LoadingPanelProps {
  label: string;
  className?: string;
  rows?: number;
}

export function LoadingPanel({ label, className, rows = 3 }: LoadingPanelProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn("flex flex-col gap-2", className)}
      data-testid="loading-panel"
    >
      <span className="sr-only">{label}</span>
      <div
        className="bg-card ring-foreground/10 rounded-xl p-4"
        aria-hidden="true"
      >
        <div className="flex flex-col gap-2">
          {Array.from({ length: rows }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "bg-muted h-4 rounded motion-safe:animate-pulse",
                i === 0 ? "w-3/4" : i === rows - 1 ? "w-1/2" : "w-full",
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
