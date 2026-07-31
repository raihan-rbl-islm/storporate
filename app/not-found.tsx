import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-6 py-24 text-center">
      <div className="flex flex-col items-center gap-4">
        <div className="grid size-16 place-items-center rounded-2xl bg-primary/10 text-primary">
          <FileQuestion className="size-8" aria-hidden="true" />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Page not found
        </h1>
        <p className="text-muted-foreground max-w-md text-base leading-relaxed">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
          Let&apos;s get you back on track.
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link href="/" className={buttonVariants({ variant: "default" })}>
          Go to homepage
        </Link>
        <Link
          href="/dashboard"
          className={buttonVariants({ variant: "outline" })}
        >
          Go to dashboard
        </Link>
      </div>
    </main>
  );
}
