import { redirect } from "next/navigation";
import Link from "next/link";
import { Disclaimer } from "@/components/personas/disclaimer";
import {
  MobileSidebarTabs,
  RoleSidebar,
} from "@/components/dashboard/role-sidebar";
import { getCurrentPersona } from "@/lib/server/personas/current";
import { getCurrentUser } from "@/lib/server/auth/current-user";
import { getOverviewForCurrentPersona, AnyOverview } from "@/lib/server/dashboard/overview";
import { GlobalNavbar } from "@/components/shared/global-navbar";

function PriorityStrip({ overview }: { overview: AnyOverview }) {
  const alerts: Array<{ label: string; count: number; href: string }> = [];

  if (overview.kind === "student") {
    if (overview.totalMatches > 0) alerts.push({ label: "New Matches", count: overview.totalMatches, href: "/dashboard/matches" });
    if (overview.invitationsSent > 0) alerts.push({ label: "Outreach Sent", count: overview.invitationsSent, href: "/inbox" });
  } else if (overview.kind === "club") {
    if (overview.totalMatches > 0) alerts.push({ label: "Sponsor Matches", count: overview.totalMatches, href: "/dashboard/clubs/matches" });
    if (overview.invitationsSent > 0) alerts.push({ label: "Proposals Sent", count: overview.invitationsSent, href: "/inbox" });
  } else if (overview.kind === "corporate") {
    if (overview.openJobs > 0) alerts.push({ label: "Active Jobs", count: overview.openJobs, href: "/dashboard/corporate/dashboard#my-jobs" });
    if (overview.invitationsSent > 0) alerts.push({ label: "Pending Outreach", count: overview.invitationsSent, href: "/inbox" });
  }

  if (alerts.length === 0) return null;

  return (
    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
      {alerts.map((a, i) => (
        <Link 
          key={i} 
          href={a.href} 
          className="flex-shrink-0 flex items-center gap-3 bg-primary/5 text-foreground px-5 py-3.5 rounded-2xl border border-primary/10 hover:border-primary/30 hover:bg-primary/10 transition-colors shadow-sm"
        >
          <span className="bg-primary text-primary-foreground size-7 rounded-full flex items-center justify-center text-sm font-bold shadow-inner">
            {a.count}
          </span>
          <span className="font-semibold text-sm">{a.label}</span>
        </Link>
      ))}
    </div>
  );
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const u = await getCurrentUser();
  if (u.kind === "ready" || u.kind === "needs-onboarding") {
    if (!u.personaId) redirect("/onboarding/role");
    if (u.kind === "needs-onboarding") redirect("/onboarding/details");
  } else if (u.kind === "needs-role") {
    redirect("/onboarding/role");
  }

  const current = await getCurrentPersona();
  if (!current) {
    redirect("/signin");
  }


  const personaId = current.row.id;
  const overview = await getOverviewForCurrentPersona();

  if (!overview) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Error loading dashboard overview.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <GlobalNavbar />
      
      <div className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 py-6 lg:py-10 flex-1 flex flex-col lg:flex-row gap-8 lg:gap-12">
        {/* Sidebar Nav */}
        <aside className="lg:w-64 shrink-0 flex flex-col gap-6">
          <MobileSidebarTabs overview={overview} />
          <RoleSidebar overview={overview} className="sticky top-24" />
        </aside>

        {/* Main Canvas */}
        <main className="flex-1 flex flex-col gap-8 min-w-0">
          <PriorityStrip overview={overview} />
          
          <div className="bg-card/30 rounded-3xl border border-border/50 shadow-sm p-6 sm:p-8 lg:p-10">
            {children}
          </div>
        </main>
      </div>

      <footer className="mt-auto border-t py-8 bg-muted/20">
        <div className="mx-auto max-w-[1400px] px-6 flex justify-center">
          <Disclaimer />
        </div>
      </footer>

      {u.kind === "anonymous" ? (
        <span hidden data-persona-id={personaId} />
      ) : (
        <span
          hidden
          data-persona-id={personaId}
          data-auth-user-id={u.authUserId}
        />
      )}
    </div>
  );
}