import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatInDhaka } from "@/lib/format/datetime";
import { cn } from "@/lib/utils";

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

function relativeTime(target: Date, now: Date = new Date()): string {
  const diffMs = target.getTime() - now.getTime();
  const abs = Math.abs(diffMs);
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
      
  const isHighMatch = post.matchScore && post.matchScore > 0.8;
  const isJournal = post.kind === "journal";

  return (
    <Link
      href={`/posts/${post.slug}`}
      prefetch={false}
      className="group block relative overflow-hidden rounded-2xl border bg-background/50 backdrop-blur-sm transition-all duration-500 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <div className={cn(
        "absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 pointer-events-none bg-gradient-to-r",
        isJournal ? "from-violet-500/10 via-transparent to-violet-500/10" : "from-amber-500/10 via-transparent to-amber-500/10"
      )} />
      
      <div className="relative p-6 flex flex-col h-full gap-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge 
                variant="outline" 
                className={cn(
                  "px-2 py-0.5 font-medium border-transparent",
                  isJournal 
                    ? "bg-violet-100 text-violet-900 dark:bg-violet-950 dark:text-violet-100"
                    : "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-100"
                )}
              >
                {kindLabel(post.kind)}
              </Badge>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="w-3.5 h-3.5" />
                {relativeTime(publishedAt)}
              </div>
            </div>
            <h3 className="font-semibold text-lg leading-tight group-hover:text-primary transition-colors line-clamp-2">
              {post.title}
            </h3>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              <span>By</span>
              <span className="font-medium text-foreground">{post.ownerName}</span>
              <span className="text-[10px] uppercase tracking-wider bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded-full font-semibold">
                {post.ownerKind}
              </span>
            </p>
          </div>
          {typeof post.matchScore === "number" ? (
            <Badge 
              variant={isHighMatch ? "default" : "secondary"} 
              className={cn(
                "shrink-0 shadow-sm",
                isHighMatch && "bg-gradient-to-r from-primary to-primary/80"
              )}
            >
              {Math.round(post.matchScore * 100)}% match
            </Badge>
          ) : null}
        </div>

        {post.body && (
          <p className="line-clamp-2 text-sm text-muted-foreground/90 leading-relaxed">
            {post.body}
          </p>
        )}

        <div className="flex flex-col mt-auto pt-2">
          <div className="flex items-center justify-between">
            {post.tags.length > 0 ? (
              <ul className="flex flex-wrap gap-2">
                {post.tags.slice(0, 3).map((tag, i) => (
                  <li key={`${tag}-${i}`}>
                    <Badge variant="outline" className="bg-background/80 text-xs font-normal border-muted-foreground/20">
                      {tag}
                    </Badge>
                  </li>
                ))}
                {post.tags.length > 3 && (
                  <Badge variant="outline" className="bg-background/80 text-xs font-normal border-muted-foreground/20">
                    +{post.tags.length - 3}
                  </Badge>
                )}
              </ul>
            ) : <div />}
            
            <div className="flex items-center gap-1 text-sm font-semibold text-primary opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0">
              Read <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}