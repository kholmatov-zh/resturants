import "server-only";
import { cache } from "react";
import { publicSupabase } from "@/lib/supabase/public";
import { restaurantToMenu } from "./adapter";
import type { RestaurantRecord, CategoryRecord, ItemRecord } from "./records";
export const getPublicRestaurant = cache(async (slug: string) => {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) || slug.length > 100) return null;
  const client = publicSupabase();
  if (!client) return null;
  const result = await client
    .from("restaurants")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (result.error) throw new Error("Public restaurant unavailable.");
  if (!result.data || result.data.status !== "published") return null;
  const id = result.data.id;
  const [categories, items] = await Promise.all([
    client
      .from("categories")
      .select("*")
      .eq("restaurant_id", id)
      .eq("is_visible", true)
      .order("sort_order"),
    client
      .from("menu_items")
      .select("*")
      .eq("restaurant_id", id)
      .eq("is_visible", true)
      .eq("is_archived", false)
      .order("sort_order"),
  ]);
  if (categories.error || items.error)
    throw new Error("Public menu unavailable.");
  return restaurantToMenu(
    result.data as RestaurantRecord,
    categories.data as CategoryRecord[],
    items.data as ItemRecord[],
  );
});
