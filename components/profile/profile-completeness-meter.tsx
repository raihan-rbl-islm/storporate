import Link from "next/link";
import { count, eq } from "drizzle-orm";

import { db } from "@/lib/server/db";
import {
  studentExperiences,
  studentAchievements,
  studentActivities,
  type students as StudentsTable,
} from "@/lib/server/db/schema";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  computeProfileCompleteness,
  sectionsLeftToComplete,
} from "@/lib/server/profile/completeness";

type StudentRow = typeof StudentsTable.$inferSelect;

interface ProfileCompletenessMeterProps {
  student: StudentRow;
}

/**
 * Server component. Computes the profile completeness for a student and
 * renders a horizontal progress bar + percentage + "X sections left"
 * copy. Hidden when completeness is already 100.
 *
 * The component is purely presentational — all data fetching happens here
 * so the dashboard page can drop it in without any extra props wiring.
 */
export async function ProfileCompletenessMeter({
  student,
}: ProfileCompletenessMeterProps) {
  // Run three cheap COUNTs in parallel. Each one is bounded by the
  // student's own rows so the per-row scan is small.
  const [expRow, achRow, actRow] = await Promise.all([
    db
      .select({ value: count() })
      .from(studentExperiences)
      .where(eq(studentExperiences.studentId, student.id)),
    db
      .select({ value: count() })
      .from(studentAchievements)
      .where(eq(studentAchievements.studentId, student.id)),
    db
      .select({ value: count() })
      .from(studentActivities)
      .where(eq(studentActivities.studentId, student.id)),
  ]);

  const experienceCount = expRow[0]?.value ?? 0;
  const achievementCount = achRow[0]?.value ?? 0;
  const activityCount = actRow[0]?.value ?? 0;

  const score = computeProfileCompleteness(student, {
    experienceCount,
    achievementCount,
    activityCount,
  });

  // Hide entirely when fully complete — the dashboard shouldn't push a
  // finished profile in the student's face.
  if (score >= 100) return null;

  const missing = sectionsLeftToComplete(student, {
    experienceCount,
    achievementCount,
    activityCount,
  });

  return (
    <Card data-testid="profile-completeness-meter">
      <CardHeader>
        <CardTitle>
          <h2 className="text-lg font-semibold">Profile completeness</h2>
        </CardTitle>
        <CardDescription>
          {missing.length === 0
            ? "Almost there — finish the last details."
            : `${missing.length} section${missing.length === 1 ? "" : "s"} left to complete.`}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={score}
          className="h-2 w-full overflow-hidden rounded-full bg-muted"
        >
          <div
            className="h-full bg-primary transition-[width] duration-300"
            style={{ width: `${score}%` }}
          />
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium">{score}% complete</p>
          <Link
            href="/dashboard/profile/edit"
            className={buttonVariants({ variant: "outline", size: "sm" })}
            prefetch={false}
          >
            Complete profile
          </Link>
        </div>
        {missing.length > 0 ? (
          <p className="text-xs text-muted-foreground">
            Still to add: {missing.join(", ")}.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

export default ProfileCompletenessMeter;
