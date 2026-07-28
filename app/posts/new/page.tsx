import { redirect } from "next/navigation";

import { getCurrentPersona } from "@/lib/server/personas/current";
import { CreatePostForm } from "./create-post-form";

export const dynamic = "force-dynamic";

export default async function NewPostPage() {
  const current = await getCurrentPersona();
  if (!current) {
    redirect("/signin?next=/posts/new");
  }
  if (current.kind !== "club" && current.kind !== "corporate") {
    redirect("/dashboard");
  }
  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-4 text-2xl font-semibold">New post</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Publish a journal entry or news update from your organization. Posts
        show up in the student newsfeed.
      </p>
      <CreatePostForm mode="create" />
    </main>
  );
}