import { asc, eq } from "drizzle-orm";

import { db } from "@/lib/server/db";
import {
  studentActivities,
  type students as StudentsTable,
} from "@/lib/server/db/schema";

import { ActivitiesList } from "./activities-list";

type StudentRow = typeof StudentsTable.$inferSelect;

export async function ActivitiesSection({
  student,
}: {
  student: StudentRow;
}) {
  const rows = await db
    .select()
    .from(studentActivities)
    .where(eq(studentActivities.studentId, student.id))
    .orderBy(asc(studentActivities.sortOrder));

  return <ActivitiesList initialRows={rows} />;
}
