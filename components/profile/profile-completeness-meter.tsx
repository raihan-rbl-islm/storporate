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
import { AnimatedProgress } from "@/components/ui/animated-progress";
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
    <Card data-testid="profile-completeness-meter" className="bg-gradient-to-br from-background to-muted/30 border-primary/20 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
      <CardHeader className="pb-3">
        <CardTitle>
          <h2 className="text-xl font-bold tracking-tight">Profile completeness</h2>
        </CardTitle>
        <CardDescription className="text-sm font-medium">
          {missing.length === 0
            ? "Almost there — finish the last details."
            : `${missing.length} section${missing.length === 1 ? "" : "s"} left to complete.`}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-end mb-1">
            <span className="text-2xl font-bold text-primary">{score}%</span>
          </div>
          <AnimatedProgress value={score} />
        </div>
        
        <div className="flex items-center justify-between gap-4 mt-2">
          {missing.length > 0 ? (
            <p className="text-xs text-muted-foreground font-medium leading-relaxed max-w-[200px]">
              Missing: <span className="text-foreground/80">{missing.join(", ")}</span>.
            </p>
          ) : <div />}
          
          <Link
            href="/dashboard/profile/edit"
            className={buttonVariants({ variant: "default", size: "sm", className: "shrink-0 shadow-md hover:shadow-lg transition-all" })}
            prefetch={false}
          >
            Complete profile
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default ProfileCompletenessMeter;
