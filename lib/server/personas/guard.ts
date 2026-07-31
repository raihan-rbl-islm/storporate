import { redirect } from "next/navigation";
import { getCurrentPersona } from "./current";
import type { PersonaRole } from "@/data/personas";

/**
 * Lightweight route guard for server components and actions.
 * Enforces that the user has an active persona, optionally restricting by role.
 * 
 * @param allowedRoles - A single role or array of roles allowed to pass. If omitted, any valid persona passes.
 * @param redirectTo - Path to redirect unauthenticated users to (default: "/signin").
 * @returns The authenticated persona object.
 */

type CurrentPersona = NonNullable<Awaited<ReturnType<typeof getCurrentPersona>>>;

export async function requirePersona(): Promise<CurrentPersona>;
export async function requirePersona<T extends PersonaRole>(
  allowedRoles: T,
  redirectTo?: string
): Promise<Extract<CurrentPersona, { kind: T }>>;
export async function requirePersona<T extends PersonaRole[]>(
  allowedRoles: T,
  redirectTo?: string
): Promise<Extract<CurrentPersona, { kind: T[number] }>>;
export async function requirePersona(
  allowedRoles?: PersonaRole | PersonaRole[],
  redirectTo = "/signin"
): Promise<CurrentPersona> {
  const current = await getCurrentPersona();
  
  if (!current) {
    redirect(redirectTo);
  }
  
  if (allowedRoles) {
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    if (!roles.includes(current.kind)) {
      // If they have a valid persona but wrong role, bounce them to their own dashboard
      redirect("/dashboard");
    }
  }
  
  return current;
}
