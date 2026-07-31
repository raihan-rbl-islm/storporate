import { redirect } from "next/navigation";
import {
  getCurrentPersona,
  hasOnboarded,
} from "@/lib/server/personas/current";
import { Disclaimer } from "@/components/personas/disclaimer";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";
import { submitProfile } from "@/app/onboarding/actions";
import type {
  StudentFormInput,
  ClubFormInput,
  CorporateFormInput,
} from "@/lib/server/personas/schemas";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const current = await getCurrentPersona();
  if (!current) {
    redirect("/demo");
  }
  // If already completed, bounce to dashboard.
  if (hasOnboarded(current.row)) {
    redirect("/dashboard");
  }
  
  const renderHeader = (roleTitle: string) => (
    <>
      <div className="mb-12 flex items-center gap-4">
        <div className="h-1.5 flex-1 bg-primary/20 rounded-full overflow-hidden">
          <div className="h-full bg-primary w-full" />
        </div>
        <span className="text-sm font-bold tracking-tight text-primary">Final Step</span>
      </div>
      <div className="mb-12 space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tighter">Let&apos;s build your profile.</h1>
        <p className="text-xl text-muted-foreground leading-relaxed">
          Tell us about your {roleTitle} focus so we can start curating your matches.
        </p>
      </div>
    </>
  );

  if (current.kind === "student") {
    const initial: StudentFormInput = {
      fullName: current.row.fullName,
      university: current.row.university,
      studyProgram: current.row.studyProgram,
      expectedGraduation: current.row.expectedGraduation,
      location: current.row.location,
      bio: current.row.bio,
      skills: current.row.skills,
      careerInterests: current.row.careerInterests,
    };
    return (
      <main className="mx-auto max-w-3xl px-6 py-12 md:py-24">
        {renderHeader("academic and career")}
        {current.row.fixtureDisclaimerRequired ? <Disclaimer /> : null}
        <OnboardingForm
          role="student"
          mode="create"
          initialValue={initial}
          submitLabel="Complete Setup"
          successHref="/dashboard"
          action={submitProfile}
        />
      </main>
    );
  }
  if (current.kind === "club") {
    const initial: ClubFormInput = {
      clubName: current.row.clubName,
      university: current.row.university,
      categories: current.row.categories,
      mission: current.row.mission,
      audienceReachLabel: current.row.audienceReachLabel,
      eventFocus: current.row.eventFocus,
      sponsorshipNeeds: current.row.sponsorshipNeeds,
      location: current.row.location,
      contactRole: current.row.contactRole,
    };
    return (
      <main className="mx-auto max-w-3xl px-6 py-12 md:py-24">
        {renderHeader("club's mission and sponsorship")}
        {current.row.fixtureDisclaimerRequired ? <Disclaimer /> : null}
        <OnboardingForm
          role="club"
          mode="create"
          initialValue={initial}
          submitLabel="Complete Setup"
          successHref="/dashboard"
          action={submitProfile}
        />
      </main>
    );
  }
  const initial: CorporateFormInput = {
    organizationName: current.row.organizationName,
    industry: current.row.industry,
    location: current.row.location,
    description: current.row.description,
    talentNeeds: current.row.talentNeeds,
    sponsorshipInterests: current.row.sponsorshipInterests,
    csrFocus: current.row.csrFocus,
    budgetRange: current.row.budgetRange,
    collaborationIntent: current.row.collaborationIntent as CorporateFormInput["collaborationIntent"],
  };
  return (
    <main className="mx-auto max-w-3xl px-6 py-12 md:py-24">
      {renderHeader("hiring and CSR")}
      {current.row.fixtureDisclaimerRequired ? <Disclaimer /> : null}
      <OnboardingForm
        role="corporate"
        mode="create"
        initialValue={initial}
        submitLabel="Complete Setup"
        successHref="/dashboard"
        action={submitProfile}
      />
    </main>
  );
}