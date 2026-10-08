import type { LocalizedText } from "./types";
export type RestaurantRecord = {
  id: string;
  name: string;
  slug: string;
  description: LocalizedText;
  logo_path: string | null;
  cover_path: string | null;
  primary_color: string;
  secondary_color: string;
  phone: string | null;
  address: LocalizedText;
  working_hours: LocalizedText;
  map_url: string | null;
  instagram_url: string | null;
  telegram_url: string | null;
  status: "draft" | "published" | "archived";
  updated_at: string;
};
export type CategoryRecord = {
  id: string;
  restaurant_id: string;
  name: LocalizedText;
  sort_order: number;
  is_visible: boolean;
};
export type ItemRecord = {
  id: string;
  restaurant_id: string;
  category_id: string;
  name: LocalizedText;
  description: LocalizedText;
  price: number;
  image_path: string | null;
  is_available: boolean;
  is_visible: boolean;
  is_archived: boolean;
  sort_order: number;
};
