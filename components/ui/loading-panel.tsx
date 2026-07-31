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
      className={cn("flex flex-col gap-4", className)}
      data-testid="loading-panel"
    >
      <span className="sr-only">{label}</span>
      <div
        className="rounded-xl border border-border bg-card p-6 shadow-sm"
        aria-hidden="true"
      >
        <div className="flex flex-col gap-3">
          {/* Title skeleton */}
          <div className="h-5 w-2/5 rounded-lg bg-muted motion-safe:animate-pulse" />
          {/* Content skeletons */}
          {Array.from({ length: rows }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-4 rounded-lg bg-muted motion-safe:animate-pulse",
                i === 0 ? "w-full" : i === rows - 1 ? "w-1/3" : "w-3/4",
              )}
              style={{ animationDelay: `${i * 100}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
