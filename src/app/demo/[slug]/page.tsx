import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDemoRestaurant, demoRestaurants } from "@/demo/restaurants";
import { RestaurantMenuView } from "@/components/restaurant/restaurant-menu";
type Props = { params: Promise<{ slug: string }> };
export function generateStaticParams() {
  return demoRestaurants.map(({ slug }) => ({ slug }));
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const restaurant = getDemoRestaurant((await params).slug);
  return {
    title: restaurant
      ? `${restaurant.name} — demo menu | Dasturxon`
      : "Menu topilmadi",
    robots: { index: false, follow: false },
    openGraph: {
      title: restaurant?.name ?? "Dasturxon",
      description: restaurant?.description.uz,
      type: "website",
    },
  };
}
export default async function DemoRestaurantPage({ params }: Props) {
  const restaurant = getDemoRestaurant((await params).slug);
  if (!restaurant) notFound();
  return <RestaurantMenuView restaurant={restaurant} />;
}
