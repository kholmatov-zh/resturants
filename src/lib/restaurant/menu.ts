import type { Locale } from "@/lib/i18n/dictionaries";
import type { RestaurantMenu } from "./types";
/** Pure filtering: no per-keystroke requests and no cross-restaurant/category leakage. */
export function visibleMenu(
  menu: RestaurantMenu,
  locale: Locale,
  categoryId: string,
  query: string,
) {
  const categories = menu.categories
    .filter((c) => c.isVisible)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const allowed = new Set(categories.map((c) => c.id));
  const term = query.trim().normalize("NFKC").toLocaleLowerCase();
  const items = menu.items
    .filter(
      (item) =>
        item.restaurantId === menu.id &&
        allowed.has(item.categoryId) &&
        item.isVisible &&
        !item.isArchived &&
        (categoryId === "all" || categoryId === item.categoryId) &&
        (!term ||
          Object.values(item.name).some((name) =>
            name.normalize("NFKC").toLocaleLowerCase().includes(term),
          )),
    )
    .sort((a, b) => a.sortOrder - b.sortOrder);
  return { categories, items, locale };
}
