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
      <main className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-8 flex flex-col gap-1.5">
          <p className="text-sm font-medium text-muted-foreground">Step 2 of 2 · Profile details</p>
          <h1 className="text-3xl font-semibold tracking-tight">Student onboarding</h1>
          <p className="text-base text-muted-foreground">Complete your profile to get personalized updates and matches.</p>
        </div>
        {current.row.fixtureDisclaimerRequired ? <Disclaimer /> : null}
        <OnboardingForm
          role="student"
          mode="create"
          initialValue={initial}
          submitLabel="Save profile"
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
      <main className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-8 flex flex-col gap-1.5">
          <p className="text-sm font-medium text-muted-foreground">Step 2 of 2 · Profile details</p>
          <h1 className="text-3xl font-semibold tracking-tight">Club onboarding</h1>
          <p className="text-base text-muted-foreground">Complete your profile to get personalized updates and matches.</p>
        </div>
        {current.row.fixtureDisclaimerRequired ? <Disclaimer /> : null}
        <OnboardingForm
          role="club"
          mode="create"
          initialValue={initial}
          submitLabel="Save profile"
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
    <main className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-8 flex flex-col gap-1.5">
        <p className="text-sm font-medium text-muted-foreground">Step 2 of 2 · Profile details</p>
        <h1 className="text-3xl font-semibold tracking-tight">Corporate onboarding</h1>
        <p className="text-base text-muted-foreground">Complete your profile to get personalized updates and matches.</p>
      </div>
      {current.row.fixtureDisclaimerRequired ? <Disclaimer /> : null}
      <OnboardingForm
        role="corporate"
        mode="create"
        initialValue={initial}
        submitLabel="Save profile"
        successHref="/dashboard"
        action={submitProfile}
      />
    </main>
  );
}