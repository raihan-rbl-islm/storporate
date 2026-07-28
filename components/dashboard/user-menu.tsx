import { getCurrentUser } from "@/lib/server/auth/current-user";
import { SignOutButton } from "@/components/auth/sign-out-button";

/**
 * Server component: renders the authenticated user's display name + a
 * sign-out button. Renders nothing for anonymous visitors so demo users
 * (which still rely on the legacy cookie flow) don't see it.
 */
export async function UserMenu() {
  const u = await getCurrentUser();
  if (u.kind === "anonymous") return null;
  return (
    <div
      className="text-muted-foreground flex items-center gap-3 text-xs"
      data-testid="user-menu"
    >
      <span className="hidden sm:inline" aria-label="Signed in as">
        {u.email ?? u.displayName}
      </span>
      <SignOutButton />
    </div>
  );
}

export default UserMenu;