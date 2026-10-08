"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { serverSupabase } from "@/lib/supabase/server";
import { getSupabaseConfiguration } from "@/lib/supabase/config";
export type LoginState = { error: string | null };
const schema = z.object({
  email: z.email().max(254),
  password: z.string().min(1).max(256),
});
export async function login(
  _previous: LoginState,
  form: FormData,
): Promise<LoginState> {
  const credentials = schema.safeParse({
    email: form.get("email"),
    password: form.get("password"),
  });
  if (!credentials.success) return { error: "Проверьте email и пароль." };
  try {
    if (!getSupabaseConfiguration())
      return { error: "Сначала настройте подключение Supabase." };
    const supabase = await serverSupabase();
    const { data, error } = await supabase.auth.signInWithPassword(
      credentials.data,
    );
    if (error || !data.user)
      return {
        error: "Не удалось войти. Проверьте данные или попробуйте позже.",
      };
    const membership = await supabase
      .from("admins")
      .select("user_id")
      .eq("user_id", data.user.id)
      .maybeSingle();
    if (membership.error || !membership.data) {
      await supabase.auth.signOut();
      return {
        error: membership.error
          ? "Не удалось проверить права. Проверьте SQL-миграцию Supabase."
          : "У этой учётной записи нет прав администратора.",
      };
    }
  } catch {
    return {
      error:
        "Не удалось подключиться к Supabase. Проверьте настройки и доступ к сети.",
    };
  }
  redirect("/admin");
}
