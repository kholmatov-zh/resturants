import type { RestaurantRecord, CategoryRecord, ItemRecord } from "./records";
import type { RestaurantMenu } from "./types";
export function restaurantToMenu(
  r: RestaurantRecord,
  categories: CategoryRecord[],
  items: ItemRecord[],
): RestaurantMenu {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    description: r.description,
    address: r.address,
    workingHours: r.working_hours,
    phone: r.phone,
    mapUrl: r.map_url,
    instagramUrl: r.instagram_url ?? undefined,
    telegramUrl: r.telegram_url ?? undefined,
    primaryColor: r.primary_color,
    secondaryColor: r.secondary_color,
    monogram: r.name.slice(0, 2),
    cover: r.cover_path ? "/media/" + r.cover_path : "",
    logo: r.logo_path ? "/media/" + r.logo_path : undefined,
    coverKind: "photo",
    status: r.status,
    isDemo: false,
    categories: categories
      .filter((c) => c.restaurant_id === r.id)
      .map((c) => ({
        id: c.id,
        name: c.name,
        sortOrder: c.sort_order,
        isVisible: c.is_visible,
      })),
    items: items
      .filter((i) => i.restaurant_id === r.id)
      .map((i) => ({
        id: i.id,
        restaurantId: i.restaurant_id,
        categoryId: i.category_id,
        name: i.name,
        description: i.description,
        price: Number(i.price),
        image: i.image_path ? "/media/" + i.image_path : undefined,
        imageKind: "photo",
        isAvailable: i.is_available,
        isVisible: i.is_visible,
        isArchived: i.is_archived,
        sortOrder: i.sort_order,
      })),
  };
}
