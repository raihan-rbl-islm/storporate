import Link from "next/link";
import { Briefcase, MapPin, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface JobForCard {
  slug: string;
  title: string;
  employerName: string;
  employmentType: string;
  locationLabel: string;
  isRemote: boolean;
  skills: string[];
  matchScore?: number;
  isOpen?: boolean;
}

const TYPE_LABEL: Record<string, string> = {
  internship: "Internship",
  "full-time": "Full-time",
  contract: "Contract",
  research: "Research",
};

export function JobCard({ job }: { job: JobForCard }) {
  const isHighMatch = job.matchScore && job.matchScore > 0.8;

  return (
    <Link
      href={`/opportunities/${job.slug}`}
      prefetch={false}
      className="group block relative overflow-hidden rounded-2xl border bg-background/50 backdrop-blur-sm transition-all duration-500 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-transparent to-blue-500/10 opacity-0 transition-opacity duration-500 group-hover:opacity-100 pointer-events-none" />
      
      <div className="relative p-6 flex flex-col h-full gap-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <h3 className="font-semibold text-lg leading-tight group-hover:text-primary transition-colors line-clamp-2">
              {job.title}
            </h3>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              <span>At</span>
              <span className="font-medium text-foreground">{job.employerName}</span>
              {job.isOpen === false && (
                <span className="text-[10px] uppercase tracking-wider bg-destructive text-destructive-foreground px-1.5 py-0.5 rounded-full font-semibold">
                  Closed
                </span>
              )}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            {typeof job.matchScore === "number" ? (
              <Badge 
                variant={isHighMatch ? "default" : "secondary"} 
                className={cn(
                  "shadow-sm",
                  isHighMatch && "bg-gradient-to-r from-primary to-primary/80"
                )}
              >
                {Math.round(job.matchScore * 100)}% match
              </Badge>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-2 mt-auto pt-2">
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground font-medium">
            <div className="flex items-center gap-1.5 bg-muted/40 px-2.5 py-1 rounded-md">
              <Briefcase className="w-4 h-4 text-primary" />
              {TYPE_LABEL[job.employmentType] ?? job.employmentType}
            </div>
            <div className="flex items-center gap-1.5 bg-muted/40 px-2.5 py-1 rounded-md">
              <MapPin className="w-4 h-4 text-primary" />
              {job.isRemote ? "Remote" : job.locationLabel || "Location TBA"}
              {job.isRemote && job.locationLabel ? ` · ${job.locationLabel}` : ""}
            </div>
          </div>

          <div className="flex items-center justify-between mt-2">
            {job.skills.length > 0 ? (
              <ul className="flex flex-wrap gap-2">
                {job.skills.slice(0, 3).map((skill, i) => (
                  <li key={`${skill}-${i}`}>
                    <Badge variant="outline" className="bg-background/80 text-xs font-normal border-muted-foreground/20">
                      {skill}
                    </Badge>
                  </li>
                ))}
                {job.skills.length > 3 && (
                  <Badge variant="outline" className="bg-background/80 text-xs font-normal border-muted-foreground/20">
                    +{job.skills.length - 3}
                  </Badge>
                )}
              </ul>
            ) : <div />}
            
            <div className="flex items-center gap-1 text-sm font-semibold text-primary opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0">
              Apply <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default JobCard;