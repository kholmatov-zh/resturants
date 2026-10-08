import { requireAdmin } from "@/lib/auth/admin";
export default async function RestaurantsPage() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("restaurants")
    .select("id,name,slug,status")
    .order("created_at", { ascending: false });
  if (error) throw new Error("Restaurants unavailable.");
  return (
    <>
      <p className="eyebrow">РАБОЧАЯ БАЗА</p>
      <h1>Рестораны</h1>
      <div className="admin-panel">
        {data.length ? (
          <ul className="admin-record-list">
            {data.map((r) => (
              <li key={r.id}>
                <strong>{r.name}</strong>
                <span>
                  {r.status === "published"
                    ? "Опубликован"
                    : r.status === "draft"
                      ? "Черновик"
                      : "Архив"}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p>
            Ресторанов пока нет. Редактор ресторанов будет добавлен на следующем
            этапе.
          </p>
        )}
      </div>
    </>
  );
}
