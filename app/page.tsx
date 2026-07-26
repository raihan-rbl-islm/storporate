import Link from "next/link";

export default function Home() {
  return (
    <main className="bg-background text-foreground min-h-screen flex items-center justify-center px-6">
      <div className="max-w-xl text-center space-y-6">
        <h1 className="text-5xl font-semibold tracking-tight">Storporate</h1>
        <p className="text-muted-foreground text-lg">
          The UI design foundation is in place. Tokens, typography, and the
          motion-safe utilities are wired up and ready for product pages.
        </p>
        <p className="text-sm">
          <Link
            href="/dev/ui"
            className="text-primary underline-offset-4 hover:underline"
          >
            View the design system reference
          </Link>
        </p>
      </div>
    </main>
  );
}
