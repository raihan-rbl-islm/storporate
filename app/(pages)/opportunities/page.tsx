import { getCurrentPersona } from "@/lib/server/personas/current";
import { getRankedJobs } from "@/lib/server/opportunities/ranked-jobs";
import { JobCard } from "@/components/opportunities/job-card";
import { Briefcase } from "lucide-react";

export const metadata = {
  title: "Opportunities",
};

export const dynamic = "force-dynamic";

export default async function OpportunitiesPage() {
  const persona = await getCurrentPersona();
  const studentId = persona?.kind === "student" ? persona.row.id : undefined;
  
  const jobs = await getRankedJobs(studentId, 50);

  return (
    <div className="flex flex-col gap-10 py-8 max-w-5xl mx-auto w-full px-4">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl mb-2">
          <Briefcase className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/60">
          Opportunities
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          {studentId 
            ? "AI-matched jobs and internships based on your skills, interests, and profile."
            : "Discover the latest open roles from top companies."}
        </p>
      </div>

      {jobs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {jobs.map((job, idx) => (
            <JobCard 
              key={`job-${job.item.id}-${idx}`} 
              job={{
                slug: job.item.slug,
                title: job.item.title,
                employerName: job.corporateName,
                employmentType: job.item.employmentType,
                locationLabel: job.item.locationLabel,
                isRemote: job.item.isRemote,
                skills: job.item.skills,
                isOpen: job.item.isOpen,
                matchScore: studentId ? job.score : undefined,
              }} 
            />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center rounded-3xl border-2 border-dashed bg-muted/20">
          <h3 className="text-xl font-semibold mb-2">No opportunities found</h3>
          <p className="text-muted-foreground">Check back later for new roles.</p>
        </div>
      )}
    </div>
  );
}
