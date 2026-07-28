import { redirect } from "next/navigation";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";
import { updateProfile } from "@/app/dashboard/profile/edit/actions";
import {
  getCurrentPersona,
  hasOnboarded,
} from "@/lib/server/personas/current";
import { Disclaimer } from "@/components/personas/disclaimer";
import { ExperiencesSection } from "./experiences-section";
import { AchievementsSection } from "./achievements-section";
import { ActivitiesSection } from "./activities-section";
import type {
  StudentFormInput,
  ClubFormInput,
  CorporateFormInput,
} from "@/lib/server/personas/schemas";

export const dynamic = "force-dynamic";

const STUDENT_EDITABLE = ["location", "skills", "careerInterests"] as const;
const CLUB_EDITABLE = [
  "categories",
  "eventFocus",
  "sponsorshipNeeds",
  "location",
] as const;
const CORPORATE_EDITABLE = [
  "location",
  "talentNeeds",
  "sponsorshipInterests",
  "csrFocus",
  "budgetRange",
  "collaborationIntent",
] as const;

export default async function EditProfilePage() {
  const current = await getCurrentPersona();
  if (!current) redirect("/demo");
  if (!hasOnboarded(current.row)) {
    redirect("/onboarding");
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
      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="mb-4 text-2xl font-semibold">Edit profile</h1>
        {current.row.fixtureDisclaimerRequired ? <Disclaimer /> : null}
        <OnboardingForm
          role="student"
          mode="edit"
          initialValue={initial}
          editableFields={[...STUDENT_EDITABLE]}
          submitLabel="Save changes"
          successHref="/dashboard/profile"
          action={updateProfile}
        />
        <div className="mt-8 grid gap-6">
          <ExperiencesSection student={current.row} />
          <AchievementsSection student={current.row} />
          <ActivitiesSection student={current.row} />
        </div>
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
        <h1 className="mb-4 text-2xl font-semibold">Edit profile</h1>
        {current.row.fixtureDisclaimerRequired ? <Disclaimer /> : null}
        <OnboardingForm
          role="club"
          mode="edit"
          initialValue={initial}
          editableFields={[...CLUB_EDITABLE]}
          submitLabel="Save changes"
          successHref="/dashboard/profile"
          action={updateProfile}
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
      <h1 className="mb-4 text-2xl font-semibold">Edit profile</h1>
      {current.row.fixtureDisclaimerRequired ? <Disclaimer /> : null}
      <OnboardingForm
        role="corporate"
        mode="edit"
        initialValue={initial}
        editableFields={[...CORPORATE_EDITABLE]}
        submitLabel="Save changes"
        successHref="/dashboard/profile"
        action={updateProfile}
      />
    </main>
  );
}