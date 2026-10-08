"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/admin";
import { settingsSchema, readTranslation } from "@/lib/restaurant/validation";
import type { EditorState } from "@/app/admin/(protected)/restaurants/editor-actions";
export async function saveSettings(
  _previous: EditorState,
  form: FormData,
): Promise<EditorState> {
  const { supabase } = await requireAdmin();
  const parsed = settingsSchema.safeParse({
    ...Object.fromEntries(form.entries()),
    service_terms: readTranslation(form, "service_terms"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { data, error } = await supabase
    .from("platform_settings")
    .update(parsed.data)
    .eq("id", true)
    .select("id")
    .single();
  if (error || !data)
    return {
      error: "Не удалось сохранить настройки. Проверьте вторую миграцию.",
    };
  revalidatePath("/");
  revalidatePath("/admin/settings");
  return { message: "Контакты и условия сохранены." };
}
export async function saveDocument(
  _previous: EditorState,
  form: FormData,
): Promise<EditorState> {
  const { supabase } = await requireAdmin();
  const kind = String(form.get("kind"));
  if (!["privacy", "offer"].includes(kind))
    return { error: "Некорректный документ." };
  const parsed = z
    .object({
      content: z.object({
        uz: z.string().trim().max(50000),
        ru: z.string().trim().max(50000),
      }),
      is_published: z.boolean(),
    })
    .safeParse({
      content: readTranslation(form, "content"),
      is_published: form.has("is_published"),
    });
  if (!parsed.success) return { error: "Текст документа слишком длинный." };
  if (parsed.data.is_published) {
    if (
      Object.values(parsed.data.content).some((text) =>
        /\[[^\]]+\]|ЧЕРНОВИК|QORALAMA/.test(text),
      )
    )
      return {
        error:
          "Перед публикацией удалите пометку черновика и заполните все поля в квадратных скобках.",
      };
    if (
      parsed.data.content.uz.length < 100 ||
      parsed.data.content.ru.length < 100
    )
      return {
        error:
          "Для публикации заполните полный текст на двух языках (не менее 100 символов каждый).",
      };
    const settings = await supabase
      .from("platform_settings")
      .select("*")
      .eq("id", true)
      .single();
    if (
      settings.error ||
      !settings.data?.executor_name ||
      !settings.data?.executor_status ||
      !settings.data?.executor_address
    )
      return {
        error:
          "Перед публикацией укажите имя, правовой статус и адрес исполнителя в настройках.",
      };
    if (
      kind === "offer" &&
      (!settings.data.service_terms?.uz || !settings.data.service_terms?.ru)
    )
      return {
        error:
          "Укажите согласованные условия размещения и обновлений на двух языках.",
      };
  }
  const { data, error } = await supabase
    .from("legal_documents")
    .update(parsed.data)
    .eq("kind", kind)
    .select("kind")
    .single();
  if (error || !data) return { error: "Не удалось сохранить документ." };
  revalidatePath("/" + kind);
  revalidatePath("/admin/settings");
  return {
    message: parsed.data.is_published
      ? "Документ опубликован."
      : "Черновик сохранён. На публичной странице его текст не отображается.",
  };
}
