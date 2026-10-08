import Link from "next/link";
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
      <div className="admin-section-heading">
        <h1>Рестораны</h1>
        <Link className="button button-primary" href="/admin/restaurants/new">
          Создать ресторан
        </Link>
      </div>
      <div className="admin-panel">
        {data.length ? (
          <ul className="admin-record-list">
            {data.map((r) => (
              <li key={r.id}>
                <Link
                  className="editor-record-link"
                  href={`/admin/restaurants/${r.id}`}
                >
                  <strong>{r.name}</strong>
                  <span>Редактировать →</span>
                </Link>
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
            Ресторанов пока нет. Создайте первый ресторан — он сохранится как
            черновик.
          </p>
        )}
      </div>
    </>
  );
}
