import Link from "next/link";
import { requireAdmin } from "@/lib/auth/admin";
export default async function Dashboard() {
  const { supabase } = await requireAdmin();
  const results = await Promise.all([
    supabase.from("restaurants").select("id", { count: "exact", head: true }),
    supabase
      .from("restaurants")
      .select("id", { count: "exact", head: true })
      .eq("status", "published"),
    supabase
      .from("restaurants")
      .select("id", { count: "exact", head: true })
      .eq("status", "draft"),
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("status", "new"),
    supabase
      .from("restaurants")
      .select("id,name,slug,status,updated_at")
      .order("updated_at", { ascending: false })
      .limit(5),
  ]);
  if (results.some((r) => r.error))
    throw new Error("Dashboard data unavailable.");
  const labels = [
    "Всего ресторанов",
    "Опубликовано",
    "Черновики",
    "Новые заявки",
  ];
  return (
    <>
      <p className="eyebrow">ПАНЕЛЬ ВЛАДЕЛЬЦА</p>
      <h1>Обзор платформы</h1>
      <div className="admin-stat-grid">
        {labels.map((label, i) => (
          <article key={label}>
            <p>{label}</p>
            <strong>{results[i].count}</strong>
          </article>
        ))}
      </div>
      <section className="admin-panel">
        <div className="admin-section-heading">
          <h2>Недавно обновлённые меню</h2>
          <Link href="/admin/restaurants">Все рестораны →</Link>
        </div>
        {results[4].data?.length ? (
          <ul className="admin-record-list">
            {results[4].data.map((r) => (
              <li key={r.id}>
                <span>{r.name}</span>
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
          <p>Ресторанов пока нет. Демо не входят в рабочую базу.</p>
        )}
      </section>
    </>
  );
}
