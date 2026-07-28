import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatInDhaka } from "@/lib/format/datetime";
import { db } from "@/lib/server/db";
import { posts } from "@/lib/server/db/schema";
import { getCurrentPersona } from "@/lib/server/personas/current";
import { CreatePostForm } from "@/app/posts/new/create-post-form";
import { deletePost } from "@/app/posts/actions";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function ManagePostPage({ params }: Props) {
  const { slug } = await params;

  const viewer = await getCurrentPersona();
  if (!viewer) redirect(`/signin?next=/posts/${slug}/manage`);
  if (viewer.kind !== "club" && viewer.kind !== "corporate") {
    redirect(`/posts/${slug}`);
  }

  const [postRow] = await db
    .select()
    .from(posts)
    .where(eq(posts.slug, slug))
    .limit(1);
  if (!postRow) notFound();
  if (
    postRow.ownerKind !== viewer.kind ||
    postRow.ownerId !== viewer.row.id
  ) {
    redirect(`/posts/${slug}`);
  }

  const postId = postRow.id;
  async function deleteAction() {
    "use server";
    await deletePost(postId);
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const shareUrl = `${baseUrl}/posts/${postRow.slug}`;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm text-muted-foreground">Manage post</p>
          <h1 className="text-2xl font-semibold">{postRow.title}</h1>
          <p className="text-xs text-muted-foreground">
            Published {formatInDhaka(postRow.publishedAt)}
          </p>
        </div>
        <Button
          variant="outline"
          render={<Link href={`/posts/${postRow.slug}`}>View public page</Link>}
        />
      </header>

      <section className="mb-6">
        <h2 className="mb-2 text-lg font-medium">Share</h2>
        <Separator className="mb-4" />
        <p className="text-sm">
          Share this link with students:{" "}
          <a
            href={shareUrl}
            className="break-all text-primary underline underline-offset-4 hover:no-underline"
          >
            {shareUrl}
          </a>
        </p>
      </section>

      <section className="mb-6">
        <h2 className="mb-2 text-lg font-medium">Edit post</h2>
        <Separator className="mb-4" />
        <CreatePostForm
          mode="edit"
          postId={postRow.id}
          submitLabel="Save changes"
          initialValue={{
            kind: postRow.kind === "news" ? "news" : "journal",
            title: postRow.title,
            body: postRow.body,
            tags: postRow.tags,
          }}
        />
      </section>

      <section className="mb-12 flex flex-wrap gap-3">
        <form action={deleteAction}>
          <Button type="submit" variant="destructive">
            Delete post
          </Button>
        </form>
      </section>
    </main>
  );
}