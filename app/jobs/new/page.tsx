import { redirect } from "next/navigation";

import { getCurrentPersona } from "@/lib/server/personas/current";
import { CreateJobForm } from "./create-job-form";

export const dynamic = "force-dynamic";

export default async function NewJobPage() {
  const current = await getCurrentPersona();
  if (!current) {
    redirect("/signin?next=/jobs/new");
  }
  if (current.kind !== "corporate") {
    redirect("/dashboard");
  }
  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-4 text-2xl font-semibold">New job</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Share what you need, what skills matter, and how candidates can reach
        you. Students will see this on the newsfeed and in your candidate
        list.
      </p>
      <CreateJobForm mode="create" />
    </main>
  );
}