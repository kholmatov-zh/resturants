import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/admin";
import { uuid } from "@/lib/restaurant/validation";
import { RestaurantEditor } from "@/components/admin/restaurant-editor";
import { MenuEditor } from "@/components/admin/menu-editor";
import type {
  RestaurantRecord,
  CategoryRecord,
  ItemRecord,
} from "@/lib/restaurant/records";
export default async function EditRestaurant({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { supabase } = await requireAdmin();
  const { id } = await params;
  if (!uuid.safeParse(id).success) notFound();
  const [restaurant, categories, items] = await Promise.all([
    supabase.from("restaurants").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("categories")
      .select("*")
      .eq("restaurant_id", id)
      .order("sort_order"),
    supabase
      .from("menu_items")
      .select("*")
      .eq("restaurant_id", id)
      .order("sort_order"),
  ]);
  if (restaurant.error || categories.error || items.error)
    throw new Error("Editor data unavailable.");
  if (!restaurant.data) notFound();
  return (
    <>
      <p className="eyebrow">РЕДАКТОР МЕНЮ</p>
      <h1>{restaurant.data.name}</h1>
      {restaurant.data.status === "published" && (
        <Link
          className="button button-secondary"
          href={`/r/${restaurant.data.slug}`}
          target="_blank"
        >
          Открыть публичное меню ↗
        </Link>
      )}
      <RestaurantEditor restaurant={restaurant.data as RestaurantRecord} />
      <MenuEditor
        key={id}
        restaurantId={id}
        categories={categories.data as CategoryRecord[]}
        items={items.data as ItemRecord[]}
      />
    </>
  );
}
