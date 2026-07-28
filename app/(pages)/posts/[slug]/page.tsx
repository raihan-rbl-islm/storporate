import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
    <main className="mx-auto max-w-3xl px-4 py-8">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="grid gap-1">
          <p className="text-sm text-muted-foreground">
            from{" "}
            <span className="font-medium text-foreground">{ownerName}</span>
            {" · "}
            <span className="capitalize">{postRow.ownerKind}</span>
          </p>
          <h1 className="text-2xl font-semibold">{postRow.title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={kindBadgeClass(postRow.kind)} variant="outline">
            {kindLabel(postRow.kind)}
          </Badge>
          {isOwner ? (
            <Button
              variant="outline"
              render={<Link href={`/posts/${postRow.slug}/manage`}>Manage</Link>}
            />
          ) : null}
        </div>
      </header>

      <Card>
        <CardContent className="grid gap-3 pt-6 text-sm text-muted-foreground">
          <p>
            <span className="font-medium">Posted:</span>{" "}
            {formatInDhaka(postRow.publishedAt)} (Dhaka time)
          </p>
          {postRow.tags.length > 0 ? (
            <ul className="flex flex-wrap gap-1.5">
              {postRow.tags.map((tag, i) => (
                <li key={`${tag}-${i}`}>
                  <Badge variant="outline">{tag}</Badge>
                </li>
              ))}
            </ul>
          ) : null}
        </CardContent>
      </Card>

      {postRow.body ? (
        <section className="mt-6">
          <Separator className="mb-4" />
          <pre className="whitespace-pre-wrap font-sans text-base leading-relaxed">
            {postRow.body}
          </pre>
        </section>
      ) : null}

      <footer className="mt-10 border-t pt-4 text-sm text-muted-foreground">
        From {ownerName}
      </footer>
    </main>
  );
}