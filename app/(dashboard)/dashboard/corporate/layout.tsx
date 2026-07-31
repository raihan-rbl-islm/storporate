import { requirePersona } from "@/lib/server/personas/guard";

export default async function CorporateDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePersona("corporate");
  return children;
}
