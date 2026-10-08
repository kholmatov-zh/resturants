"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/admin";
import {
  restaurantSchema,
  categorySchema,
  itemSchema,
  readTranslation,
  uuid,
} from "@/lib/restaurant/validation";
import {
  uploadImage,
  removeUnusedImage,
  ImageInputError,
} from "@/lib/admin/uploads";
export type EditorState = { error?: string; message?: string };
function refresh(id: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/restaurants");
  revalidatePath(`/admin/restaurants/${id}`);
  revalidatePath("/r/[slug]", "page");
}
const text = (form: FormData, key: string) => String(form.get(key) ?? "");
export async function saveRestaurant(
  _state: EditorState,
  form: FormData,
): Promise<EditorState> {
  const { supabase } = await requireAdmin();
  const id = text(form, "id");
  if (id && !uuid.safeParse(id).success)
    return { error: "Некорректный ресторан." };
  const parsed = restaurantSchema.safeParse({
    name: text(form, "name"),
    slug: text(form, "slug"),
    description: readTranslation(form, "description"),
    address: readTranslation(form, "address"),
    working_hours: readTranslation(form, "working_hours"),
    primary_color: text(form, "primary_color"),
    secondary_color: text(form, "secondary_color"),
    phone: text(form, "phone"),
    map_url: text(form, "map_url"),
    instagram_url: text(form, "instagram_url"),
    telegram_url: text(form, "telegram_url"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (!id) {
    const { data, error } = await supabase
      .from("restaurants")
      .insert({ ...parsed.data, status: "draft" })
      .select("id")
      .single();
    if (error || !data)
      return {
        error:
          error?.code === "23505"
            ? "Этот адрес меню уже занят."
            : "Не удалось создать ресторан.",
      };
    refresh(data.id);
    redirect(`/admin/restaurants/${data.id}`);
  }
  const existing = await supabase
    .from("restaurants")
    .select("id,slug,logo_path,cover_path")
    .eq("id", id)
    .single();
  if (existing.error || !existing.data)
    return { error: "Ресторан не найден или недоступен." };
  if (existing.data.slug !== parsed.data.slug)
    return {
      error: "Постоянный адрес меню нельзя изменить. Можно изменить название.",
    };
  let newLogo: string | null = null,
    newCover: string | null = null;
  try {
    newLogo = await uploadImage(supabase, id, form.get("logo"));
    newCover = await uploadImage(supabase, id, form.get("cover"));
    const logo =
      newLogo ?? (form.has("remove_logo") ? null : existing.data.logo_path);
    const cover =
      newCover ?? (form.has("remove_cover") ? null : existing.data.cover_path);
    const { data, error } = await supabase
      .from("restaurants")
      .update({ ...parsed.data, logo_path: logo, cover_path: cover })
      .eq("id", id)
      .select("id")
      .single();
    if (error || !data) throw new Error();
    const clean = await Promise.all([
      existing.data.logo_path !== logo
        ? removeUnusedImage(supabase, existing.data.logo_path)
        : true,
      existing.data.cover_path !== cover
        ? removeUnusedImage(supabase, existing.data.cover_path)
        : true,
    ]);
    refresh(id);
    return {
      message: clean.every(Boolean)
        ? "Ресторан сохранён."
        : "Ресторан сохранён. Не удалось удалить старое изображение из Storage.",
    };
  } catch (error) {
    await Promise.all([
      removeUnusedImage(supabase, newLogo),
      removeUnusedImage(supabase, newCover),
    ]);
    return {
      error:
        error instanceof ImageInputError
          ? error.message
          : "Не удалось сохранить ресторан. Изменения не подтверждены.",
    };
  }
}
export async function changeRestaurantStatus(
  _state: EditorState,
  form: FormData,
): Promise<EditorState> {
  const { supabase } = await requireAdmin();
  const id = text(form, "restaurant_id"),
    status = text(form, "status");
  if (
    !uuid.safeParse(id).success ||
    !["draft", "published", "archived"].includes(status)
  )
    return { error: "Некорректные данные." };
  const { error } = await supabase.rpc("set_restaurant_status", {
    target_id: id,
    next_status: status,
  });
  if (error)
    return {
      error:
        error.code === "22023"
          ? "Для публикации заполните телефон, адрес и часы работы на двух языках, добавьте видимую категорию и блюдо."
          : "Не удалось изменить статус. Проверьте применение второй миграции.",
    };
  refresh(id);
  return {
    message:
      status === "published"
        ? "Меню опубликовано."
        : status === "draft"
          ? "Меню снято с публикации."
          : "Ресторан архивирован.",
  };
}
export async function saveCategory(
  _state: EditorState,
  form: FormData,
): Promise<EditorState> {
  const { supabase } = await requireAdmin();
  const restaurant_id = text(form, "restaurant_id"),
    id = text(form, "id");
  if (
    !uuid.safeParse(restaurant_id).success ||
    (id && !uuid.safeParse(id).success)
  )
    return { error: "Некорректные идентификаторы." };
  const parsed = categorySchema.safeParse({
    name: readTranslation(form, "name"),
    sort_order: form.get("sort_order"),
    is_visible: form.has("is_visible"),
  });
  if (!parsed.success)
    return { error: "Укажите название на двух языках и корректный порядок." };
  const query = id
    ? supabase
        .from("categories")
        .update(parsed.data)
        .eq("id", id)
        .eq("restaurant_id", restaurant_id)
    : supabase.from("categories").insert({ ...parsed.data, restaurant_id });
  const { data, error } = await query.select("id").single();
  if (error || !data) return { error: "Не удалось сохранить категорию." };
  refresh(restaurant_id);
  return { message: "Категория сохранена." };
}
export async function deleteCategory(
  _state: EditorState,
  form: FormData,
): Promise<EditorState> {
  const { supabase } = await requireAdmin();
  const restaurant_id = text(form, "restaurant_id"),
    id = text(form, "id");
  if (!uuid.safeParse(restaurant_id).success || !uuid.safeParse(id).success)
    return { error: "Некорректные данные." };
  const { data, error } = await supabase
    .from("categories")
    .delete()
    .eq("id", id)
    .eq("restaurant_id", restaurant_id)
    .select("id")
    .single();
  if (error || !data)
    return {
      error:
        error?.code === "23503"
          ? "Сначала перенесите все блюда этой категории, включая архивные, в другую категорию."
          : "Не удалось удалить категорию.",
    };
  refresh(restaurant_id);
  return { message: "Категория удалена." };
}
export async function saveItem(
  _state: EditorState,
  form: FormData,
): Promise<EditorState> {
  const { supabase } = await requireAdmin();
  const restaurant_id = text(form, "restaurant_id"),
    id = text(form, "id");
  if (
    !uuid.safeParse(restaurant_id).success ||
    (id && !uuid.safeParse(id).success)
  )
    return { error: "Некорректные идентификаторы." };
  const parsed = itemSchema.safeParse({
    category_id: form.get("category_id"),
    name: readTranslation(form, "name"),
    description: readTranslation(form, "description"),
    price: form.get("price"),
    sort_order: form.get("sort_order"),
    is_available: form.has("is_available"),
    is_visible: form.has("is_visible"),
    is_archived: form.has("is_archived"),
  });
  if (!parsed.success)
    return { error: "Проверьте названия, категорию, цену и порядок блюда." };
  const category = await supabase
    .from("categories")
    .select("id")
    .eq("id", parsed.data.category_id)
    .eq("restaurant_id", restaurant_id)
    .single();
  if (category.error || !category.data)
    return { error: "Категория должна принадлежать этому ресторану." };
  let previous: string | null = null;
  if (id) {
    const existing = await supabase
      .from("menu_items")
      .select("id,image_path")
      .eq("id", id)
      .eq("restaurant_id", restaurant_id)
      .single();
    if (existing.error || !existing.data) return { error: "Блюдо не найдено." };
    previous = existing.data.image_path;
  }
  let uploaded: string | null = null;
  try {
    uploaded = await uploadImage(supabase, restaurant_id, form.get("image"));
    const image_path = uploaded ?? (form.has("remove_image") ? null : previous);
    const values = { ...parsed.data, image_path };
    const query = id
      ? supabase
          .from("menu_items")
          .update(values)
          .eq("id", id)
          .eq("restaurant_id", restaurant_id)
      : supabase.from("menu_items").insert({ ...values, restaurant_id });
    const { data, error } = await query.select("id").single();
    if (error || !data) throw new Error();
    const clean =
      previous !== image_path
        ? await removeUnusedImage(supabase, previous)
        : true;
    refresh(restaurant_id);
    return {
      message: clean
        ? "Блюдо сохранено."
        : "Блюдо сохранено. Не удалось удалить старое изображение из Storage.",
    };
  } catch (error) {
    await removeUnusedImage(supabase, uploaded);
    return {
      error:
        error instanceof ImageInputError
          ? error.message
          : "Не удалось сохранить блюдо. Изменения не подтверждены.",
    };
  }
}
export async function bulkItems(
  _state: EditorState,
  form: FormData,
): Promise<EditorState> {
  const { supabase } = await requireAdmin();
  const restaurant_id = text(form, "restaurant_id"),
    operation = text(form, "operation"),
    ids = form.getAll("item_ids").map(String);
  if (
    !uuid.safeParse(restaurant_id).success ||
    !ids.length ||
    ids.length > 100 ||
    ids.some((id) => !uuid.safeParse(id).success) ||
    ![
      "show",
      "hide",
      "available",
      "unavailable",
      "archive",
      "restore",
    ].includes(operation)
  )
    return { error: "Выберите от 1 до 100 блюд и операцию." };
  const { error } = await supabase.rpc("bulk_menu_items", {
    target_restaurant: restaurant_id,
    item_ids: ids,
    operation,
  });
  if (error)
    return {
      error: "Операция не выполнена. Проверьте миграцию и выбранные блюда.",
    };
  refresh(restaurant_id);
  return { message: "Выбранные блюда обновлены." };
}
