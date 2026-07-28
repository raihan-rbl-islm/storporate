import Link from "next/link";
import { Calendar, MapPin, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatInDhaka } from "@/lib/format/datetime";
import { cn } from "@/lib/utils";

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
  const isHighMatch = event.matchScore && event.matchScore > 0.8;

  return (
    <Link
      href={`/events/${event.slug}`}
      prefetch={false}
      className="group block relative overflow-hidden rounded-2xl border bg-background/50 backdrop-blur-sm transition-all duration-500 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      {/* Subtle animated gradient border effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/10 opacity-0 transition-opacity duration-500 group-hover:opacity-100 pointer-events-none" />
      
      <div className="relative p-6 flex flex-col h-full gap-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <h3 className="font-semibold text-lg leading-tight group-hover:text-primary transition-colors line-clamp-2">
              {event.title}
            </h3>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              <span>By</span>
              <span className="font-medium text-foreground">{event.ownerName}</span>
              <span className="text-[10px] uppercase tracking-wider bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded-full font-semibold">
                {event.ownerKind}
              </span>
            </p>
          </div>
          {typeof event.matchScore === "number" ? (
            <Badge 
              variant={isHighMatch ? "default" : "secondary"} 
              className={cn(
                "shrink-0 shadow-sm",
                isHighMatch && "bg-gradient-to-r from-primary to-primary/80"
              )}
            >
              {Math.round(event.matchScore * 100)}% match
            </Badge>
          ) : null}
        </div>

        <div className="flex flex-col gap-2 mt-auto pt-2">
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground font-medium">
            <div className="flex items-center gap-1.5 bg-muted/40 px-2.5 py-1 rounded-md">
              <Calendar className="w-4 h-4 text-primary" />
              {formatInDhaka(event.startsAt)}
            </div>
            {event.isVirtual && (
              <div className="flex items-center gap-1.5 bg-muted/40 px-2.5 py-1 rounded-md">
                <MapPin className="w-4 h-4 text-primary" />
                Online Event
              </div>
            )}
          </div>

          <div className="flex items-center justify-between mt-2">
            {event.tags.length > 0 ? (
              <ul className="flex flex-wrap gap-2">
                {event.tags.slice(0, 3).map((tag, i) => (
                  <li key={`${tag}-${i}`}>
                    <Badge variant="outline" className="bg-background/80 text-xs font-normal border-muted-foreground/20">
                      {tag}
                    </Badge>
                  </li>
                ))}
                {event.tags.length > 3 && (
                  <Badge variant="outline" className="bg-background/80 text-xs font-normal border-muted-foreground/20">
                    +{event.tags.length - 3}
                  </Badge>
                )}
              </ul>
            ) : <div />}
            
            <div className="flex items-center gap-1 text-sm font-semibold text-primary opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0">
              Details <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
