import { cn } from "@/lib/utils";

export interface LoadingSpinnerProps {
  label: string;
  className?: string;
}

export function LoadingSpinner({ label, className }: LoadingSpinnerProps) {
  return (
    <span
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn("inline-flex items-center gap-2 text-sm", className)}
      data-testid="loading-spinner"
    >
      <span
        aria-hidden="true"
        className="bg-primary inline-block size-3 rounded-full motion-safe:animate-pulse"
      />
      <span>{label}</span>
    </span>
  );
}
