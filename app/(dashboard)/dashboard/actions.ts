"use server";

// `setRole` (and the demo-cookie role switcher UI) were removed in
// Phase 8 cleanup: every real, registered user has a single role bound
// at onboarding time via Supabase auth, so the switcher was confusing
// dead UI for the supported path. Demo-cookie visitors still resolve
// a default persona via `getDefaultPersonaForRole` in the persona
// helpers, but cannot switch roles from the dashboard header.
//
// This file is intentionally empty of exported actions. Leaving the
// "use server" directive in place preserves the file's status as a
// server module for any future role-related action.
export {};