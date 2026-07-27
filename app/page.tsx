import { HeroFlourish } from "@/components/landing/hero-flourish";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* HERO */}
      <section
        aria-labelledby="hero-heading"
        className="relative overflow-hidden"
      >
        <HeroFlourish />
        <div className="mx-auto flex max-w-3xl flex-col items-start gap-6 px-6 py-24 sm:py-32">
          <h1
            id="hero-heading"
            className="text-5xl font-semibold tracking-tight sm:text-6xl"
          >
            Storporate
          </h1>
          <p className="text-muted-foreground text-lg">
            Connect Bangladesh&apos;s students, clubs, and companies.
          </p>
          <p className="text-muted-foreground max-w-2xl text-base leading-relaxed">
            A guided marketplace where students find roles, university clubs
            find sponsors, and companies find talent — all sorted by
            compatibility scores you can trust as guidance, not a guarantee.
          </p>
        </div>
      </section>

      {/* VALUE PROPS */}
      <section
        aria-labelledby="roles-heading"
        className="mx-auto max-w-6xl px-6 py-16 sm:py-24"
      >
        <h2
          id="roles-heading"
          className="mb-8 text-2xl font-semibold tracking-tight sm:text-3xl"
        >
          Who Storporate is for
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>
                <h3 className="text-lg font-medium">Students</h3>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Find internships and graduate roles at companies whose hiring
                priorities match your skills, interests, and graduation
                timeline. Or try prepared personas without signing up.
              </CardDescription>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>
                <h3 className="text-lg font-medium">University clubs</h3>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Reach companies whose sponsorship priorities match your event
                type, scale, and impact area. Or try a prepared club persona
                without signing up.
              </CardDescription>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>
                <h3 className="text-lg font-medium">Companies</h3>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Discover students and clubs whose skills, interests, and
                contexts align with your hiring and sponsorship goals. Or browse
                a prepared corporate perspective without signing up.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* TRUST COPY */}
      <section
        aria-labelledby="trust-heading"
        className="mx-auto max-w-3xl px-6 py-16 sm:py-24"
      >
        <h2
          id="trust-heading"
          className="mb-4 text-2xl font-semibold tracking-tight sm:text-3xl"
        >
          How compatibility works
        </h2>
        <p className="text-muted-foreground text-base leading-relaxed">
          Storporate surfaces a 0–100 compatibility score for each opportunity.
          The score is guidance to focus your attention — it is not a guarantee
          of selection, employment, or sponsorship. Institutional verification
          and application approval are separate, deliberate steps handled by the
          participating organizations.
        </p>
      </section>
    </main>
  );
}
