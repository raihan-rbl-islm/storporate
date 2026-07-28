import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatInDhaka } from "@/lib/format/datetime";

export interface EventForCard {
  slug: string;
  title: string;
  startsAt: Date | string;
  ownerKind: "club" | "corporate";
  ownerName: string;
  tags: string[];
  matchScore?: number;
  isVirtual?: boolean;
}

export function EventCard({ event }: { event: EventForCard }) {
  return (
    <Card className="transition hover:ring-foreground/20">
      <Link
        href={`/events/${event.slug}`}
        prefetch={false}
        className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl"
      >
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="line-clamp-2">{event.title}</CardTitle>
            {typeof event.matchScore === "number" ? (
              <Badge variant="secondary" className="shrink-0">
                {Math.round(event.matchScore * 100)}% match
              </Badge>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground">
            from <span className="font-medium">{event.ownerName}</span>
            {" · "}
            <span className="capitalize">{event.ownerKind}</span>
          </p>
        </CardHeader>
        <CardContent className="grid gap-3">
          <p className="text-sm text-muted-foreground">
            {formatInDhaka(event.startsAt)}
            {event.isVirtual ? " · Online" : ""}
          </p>
          {event.tags.length > 0 ? (
            <ul className="flex flex-wrap gap-1.5">
              {event.tags.slice(0, 5).map((tag, i) => (
                <li key={`${tag}-${i}`}>
                  <Badge variant="outline">{tag}</Badge>
                </li>
              ))}
            </ul>
          ) : null}
        </CardContent>
      </Link>
    </Card>
  );
}
