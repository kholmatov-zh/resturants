import { requireAdmin } from "@/lib/auth/admin";
import { RestaurantEditor } from "@/components/admin/restaurant-editor";
export default async function NewRestaurant() {
  await requireAdmin();
  return (
    <>
      <p className="eyebrow">РАБОЧАЯ БАЗА</p>
      <h1>Создать ресторан</h1>
      <RestaurantEditor />
    </>
  );
}
