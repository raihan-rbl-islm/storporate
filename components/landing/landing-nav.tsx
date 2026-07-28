import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/server/auth/current-user";
import { cn } from "@/lib/utils";

interface NavLink {
  label: string;
  href: string;
}

const NAV_LINKS: readonly NavLink[] = [
  { label: "How it works", href: "#how-it-works" },
  { label: "For students", href: "#students" },
  { label: "For clubs", href: "#clubs" },
  { label: "For companies", href: "#companies" },
  { label: "Quick tour", href: "#tour" },
] as const;

export async function LandingNav() {
  const u = await getCurrentUser();

  // Authenticated users see a "Continue to dashboard" CTA instead of
  // the sign-up/sign-in pair.
  const authed = u.kind !== "anonymous";

  return (
    <header
      className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-md"
      data-testid="landing-nav"
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-6">
        <Link
          href="/"
          aria-label="Storporate home"
          className="flex items-center gap-2 font-semibold tracking-tight"
        >
          <span
            aria-hidden="true"
            className="grid size-7 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm"
          >
            <span className="text-xs font-bold">S</span>
          </span>
          <span className="text-base">Storporate</span>
        </Link>

        <nav
          aria-label="Primary"
          className="hidden items-center gap-1 md:flex"
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "text-muted-foreground hover:text-foreground",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {authed ? (
            <Link
              href="/dashboard"
              className={buttonVariants({ variant: "default", size: "sm" })}
            >
              Continue to dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/signin"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  "hidden sm:inline-flex",
                )}
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className={buttonVariants({ variant: "default", size: "sm" })}
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default LandingNav;