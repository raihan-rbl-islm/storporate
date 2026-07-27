import { redirect } from "next/navigation";
import { getServerSupabase } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${new URL("/auth/callback", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000")}/`,
      scopes: "email profile",
    },
  });
  if (error || !data?.url) {
    redirect("/demo?error=oauth_start_failed");
  }
  redirect(data.url);
}
