import { redirect } from "next/navigation";
import { Disclaimer } from "@/components/personas/disclaimer";
import {
  MobileSidebarTabs,
  RoleSidebar,
} from "@/components/dashboard/role-sidebar";
import { getCurrentPersona } from "@/lib/server/personas/current";
import { getCurrentUser } from "@/lib/server/auth/current-user";
import { getOverviewForCurrentPersona } from "@/lib/server/dashboard/overview";
import { GlobalNavbar } from "@/components/shared/global-navbar";

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

  const role = current.role;
  const personaId = current.row.id;

  const overview = await getOverviewForCurrentPersona();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <GlobalNavbar />
      
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:py-8 flex-1">
        <div className="flex flex-col gap-6">
          {children}
        </div>
      </main>

      <footer className="mt-auto border-t py-6 bg-muted/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 flex justify-center">
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