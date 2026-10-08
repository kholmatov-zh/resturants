"use server";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/admin";
export async function logout() {
  const { supabase } = await requireAdmin();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
