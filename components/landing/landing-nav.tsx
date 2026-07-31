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
] as const;

export async function LandingNav() {
  const u = await getCurrentUser();
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
          className="group flex items-center tracking-tighter select-none"
        >
          <span className="text-xl font-bold text-primary">Stor</span>
          <span className="text-xl font-medium text-accent transition-colors duration-300 group-hover:text-primary">porate</span>
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