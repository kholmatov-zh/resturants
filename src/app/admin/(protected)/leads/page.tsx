import { requireAdmin } from "@/lib/auth/admin";
const statuses: Record<string, string> = {
  new: "Новая",
  contacted: "Связались",
  in_progress: "В работе",
  completed: "Завершена",
  rejected: "Отклонена",
};
export default async function LeadsPage() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("leads")
    .select("id,restaurant_name,contact_name,contact_value,city,status")
    .order("created_at", { ascending: false });
  if (error) throw new Error("Leads unavailable.");
  return (
    <>
      <p className="eyebrow">ЗАЯВКИ КЛИЕНТОВ</p>
      <h1>Заявки</h1>
      <div className="admin-panel">
        {data.length ? (
          <ul className="admin-record-list">
            {data.map((l) => (
              <li key={l.id}>
                <div>
                  <strong>{l.restaurant_name}</strong>
                  <p>
                    {l.contact_name} · {l.contact_value} · {l.city}
                  </p>
                </div>
                <span>{statuses[l.status]}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p>
            Заявок пока нет. Приём заявок на сайте будет добавлен на отдельном
            этапе.
          </p>
        )}
      </div>
    </>
  );
}
