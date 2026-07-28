import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatInDhaka } from "@/lib/format/datetime";

export interface PostForCard {
  slug: string;
  title: string;
  body: string;
  kind: "journal" | "news";
  ownerName: string;
  ownerKind: "club" | "corporate";
  tags: string[];
  publishedAt: Date | string;
  matchScore?: number;
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

/**
 * Renders "X days ago" / "X hours ago" relative to `now`. Falls back to
 * a Dhaka-time absolute date for very recent or far-future timestamps
 * (negative clock skew, or just too far in the future).
 */
function relativeTime(target: Date, now: Date = new Date()): string {
  const diffMs = target.getTime() - now.getTime();
  const abs = Math.abs(diffMs);
  // Anything > 30 days in either direction: show absolute.
  if (abs > 30 * 24 * 60 * 60 * 1000) return formatInDhaka(target);
  const fmt = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const seconds = diffMs / 1000;
  if (abs < 60) return fmt.format(Math.round(seconds), "second");
  const minutes = seconds / 60;
  if (Math.abs(minutes) < 60) return fmt.format(Math.round(minutes), "minute");
  const hours = minutes / 60;
  if (Math.abs(hours) < 24) return fmt.format(Math.round(hours), "hour");
  const days = hours / 24;
  return fmt.format(Math.round(days), "day");
}

export function PostCard({ post }: { post: PostForCard }) {
  const publishedAt =
    post.publishedAt instanceof Date
      ? post.publishedAt
      : new Date(post.publishedAt);
  return (
    <Card className="relative transition hover:ring-foreground/20">
      <Link
        href={`/posts/${post.slug}`}
        prefetch={false}
        className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl"
      >
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="line-clamp-2">{post.title}</CardTitle>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <Badge className={kindBadgeClass(post.kind)} variant="outline">
                {kindLabel(post.kind)}
              </Badge>
              {typeof post.matchScore === "number" ? (
                <Badge variant="secondary">
                  {Math.round(post.matchScore * 100)}% match
                </Badge>
              ) : null}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            from <span className="font-medium">{post.ownerName}</span>
            {" · "}
            <span className="capitalize">{post.ownerKind}</span>
            {" · "}
            {relativeTime(publishedAt)}
          </p>
        </CardHeader>
        {post.body ? (
          <CardContent className="grid gap-3">
            <p className="line-clamp-3 text-sm text-muted-foreground">
              {post.body}
            </p>
            {post.tags.length > 0 ? (
              <ul className="flex flex-wrap gap-1.5">
                {post.tags.slice(0, 5).map((tag, i) => (
                  <li key={`${tag}-${i}`}>
                    <Badge variant="outline">{tag}</Badge>
                  </li>
                ))}
              </ul>
            ) : null}
          </CardContent>
        ) : post.tags.length > 0 ? (
          <CardContent className="grid gap-3">
            <ul className="flex flex-wrap gap-1.5">
              {post.tags.slice(0, 5).map((tag, i) => (
                <li key={`${tag}-${i}`}>
                  <Badge variant="outline">{tag}</Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        ) : null}
      </Link>
    </Card>
  );
}