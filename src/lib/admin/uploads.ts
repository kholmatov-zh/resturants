import "server-only";
import sharp from "sharp";
import { validImageSignature } from "@/lib/restaurant/image-validation";
import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
export class ImageInputError extends Error {}
export async function uploadImage(
  client: SupabaseClient,
  restaurantId: string,
  file: FormDataEntryValue | null,
) {
  if (!(file instanceof File) || file.size === 0) return null;
  if (file.size > 5 * 1024 * 1024)
    throw new ImageInputError("Размер изображения должен быть не больше 5 МБ.");
  const bytes = Buffer.from(await file.arrayBuffer());
  if (!validImageSignature(bytes, file.type))
    throw new ImageInputError(
      "Загрузите настоящее изображение JPG, PNG или WebP.",
    );
  let optimized: Buffer;
  try {
    optimized = await sharp(bytes, {
      limitInputPixels: 40000000,
      animated: false,
    })
      .rotate()
      .resize(1600, 1600, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
  } catch {
    throw new ImageInputError(
      "Не удалось прочитать изображение. Попробуйте другой файл.",
    );
  }
  const path = `${restaurantId}/${randomUUID()}.webp`;
  const { error } = await client.storage
    .from("restaurant-images")
    .upload(path, optimized, { contentType: "image/webp", upsert: false });
  if (error)
    throw new ImageInputError(
      "Не удалось загрузить изображение. Проверьте Storage и права доступа.",
    );
  return path;
}
export async function removeUnusedImage(
  client: SupabaseClient,
  path: string | null,
) {
  if (!path) return true;
  const [restaurants, items] = await Promise.all([
    client
      .from("restaurants")
      .select("id")
      .or(`logo_path.eq.${path},cover_path.eq.${path}`)
      .limit(1),
    client.from("menu_items").select("id").eq("image_path", path).limit(1),
  ]);
  if (restaurants.error || items.error) return false;
  if (restaurants.data.length || items.data.length) return true;
  const { error } = await client.storage
    .from("restaurant-images")
    .remove([path]);
  return !error;
}
