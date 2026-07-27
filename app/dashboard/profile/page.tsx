import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Disclaimer } from "@/components/personas/disclaimer";
import { getCurrentPersona, hasOnboarded } from "@/lib/server/personas/current";
import type {
  students as StudentsTable,
  clubs as ClubsTable,
  corporates as CorporatesTable,
} from "@/lib/server/db/schema";

type StudentRowShape = typeof StudentsTable.$inferSelect;
type ClubRowShape = typeof ClubsTable.$inferSelect;
type CorporateRowShape = typeof CorporatesTable.$inferSelect;

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const current = await getCurrentPersona();
  if (!current) redirect("/demo");
  if (!hasOnboarded(current.row)) {
    redirect("/onboarding");
  }
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Your profile</h1>
        <Button
          variant="outline"
          render={
            <Link href="/dashboard/profile/edit" prefetch={false}>
              Edit match-relevant details
            </Link>
          }
        />
      </header>
      {current.row.fixtureDisclaimerRequired ? <Disclaimer /> : null}
      {current.kind === "student" ? <StudentReview row={current.row} /> : null}
      {current.kind === "club" ? <ClubReview row={current.row} /> : null}
      {current.kind === "corporate" ? (
        <CorporateReview row={current.row} />
      ) : null}
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-6">
      <h2 className="mb-2 text-lg font-medium">{title}</h2>
      <Separator className="mb-4" />
      {children}
    </section>
  );
}

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-3 gap-2 py-1.5">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="col-span-2 text-sm">
        {value || <em className="text-muted-foreground">Not provided</em>}
      </dd>
    </div>
  );
}

function Chips({
  values,
  emptyLabel,
}: {
  values: string[];
  emptyLabel: string;
}) {
  if (values.length === 0) {
    return <em className="text-sm text-muted-foreground">{emptyLabel}</em>;
  }
  return (
    <ul className="flex flex-wrap gap-1.5">
      {values.map((v, i) => (
        <li key={`${v}-${i}`}>
          <Badge variant="secondary">{v}</Badge>
        </li>
      ))}
    </ul>
  );
}

function StudentReview({ row }: { row: StudentRowShape }) {
  return (
    <>
      <Section title="Identity">
        <Card>
          <CardContent className="pt-6">
            <FieldRow label="Full name" value={row.fullName} />
            <FieldRow label="University" value={row.university} />
            <FieldRow label="Study program" value={row.studyProgram} />
            <FieldRow
              label="Expected graduation"
              value={row.expectedGraduation}
            />
            <FieldRow label="Bio" value={row.bio} />
          </CardContent>
        </Card>
      </Section>
      <Section title="Match-relevant">
        <Card>
          <CardContent className="grid gap-4 pt-6">
            <FieldRow label="Location" value={row.location} />
            <div>
              <p className="mb-1 text-sm text-muted-foreground">Skills</p>
              <Chips values={row.skills} emptyLabel="No skills listed" />
            </div>
            <div>
              <p className="mb-1 text-sm text-muted-foreground">
                Career interests
              </p>
              <Chips
                values={row.careerInterests}
                emptyLabel="No interests listed"
              />
            </div>
          </CardContent>
        </Card>
      </Section>
    </>
  );
}

function ClubReview({ row }: { row: ClubRowShape }) {
  return (
    <>
      <Section title="Identity">
        <Card>
          <CardContent className="pt-6">
            <FieldRow label="Club name" value={row.clubName} />
            <FieldRow label="University" value={row.university} />
            <FieldRow label="Mission" value={row.mission} />
            <FieldRow label="Contact role" value={row.contactRole} />
            <FieldRow
              label="Audience or member reach (self-reported)"
              value={row.audienceReachLabel}
            />
          </CardContent>
        </Card>
      </Section>
      <Section title="Match-relevant">
        <Card>
          <CardContent className="grid gap-4 pt-6">
            <FieldRow label="Location" value={row.location} />
            <div>
              <p className="mb-1 text-sm text-muted-foreground">Categories</p>
              <Chips values={row.categories} emptyLabel="No categories" />
            </div>
            <div>
              <p className="mb-1 text-sm text-muted-foreground">Event focus</p>
              <Chips values={row.eventFocus} emptyLabel="No event focus" />
            </div>
            <div>
              <p className="mb-1 text-sm text-muted-foreground">
                Sponsorship needs
              </p>
              <Chips
                values={row.sponsorshipNeeds}
                emptyLabel="No sponsorship needs"
              />
            </div>
          </CardContent>
        </Card>
      </Section>
    </>
  );
}

function CorporateReview({ row }: { row: CorporateRowShape }) {
  return (
    <>
      <Section title="Identity">
        <Card>
          <CardContent className="pt-6">
            <FieldRow label="Organization" value={row.organizationName} />
            <FieldRow label="Industry" value={row.industry} />
            <FieldRow label="Description" value={row.description} />
            <div className="grid grid-cols-3 gap-2 py-1.5">
              <dt className="text-sm text-muted-foreground">
                Collaboration intent
              </dt>
              <dd className="col-span-2 text-sm">
                <Badge variant="outline">{row.collaborationIntent}</Badge>
              </dd>
            </div>
          </CardContent>
        </Card>
      </Section>
      <Section title="Match-relevant">
        <Card>
          <CardContent className="grid gap-4 pt-6">
            <FieldRow label="Location" value={row.location} />
            <div>
              <p className="mb-1 text-sm text-muted-foreground">
                Talent needs
              </p>
              <Chips values={row.talentNeeds} emptyLabel="No talent needs" />
            </div>
            <div>
              <p className="mb-1 text-sm text-muted-foreground">
                Sponsorship interests
              </p>
              <Chips
                values={row.sponsorshipInterests}
                emptyLabel="No sponsorship interests"
              />
            </div>
            <div>
              <p className="mb-1 text-sm text-muted-foreground">CSR focus</p>
              <Chips values={row.csrFocus} emptyLabel="No CSR focus areas" />
            </div>
            <FieldRow
              label="Budget range (illustrative)"
              value={row.budgetRange === "Undisclosed" ? "" : row.budgetRange}
            />
          </CardContent>
        </Card>
      </Section>
    </>
  );
}