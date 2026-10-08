import "server-only";
import { redirect } from "next/navigation";
import { getSupabaseConfiguration } from "@/lib/supabase/config";
import { serverSupabase } from "@/lib/supabase/server";
export async function requireAdmin() {
  if (!getSupabaseConfiguration()) redirect("/admin/login");
  const supabase = await serverSupabase();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) redirect("/admin/login");
  const membership = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (membership.error)
    throw new Error(
      "Admin permissions could not be checked. Verify the database migration.",
    );
  if (!membership.data) redirect("/admin/login?denied=1");
  return { supabase, user };
}
