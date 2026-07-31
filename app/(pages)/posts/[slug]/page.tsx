import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatInDhaka } from "@/lib/format/datetime";
import { db } from "@/lib/server/db";
import { posts, clubs, corporates } from "@/lib/server/db/schema";
import { getCurrentPersona } from "@/lib/server/personas/current";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

function kindLabel(kind: string): string {
  if (kind === "journal") return "Journal";
  if (kind === "news") return "News";
  return "Post";
}

function kindBadgeClass(kind: string): string {
  if (kind === "journal") {
    return "bg-violet-100 text-violet-900 dark:bg-violet-950 dark:text-violet-100 border-transparent";
  }
  if (kind === "news") {
    return "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-100 border-transparent";
  }
  return "";
}

export default async function PostDetailPage({ params }: Props) {
  const { slug } = await params;

  const [postRow] = await db
    .select()
    .from(posts)
    .where(eq(posts.slug, slug))
    .limit(1);
  if (!postRow) notFound();

  let ownerName = "Unknown";
  if (postRow.ownerKind === "club") {
    const [row] = await db
      .select({ clubName: clubs.clubName })
      .from(clubs)
      .where(eq(clubs.id, postRow.ownerId))
      .limit(1);
    ownerName = row?.clubName ?? "Unknown club";
  } else if (postRow.ownerKind === "corporate") {
    const [row] = await db
      .select({ organizationName: corporates.organizationName })
      .from(corporates)
      .where(eq(corporates.id, postRow.ownerId))
      .limit(1);
    ownerName = row?.organizationName ?? "Unknown company";
  }

  const viewer = await getCurrentPersona();
  if (!viewer) {
    redirect(`/signin?next=/posts/${slug}`);
  }

  const isOwner =
    viewer.kind === postRow.ownerKind &&
    viewer.row.id === postRow.ownerId;

  return (
    <main className="mx-auto max-w-[1200px] px-6 py-8 md:py-12">
      <header className="pb-8 border-b border-border/50 flex flex-wrap items-center justify-between gap-6">
        <div className="grid gap-3">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest flex items-center gap-2">
            <span className="bg-muted px-2 py-1 rounded-md text-foreground">{ownerName}</span>
            <span>·</span>
            <span>{postRow.ownerKind}</span>
          </p>
          <h1 className="text-4xl font-bold tracking-tight">{postRow.title}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge className={kindBadgeClass(postRow.kind)} variant="outline">
              {kindLabel(postRow.kind)}
            </Badge>
          </div>
        </div>
        {isOwner ? (
          <Button
            variant="outline"
            render={<Link href={`/posts/${postRow.slug}/manage`}>Manage Post</Link>}
          />
        ) : null}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-16 mt-8 md:mt-12">
        
        {/* Left Pane (Wide): Content */}
        <div className="md:col-span-2 flex flex-col gap-10">
          {postRow.body ? (
            <section>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-base leading-relaxed text-foreground">
                  {postRow.body}
                </pre>
              </div>
            </section>
          ) : null}
        </div>

        {/* Right Pane (Narrow): Metadata */}
        <div className="flex flex-col gap-10">
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-4">Details</h2>
            <ul className="grid gap-4 text-sm">
              <li className="grid gap-1">
                <span className="font-semibold">Posted</span>
                <span className="text-muted-foreground">
                  {formatInDhaka(postRow.publishedAt)} (Dhaka time)
                </span>
              </li>
              <li className="grid gap-1">
                <span className="font-semibold">Author</span>
                <span className="text-muted-foreground">{ownerName}</span>
              </li>
            </ul>
          </section>

          {postRow.tags.length > 0 ? (
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-4">Tags</h2>
              <ul className="flex flex-wrap gap-2">
                {postRow.tags.map((tag, i) => (
                  <li key={`${tag}-${i}`}>
                    <Badge variant="secondary" className="font-medium">{tag}</Badge>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </div>
    </main>
  );
}