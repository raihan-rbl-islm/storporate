import Link from "next/link";

interface FooterColumn {
  heading: string;
  links: ReadonlyArray<{ label: string; href: string }>;
}

const COLUMNS: readonly FooterColumn[] = [
  {
    heading: "Product",
    links: [
      { label: "How it works", href: "#how-it-works" },
      { label: "Quick tour", href: "#tour" },
      { label: "For students", href: "#students" },
      { label: "For clubs", href: "#clubs" },
      { label: "For companies", href: "#companies" },
    ],
  },
  {
    heading: "Account",
    links: [
      { label: "Sign up", href: "#auth" },
      { label: "Sign in", href: "#auth" },
      { label: "Try the demo", href: "/demo" },
      { label: "Continue with Google", href: "/demo/google" },
    ],
  },
  {
    heading: "About",
    links: [
      { label: "Mission", href: "#" },
      { label: "Methodology", href: "#" },
      { label: "Press", href: "#" },
      { label: "Contact", href: "#" },
    ],
  },
] as const;

export function LandingFooter() {
  return (
    <footer
      className="border-t border-border/60 bg-muted/30"
      data-testid="landing-footer"
    >
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 sm:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="space-y-4">
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold tracking-tight"
          >
            <span
              aria-hidden="true"
              className="grid size-7 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm"
            >
              <span className="text-xs font-bold">S</span>
            </span>
            <span>Storporate</span>
          </Link>
          <p className="text-muted-foreground max-w-xs text-sm leading-relaxed">
            Bangladesh-first marketplace connecting students, university clubs,
            and companies through transparent compatibility scoring.
          </p>
        </div>

        {COLUMNS.map((col) => (
          <div key={col.heading}>
            <h3 className="text-foreground text-xs font-semibold uppercase tracking-wider">
              {col.heading}
            </h3>
            <ul className="text-muted-foreground mt-4 space-y-2.5 text-sm">
              {col.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-border/60">
        <div className="text-muted-foreground mx-auto flex max-w-6xl flex-col items-start justify-between gap-2 px-6 py-5 text-xs sm:flex-row sm:items-center">
          <p>
            © {new Date().getFullYear()} Storporate. Built for Bangladesh.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default LandingFooter;