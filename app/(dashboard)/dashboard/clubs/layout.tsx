import { requirePersona } from "@/lib/server/personas/guard";

export default async function ClubsDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePersona("club");
  return children;
}
