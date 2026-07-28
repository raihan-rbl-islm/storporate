import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
  return (
    <Card className="transition hover:ring-foreground/20">
      <Link
        href={`/jobs/${job.slug}`}
        prefetch={false}
        className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl"
      >
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="line-clamp-2">{job.title}</CardTitle>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <Badge variant="secondary" className="whitespace-nowrap">
                {TYPE_LABEL[job.employmentType] ?? job.employmentType}
              </Badge>
              {typeof job.matchScore === "number" ? (
                <Badge variant="outline" className="whitespace-nowrap">
                  {Math.round(job.matchScore * 100)}% match
                </Badge>
              ) : null}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            at <span className="font-medium">{job.employerName}</span>
            {job.isOpen === false ? (
              <>
                {" · "}
                <span className="text-destructive">Closed</span>
              </>
            ) : null}
          </p>
        </CardHeader>
        <CardContent className="grid gap-3">
          <p className="text-sm text-muted-foreground">
            {job.isRemote ? "Remote" : job.locationLabel || "Location TBA"}
            {job.isRemote && job.locationLabel ? ` · ${job.locationLabel}` : ""}
          </p>
          {job.skills.length > 0 ? (
            <ul className="flex flex-wrap gap-1.5">
              {job.skills.slice(0, 6).map((skill, i) => (
                <li key={`${skill}-${i}`}>
                  <Badge variant="outline">{skill}</Badge>
                </li>
              ))}
            </ul>
          ) : null}
        </CardContent>
      </Link>
    </Card>
  );
}

export default JobCard;