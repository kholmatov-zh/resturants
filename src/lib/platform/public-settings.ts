import "server-only";
import { cache } from "react";
import { platform, type PlatformSettings } from "@/config/platform";
import { publicSupabase } from "@/lib/supabase/public";
export const getPublicSettings = cache(async (): Promise<PlatformSettings> => {
  const client = publicSupabase();
  if (!client) return platform;
  const { data, error } = await client
    .from("platform_settings")
    .select("*")
    .eq("id", true)
    .maybeSingle();
  if (error || !data) return platform;
  return {
    name: data.brand_name,
    priceUZS: data.price_uzs === null ? null : Number(data.price_uzs),
    telegramUrl: data.telegram_url,
    email: data.email,
    phone: data.phone,
    executorName: data.executor_name,
    executorStatus: data.executor_status,
    executorAddress: data.executor_address,
    executorRegistration: data.executor_registration,
    serviceTerms: data.service_terms,
  };
});
export async function getPublicDocument(kind: "privacy" | "offer") {
  const client = publicSupabase();
  if (!client) return null;
  const { data, error } = await client
    .from("legal_documents")
    .select("kind,title,content,updated_at")
    .eq("kind", kind)
    .eq("is_published", true)
    .maybeSingle();
  if (error) return null;
  return data;
}
