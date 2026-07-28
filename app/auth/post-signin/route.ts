import { redirect } from "next/navigation";

import { getCurrentUser, upsertUserOnSignIn } from "@/lib/server/auth/current-user";
import { getCanonicalOrigin } from "@/lib/security/redirect";

export async function GET() {
  const current = await getCurrentUser();
  if (current.kind === "anonymous") {
    redirect("/signin");
  }
  await upsertUserOnSignIn({
    authUserId: current.authUserId,
    email: current.email,
    displayName: current.displayName,
  });

  const canonical = getCanonicalOrigin();
  if (current.kind === "needs-role") {
    redirect(`${canonical.origin}/onboarding/role`);
  }
  if (current.kind === "needs-onboarding") {
    redirect(`${canonical.origin}/onboarding/details`);
  }
  redirect(`${canonical.origin}/dashboard`);
}