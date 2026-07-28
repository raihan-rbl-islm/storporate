import { asc, eq } from "drizzle-orm";

import { db } from "@/lib/server/db";
import {
  studentAchievements,
  type students as StudentsTable,
} from "@/lib/server/db/schema";

import { AchievementsList } from "./achievements-list";

type StudentRow = typeof StudentsTable.$inferSelect;

export async function AchievementsSection({
  student,
}: {
  student: StudentRow;
}) {
  const rows = await db
    .select()
    .from(studentAchievements)
    .where(eq(studentAchievements.studentId, student.id))
    .orderBy(asc(studentAchievements.sortOrder));

  return <AchievementsList initialRows={rows} />;
}
