import { z } from "zod";
export const uuid = z.uuid();
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => v || null);
const https = z
  .string()
  .trim()
  .max(2000)
  .refine(
    (v) =>
      !v ||
      (() => {
        try {
          const u = new URL(v);
          return u.protocol === "https:" && !u.username && !u.password;
        } catch {
          return false;
        }
      })(),
    "Используйте ссылку https://",
  )
  .transform((v) => v || null);
export const phone = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s()-]/g, ""))
  .refine(
    (v) => !v || /^\+[1-9]\d{7,14}$/.test(v),
    "Номер в международном формате: +998…",
  )
  .transform((v) => v || null);
export const translation = z.object({
  uz: z.string().trim().min(1).max(160),
  ru: z.string().trim().min(1).max(160),
});
export const description = z.object({
  uz: z.string().trim().max(2000),
  ru: z.string().trim().max(2000),
});
export const restaurantSchema = z.object({
  name: z.string().trim().min(1).max(160),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Только латиница, цифры и дефисы"),
  description,
  primary_color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  secondary_color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  phone,
  address: description,
  working_hours: description,
  map_url: https,
  instagram_url: https,
  telegram_url: https,
});
export const categorySchema = z.object({
  name: translation,
  sort_order: z.coerce.number().int().min(0).max(100000),
  is_visible: z.boolean(),
});
export const itemSchema = z.object({
  category_id: uuid,
  name: translation,
  description,
  price: z.preprocess(
    (v) => (v === "" || v === null ? undefined : v),
    z.coerce.number().int().min(0).max(9000000000000),
  ),
  sort_order: z.coerce.number().int().min(0).max(100000),
  is_available: z.boolean(),
  is_visible: z.boolean(),
  is_archived: z.boolean(),
});
export const settingsSchema = z.object({
  brand_name: z.string().trim().min(1).max(80),
  email: z
    .union([z.literal(""), z.email().max(254)])
    .transform((v) => v || null),
  phone,
  telegram_url: z
    .string()
    .trim()
    .refine(
      (v) => !v || /^https:\/\/t\.me\/[a-zA-Z0-9_]+$/.test(v),
      "Ссылка вида https://t.me/username",
    )
    .transform((v) => v || null),
  price_uzs: z
    .union([z.literal(""), z.coerce.number().int().min(0).max(9000000000000)])
    .transform((v) => (v === "" ? null : v)),
  service_terms: description,
  executor_name: z.string().trim().max(300),
  executor_status: z.string().trim().max(160),
  executor_address: z.string().trim().max(500),
  executor_registration: optionalText(500).transform((v) => v ?? ""),
});
export function readTranslation(form: FormData, field: string) {
  return {
    uz: String(form.get(field + "_uz") ?? ""),
    ru: String(form.get(field + "_ru") ?? ""),
  };
}
