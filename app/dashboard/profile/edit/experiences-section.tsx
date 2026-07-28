import * as React from "react";
import { asc, eq } from "drizzle-orm";

import { db } from "@/lib/server/db";
import {
  studentExperiences,
  type students as StudentsTable,
} from "@/lib/server/db/schema";

import { ExperiencesList } from "./experiences-list";

type StudentRow = typeof StudentsTable.$inferSelect;
type ExperienceRow = typeof studentExperiences.$inferSelect;

/**
 * Server component. Reads the current student's experience rows ordered
 * by `sortOrder asc, createdAt asc` and hands them to the client list.
 *
 * If the current persona is not a student we render nothing — the parent
 * page is role-agnostic and never shows this section otherwise.
 */
export async function ExperiencesSection({
  student,
}: {
  student: StudentRow;
}) {
  const rows = await db
    .select()
    .from(studentExperiences)
    .where(eq(studentExperiences.studentId, student.id))
    .orderBy(asc(studentExperiences.sortOrder), asc(studentExperiences.createdAt));

  // Serialize to plain data for the client component.
  const initialRows: ExperienceRow[] = rows;

  return <ExperiencesList studentId={student.id} initialRows={initialRows} />;
}
