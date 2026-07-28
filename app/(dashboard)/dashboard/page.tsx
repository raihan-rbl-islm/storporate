import { redirect } from "next/navigation";
import {
  getCurrentPersona,
  hasOnboarded,
} from "@/lib/server/personas/current";

export default async function DashboardPage() {
  const current = await getCurrentPersona();

  if (!current) {
    redirect("/signin");
  }

  // First-run gate: if the persona row has never been edited
  // (updatedAt === createdAt), bounce the user into /onboarding.
  if (!hasOnboarded(current.row)) {
    redirect("/onboarding");
  }

  const role = current.role;

  if (role === "student") redirect("/dashboard/student");
  if (role === "club") redirect("/dashboard/clubs/dashboard");
  if (role === "corporate") redirect("/dashboard/corporate/dashboard");

}