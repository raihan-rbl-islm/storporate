import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  // Strictly gated: production refuses, and the flag must be on.
  if (
    process.env.NODE_ENV === "production" ||
    process.env.ENABLE_DEMO_AUTH_DEV_LOGIN !== "true"
  ) {
    return NextResponse.redirect(
      new URL("/demo?error=test_mode_disabled", request.url),
    );
  }
  const store = await cookies();
  // Short TTL (1 hour) — this stub is for local exploration, not real auth.
  store.set("role", "student", {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    maxAge: 60 * 60,
  });
  store.set("personaId", "tasnim", {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    maxAge: 60 * 60,
  });
  return NextResponse.redirect(new URL("/dashboard", request.url));
}
