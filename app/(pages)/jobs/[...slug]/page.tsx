import { Construction } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function JobManagementPlaceholderPage() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col items-center justify-center gap-6 px-4 py-24 text-center">
      <div className="rounded-full bg-primary/10 p-6">
        <Construction className="text-primary size-12" aria-hidden="true" />
      </div>
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          Job Management is Under Construction
        </h1>
        <p className="text-muted-foreground mx-auto max-w-md text-base leading-relaxed">
          We are currently building out the detailed job management and candidate review workflow. 
          Check back soon to manage your active roles and applications!
        </p>
      </div>
      <Link
        href="/dashboard/corporate/dashboard"
        className={buttonVariants({ variant: "default" })}
      >
        Return to Dashboard
      </Link>
    </main>
  );
}
