import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/server/db";
import { eq } from "drizzle-orm";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Disclaimer } from "@/components/personas/disclaimer";
import { getCurrentPersona, hasOnboarded } from "@/lib/server/personas/current";
import {
  clubs as ClubsTable,
  corporates as CorporatesTable,
  studentExperiences,
  studentAchievements,
  studentActivities,
  invitations
} from "@/lib/server/db/schema";
import { Briefcase, Trophy, Activity, Mail, Plus, Pencil } from "lucide-react";
import { ExperienceDialog, ActivityDialog, AchievementDialog } from "./inline-add-dialogs";

type ClubRowShape = typeof ClubsTable.$inferSelect;
type CorporateRowShape = typeof CorporatesTable.$inferSelect;

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const current = await getCurrentPersona();
  if (!current) redirect("/demo");
  if (!hasOnboarded(current.row)) {
    redirect("/onboarding");
  }
  
  if (current.kind === "student") {
    // Fetch all related student data
    const exps = await db.select().from(studentExperiences).where(eq(studentExperiences.studentId, current.row.id));
    const achs = await coldFetch(studentAchievements, current.row.id);
    const acts = await db.select().from(studentActivities).where(eq(studentActivities.studentId, current.row.id));
    const coldEmails = await db.select().from(invitations).where(eq(invitations.fromId, current.row.id));

    return (
      <div className="w-full">
        {current.row.fixtureDisclaimerRequired ? <Disclaimer /> : null}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT COLUMN: Main Information */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            <div className="space-y-4">
              <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/70">
                {current.row.fullName}
              </h1>
              {current.row.bio ? (
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {current.row.bio}
                </p>
              ) : (
                <p className="text-lg text-muted-foreground italic">No bio provided.</p>
              )}
            </div>

            <Separator />

            {/* Achievements */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-primary" /> Achievements
                </h2>
                <AchievementDialog trigger={
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-muted" aria-label="Add Achievement">
                    <Plus className="w-4 h-4" />
                  </Button>
                } />
              </div>
              {achs.length > 0 ? (
                <ul className="grid gap-4">
                  {achs.map(a => (
                    <li key={a.id} className="p-4 rounded-xl border bg-card">
                      <h3 className="font-semibold">{a.title}</h3>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground italic">No achievements added yet.</p>
              )}
            </div>

            {/* Activities */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Activity className="w-6 h-6 text-primary" /> Activities
                </h2>
                <ActivityDialog trigger={
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-muted" aria-label="Add Activity">
                    <Plus className="w-4 h-4" />
                  </Button>
                } />
              </div>
              {acts.length > 0 ? (
                <ul className="grid gap-4">
                  {acts.map(a => (
                    <li key={a.id} className="p-4 rounded-xl border bg-card">
                      <h3 className="font-semibold">{a.role} at {a.organization}</h3>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground italic">No activities added yet.</p>
              )}
            </div>

            {/* Experience */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Briefcase className="w-6 h-6 text-primary" /> Experience
                </h2>
                <ExperienceDialog trigger={
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-muted" aria-label="Add Experience">
                    <Plus className="w-4 h-4" />
                  </Button>
                } />
              </div>
              {exps.length > 0 ? (
                <ul className="grid gap-4">
                  {exps.map(e => (
                    <li key={e.id} className="p-4 rounded-xl border bg-card">
                      <h3 className="font-semibold">{e.title} at {e.organization}</h3>
                      {e.description && <p className="text-sm text-muted-foreground mt-1">{e.description}</p>}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground italic">No experience added yet.</p>
              )}
            </div>

            {/* Skills */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold flex items-center gap-2">Skills</h2>
              <div className="flex flex-wrap gap-2">
                {current.row.skills.length > 0 ? current.row.skills.map(s => (
                  <Badge key={s} variant="secondary" className="px-3 py-1 text-sm">{s}</Badge>
                )) : <span className="text-muted-foreground italic">No skills listed.</span>}
              </div>
            </div>

            {/* Interests */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold flex items-center gap-2">Interests</h2>
              <div className="flex flex-wrap gap-2">
                {current.row.careerInterests.length > 0 ? current.row.careerInterests.map(i => (
                  <Badge key={i} variant="outline" className="px-3 py-1 text-sm">{i}</Badge>
                )) : <span className="text-muted-foreground italic">No interests listed.</span>}
              </div>
            </div>

            {/* Cold Emails */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Mail className="w-6 h-6 text-primary" /> Cold Emails Sent
              </h2>
              {coldEmails.length > 0 ? (
                <ul className="grid gap-3">
                  {coldEmails.map(email => (
                    <li key={email.id} className="p-4 rounded-xl border bg-card flex justify-between items-center">
                      <span className="font-medium text-sm line-clamp-1">{email.subject}</span>
                      <Badge variant={email.status === "sent" ? "default" : "secondary"} className="capitalize">{email.status}</Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground italic">You haven&apos;t sent any cold emails yet.</p>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Actions */}
          <div className="flex flex-col gap-4">
            <div className="sticky top-24 space-y-4">
              <Button render={
                <Link href="/dashboard/profile/edit">
                  <Pencil className="w-4 h-4 mr-2" /> Edit Profile
                </Link>
              } size="lg" className="w-full justify-start text-base font-semibold shadow-md" />
              
              <div className="pt-4 space-y-3 border-t">
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">Quick Add</p>
                <Button render={
                  <Link href="/dashboard/profile/edit#experience">
                    <Plus className="w-4 h-4 mr-2" /> Add new Experience
                  </Link>
                } variant="outline" className="w-full justify-start" />
                <Button render={
                  <Link href="/dashboard/profile/edit#activities">
                    <Plus className="w-4 h-4 mr-2" /> Add new Activities
                  </Link>
                } variant="outline" className="w-full justify-start" />
                <Button render={
                  <Link href="/dashboard/profile/edit#achievements">
                    <Plus className="w-4 h-4 mr-2" /> Add new Achievements
                  </Link>
                } variant="outline" className="w-full justify-start" />
                <Button render={
                  <Link href="/dashboard/profile/edit#skills">
                    <Plus className="w-4 h-4 mr-2" /> Add new Interests
                  </Link>
                } variant="outline" className="w-full justify-start" />
                <Button render={
                  <Link href="/dashboard/profile/edit#skills">
                    <Plus className="w-4 h-4 mr-2" /> Add new Skills
                  </Link>
                } variant="outline" className="w-full justify-start" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Non-student layout
  return (
    <div className="w-full">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Your profile</h1>
        <Button variant="outline" render={
          <Link href="/dashboard/profile/edit" prefetch={false}>
            Edit profile details
          </Link>
        } />
      </header>
      {current.row.fixtureDisclaimerRequired ? <Disclaimer /> : null}
      {current.kind === "club" ? <ClubReview row={current.row} /> : null}
      {current.kind === "corporate" ? <CorporateReview row={current.row} /> : null}
    </div>
  );
}

// Helpers for Club/Corporate
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h2 className="mb-2 text-lg font-medium">{title}</h2>
      <Separator className="mb-4" />
      {children}
    </section>
  );
}

function FieldRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="grid grid-cols-3 gap-2 py-1.5">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="col-span-2 text-sm">{value || <em className="text-muted-foreground">Not provided</em>}</dd>
    </div>
  );
}

function Chips({ values, emptyLabel }: { values: string[]; emptyLabel: string; }) {
  if (values.length === 0) return <em className="text-sm text-muted-foreground">{emptyLabel}</em>;
  return (
    <ul className="flex flex-wrap gap-1.5">
      {values.map((v, i) => (
        <li key={`${v}-${i}`}><Badge variant="secondary">{v}</Badge></li>
      ))}
    </ul>
  );
}

function ClubReview({ row }: { row: ClubRowShape }) {
  return (
    <>
      <Section title="Identity">
        <Card><CardContent className="pt-6">
          <FieldRow label="Club name" value={row.clubName} />
          <FieldRow label="University" value={row.university} />
          <FieldRow label="Mission" value={row.mission} />
          <FieldRow label="Contact role" value={row.contactRole} />
          <FieldRow label="Audience/reach" value={row.audienceReachLabel} />
        </CardContent></Card>
      </Section>
      <Section title="Match-relevant">
        <Card><CardContent className="grid gap-4 pt-6">
          <FieldRow label="Location" value={row.location} />
          <div><p className="mb-1 text-sm text-muted-foreground">Categories</p><Chips values={row.categories} emptyLabel="None" /></div>
          <div><p className="mb-1 text-sm text-muted-foreground">Event focus</p><Chips values={row.eventFocus} emptyLabel="None" /></div>
          <div><p className="mb-1 text-sm text-muted-foreground">Sponsorship needs</p><Chips values={row.sponsorshipNeeds} emptyLabel="None" /></div>
        </CardContent></Card>
      </Section>
    </>
  );
}

function CorporateReview({ row }: { row: CorporateRowShape }) {
  return (
    <>
      <Section title="Identity">
        <Card><CardContent className="pt-6">
          <FieldRow label="Organization" value={row.organizationName} />
          <FieldRow label="Industry" value={row.industry} />
          <FieldRow label="Description" value={row.description} />
          <div className="grid grid-cols-3 gap-2 py-1.5">
            <dt className="text-sm text-muted-foreground">Collaboration intent</dt>
            <dd className="col-span-2 text-sm"><Badge variant="outline">{row.collaborationIntent}</Badge></dd>
          </div>
        </CardContent></Card>
      </Section>
      <Section title="Match-relevant">
        <Card><CardContent className="grid gap-4 pt-6">
          <FieldRow label="Location" value={row.location} />
          <div><p className="mb-1 text-sm text-muted-foreground">Talent needs</p><Chips values={row.talentNeeds} emptyLabel="None" /></div>
          <div><p className="mb-1 text-sm text-muted-foreground">Sponsorship interests</p><Chips values={row.sponsorshipInterests} emptyLabel="None" /></div>
          <div><p className="mb-1 text-sm text-muted-foreground">CSR focus</p><Chips values={row.csrFocus} emptyLabel="None" /></div>
          <FieldRow label="Budget range" value={row.budgetRange === "Undisclosed" ? "" : row.budgetRange} />
        </CardContent></Card>
      </Section>
    </>
  );
}

async function coldFetch(table: typeof studentAchievements, id: string) {
  return await db.select().from(table).where(eq(table.studentId, id));
}