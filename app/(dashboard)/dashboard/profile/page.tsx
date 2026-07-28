import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/server/db";
import { eq } from "drizzle-orm";
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
        
        <div className="flex flex-col gap-8 max-w-4xl">
          {/* Main Information */}
          <div className="flex justify-between items-start gap-4">
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
            <Button render={
              <Link href="/dashboard/profile/edit">
                <Pencil className="w-4 h-4 mr-2" /> Edit Profile
              </Link>
            } variant="outline" className="shrink-0" />
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
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold flex items-center gap-2">Skills</h2>
                <Button render={
                  <Link href="/dashboard/profile/edit">
                    <Plus className="w-4 h-4" />
                  </Link>
                } variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-muted" aria-label="Edit Skills" />
              </div>
              <div className="flex flex-wrap gap-2">
                {current.row.skills.length > 0 ? current.row.skills.map(s => (
                  <Badge key={s} variant="secondary" className="px-3 py-1 text-sm">{s}</Badge>
                )) : <span className="text-muted-foreground italic">No skills listed.</span>}
              </div>
            </div>

            {/* Interests */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold flex items-center gap-2">Interests</h2>
                <Button render={
                  <Link href="/dashboard/profile/edit">
                    <Plus className="w-4 h-4" />
                  </Link>
                } variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-muted" aria-label="Edit Interests" />
              </div>
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
      </div>
    );
  }

  // Non-student layout
  return (
    <div className="w-full">
      {current.row.fixtureDisclaimerRequired ? <Disclaimer /> : null}
      {current.kind === "club" ? <ClubReview row={current.row} /> : null}
      {current.kind === "corporate" ? <CorporateReview row={current.row} /> : null}
    </div>
  );
}

// Helpers for Club/Corporate
// Utility functions removed as they are no longer used

function ClubReview({ row }: { row: ClubRowShape }) {
  return (
    <div className="flex flex-col gap-8 max-w-4xl">
      {/* Main Information */}
      <div className="flex justify-between items-start gap-4">
        <div className="space-y-4">
          <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/70">
            {row.clubName}
          </h1>
          {row.mission ? (
            <p className="text-lg text-muted-foreground leading-relaxed">
              {row.mission}
            </p>
          ) : (
            <p className="text-lg text-muted-foreground italic">No mission statement provided.</p>
          )}
        </div>
        <Button render={
          <Link href="/dashboard/profile/edit">
            <Pencil className="w-4 h-4 mr-2" /> Edit Profile
          </Link>
        } variant="outline" className="shrink-0" />
      </div>

        <Separator />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border bg-card">
            <p className="text-sm text-muted-foreground mb-1">University</p>
            <p className="font-semibold">{row.university || "Not specified"}</p>
          </div>
          <div className="p-4 rounded-xl border bg-card">
            <p className="text-sm text-muted-foreground mb-1">Location</p>
            <p className="font-semibold">{row.location || "Not specified"}</p>
          </div>
          <div className="p-4 rounded-xl border bg-card">
            <p className="text-sm text-muted-foreground mb-1">Contact Role</p>
            <p className="font-semibold">{row.contactRole || "Not specified"}</p>
          </div>
          <div className="p-4 rounded-xl border bg-card">
            <p className="text-sm text-muted-foreground mb-1">Audience Reach</p>
            <p className="font-semibold">{row.audienceReachLabel || "Not specified"}</p>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Categories</h2>
          <div className="flex flex-wrap gap-2">
            {row.categories.length > 0 ? row.categories.map(c => (
              <Badge key={c} variant="secondary" className="px-3 py-1 text-sm">{c}</Badge>
            )) : <span className="text-muted-foreground italic">No categories listed.</span>}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Event Focus</h2>
          <div className="flex flex-wrap gap-2">
            {row.eventFocus.length > 0 ? row.eventFocus.map(f => (
              <Badge key={f} variant="outline" className="px-3 py-1 text-sm">{f}</Badge>
            )) : <span className="text-muted-foreground italic">No event focus listed.</span>}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Sponsorship Needs</h2>
          <div className="flex flex-wrap gap-2">
            {row.sponsorshipNeeds.length > 0 ? row.sponsorshipNeeds.map(s => (
              <Badge key={s} variant="outline" className="px-3 py-1 text-sm">{s}</Badge>
            )) : <span className="text-muted-foreground italic">No sponsorship needs listed.</span>}
          </div>
        </div>
    </div>
  );
}

function CorporateReview({ row }: { row: CorporateRowShape }) {
  return (
    <div className="flex flex-col gap-8 max-w-4xl">
      {/* Main Information */}
      <div className="flex justify-between items-start gap-4">
        <div className="space-y-4">
          <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/70">
            {row.organizationName}
          </h1>
          {row.description ? (
            <p className="text-lg text-muted-foreground leading-relaxed">
              {row.description}
            </p>
          ) : (
            <p className="text-lg text-muted-foreground italic">No description provided.</p>
          )}
        </div>
        <Button render={
          <Link href="/dashboard/profile/edit">
            <Pencil className="w-4 h-4 mr-2" /> Edit Profile
          </Link>
        } variant="outline" className="shrink-0" />
      </div>

        <Separator />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border bg-card">
            <p className="text-sm text-muted-foreground mb-1">Industry</p>
            <p className="font-semibold">{row.industry || "Not specified"}</p>
          </div>
          <div className="p-4 rounded-xl border bg-card">
            <p className="text-sm text-muted-foreground mb-1">Location</p>
            <p className="font-semibold">{row.location || "Not specified"}</p>
          </div>
          <div className="p-4 rounded-xl border bg-card">
            <p className="text-sm text-muted-foreground mb-1">Collaboration Intent</p>
            <Badge variant="outline" className="mt-1">{row.collaborationIntent}</Badge>
          </div>
          <div className="p-4 rounded-xl border bg-card">
            <p className="text-sm text-muted-foreground mb-1">Budget Range</p>
            <p className="font-semibold">{row.budgetRange === "Undisclosed" ? "Undisclosed" : row.budgetRange}</p>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Talent Needs</h2>
          <div className="flex flex-wrap gap-2">
            {row.talentNeeds.length > 0 ? row.talentNeeds.map(t => (
              <Badge key={t} variant="secondary" className="px-3 py-1 text-sm">{t}</Badge>
            )) : <span className="text-muted-foreground italic">No talent needs listed.</span>}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Sponsorship Interests</h2>
          <div className="flex flex-wrap gap-2">
            {row.sponsorshipInterests.length > 0 ? row.sponsorshipInterests.map(s => (
              <Badge key={s} variant="outline" className="px-3 py-1 text-sm">{s}</Badge>
            )) : <span className="text-muted-foreground italic">No sponsorship interests listed.</span>}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold">CSR Focus</h2>
          <div className="flex flex-wrap gap-2">
            {row.csrFocus.length > 0 ? row.csrFocus.map(c => (
              <Badge key={c} variant="outline" className="px-3 py-1 text-sm">{c}</Badge>
            )) : <span className="text-muted-foreground italic">No CSR focus listed.</span>}
          </div>
        </div>
    </div>
  );
}

async function coldFetch(table: typeof studentAchievements, id: string) {
  return await db.select().from(table).where(eq(table.studentId, id));
}