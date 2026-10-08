import assert from "node:assert/strict";
import test from "node:test";
import { visibleMenu } from "../src/lib/restaurant/menu.ts";
import { formatPriceUZS } from "../src/lib/restaurant/price.ts";
import { demoRestaurants } from "../src/demo/restaurants.ts";
const restaurant = demoRestaurants[0];
test("search accepts Cyrillic, Latin, mixed case and surrounding spaces", () => {
  for (const query of ["ПЛОВ", "плов", "  Toshkent  "])
    assert.equal(
      visibleMenu(restaurant, "ru", "all", query).items[0]?.id,
      "plov",
    );
  assert.equal(visibleMenu(restaurant, "ru", "all", "unknown").items.length, 0);
});
test("category filtering intersects search", () => {
  assert.equal(visibleMenu(restaurant, "uz", "salads", "").items.length, 2);
  assert.equal(visibleMenu(restaurant, "uz", "salads", "плов").items.length, 0);
});
test("hidden/archived items, hidden categories and foreign restaurant data stay private", () => {
  const first = restaurant.items[0];
  const menu = {
    ...restaurant,
    categories: [
      ...restaurant.categories,
      {
        id: "hidden",
        name: { uz: "Secret", ru: "Secret" },
        isVisible: false,
        sortOrder: 10,
      },
    ],
    items: [
      ...restaurant.items,
      { ...first, id: "archived", isArchived: true },
      { ...first, id: "invisible", isVisible: false },
      { ...first, id: "other", restaurantId: "another-restaurant" },
      { ...first, id: "hidden-category", categoryId: "hidden" },
      { ...first, id: "unknown-category", categoryId: "unknown" },
    ],
  };
  assert.equal(
    visibleMenu(menu, "ru", "all", "").items.length,
    restaurant.items.length,
  );
});
test("unavailable dishes remain visible with their explicit availability status", () => {
  const items = visibleMenu(restaurant, "ru", "all", "лагман").items;
  assert.equal(items.length, 1);
  assert.equal(items[0].isAvailable, false);
});
test("category and item ordering are respected without mutating input", () => {
  const menu = {
    ...restaurant,
    items: [
      { ...restaurant.items[0], sortOrder: 4 },
      { ...restaurant.items[1], sortOrder: 2 },
    ],
  };
  assert.deepEqual(
    visibleMenu(menu, "uz", "all", "").items.map((i) => i.id),
    ["manti", "plov"],
  );
  assert.equal(menu.items[0].id, "plov");
});
test("UZS formatting is deterministic for SSR and browsers", () => {
  assert.equal(formatPriceUZS(45000), "45\u00a0000");
  assert.equal(formatPriceUZS(0), "0");
  assert.equal(formatPriceUZS(1000000), "1\u00a0000\u00a0000");
});

test('all demo menus have isolated, valid bilingual content and safe example contacts', () => {
  assert.equal(demoRestaurants.length,3);
  assert.equal(new Set(demoRestaurants.map(r=>r.slug)).size,3);
  for(const menu of demoRestaurants){
    assert.equal(menu.isDemo,true);assert.equal(menu.phone,null);assert.equal(menu.mapUrl,null);
    assert.ok(menu.items.length>=8);assert.ok(menu.categories.length>=4);
    assert.equal(new Set(menu.items.map(i=>i.id)).size,menu.items.length);
    for(const item of menu.items){
      assert.equal(item.restaurantId,menu.id);assert.ok(menu.categories.some(c=>c.id===item.categoryId));
      assert.ok(item.name.uz && item.name.ru && item.description.uz && item.description.ru);
      assert.ok(Number.isSafeInteger(item.price) && item.price>=0);
    }
  }
});
