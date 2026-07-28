import { redirect } from "next/navigation";

import { getCurrentPersona } from "@/lib/server/personas/current";
import { CreateEventForm } from "./create-event-form";

export const dynamic = "force-dynamic";

export default async function NewEventPage() {
  const current = await getCurrentPersona();
  if (!current) {
    redirect("/signin?next=/events/new");
  }
  if (current.kind !== "club" && current.kind !== "corporate") {
    redirect("/dashboard");
  }
  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-4 text-2xl font-semibold">New event</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Share what your event is about, when and where it happens, and how
        students can sign up.
      </p>
      <CreateEventForm mode="create" />
    </main>
  );
}
