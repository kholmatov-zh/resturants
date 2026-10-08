import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicRestaurant } from "@/lib/restaurant/public-menu";
import { RestaurantMenuView } from "@/components/restaurant/restaurant-menu";
export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const restaurant = await getPublicRestaurant((await params).slug);
  if (!restaurant)
    return { title: "Menu topilmadi", robots: { index: false, follow: false } };
  return {
    title: restaurant.name,
    description: restaurant.description.uz,
    openGraph: {
      title: restaurant.name,
      description: restaurant.description.uz,
      type: "website",
    },
  };
}
export default async function PublicRestaurantPage({ params }: Props) {
  const restaurant = await getPublicRestaurant((await params).slug);
  if (!restaurant) notFound();
  return <RestaurantMenuView restaurant={restaurant} />;
}
