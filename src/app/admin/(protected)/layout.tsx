import Link from "next/link";
import { requireAdmin } from "@/lib/auth/admin";
import { logout } from "./actions";
export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link href="/" className="brand">
          Dasturxon.
        </Link>
        <p>Панель владельца</p>
        <nav aria-label="Административная навигация">
          <Link href="/admin">Обзор</Link>
          <Link href="/admin/restaurants">Рестораны</Link>
          <Link href="/admin/leads">Заявки</Link>
          <Link href="/admin/settings">Контакты и документы</Link>
          <Link href="/demo">Посмотреть демо ↗</Link>
        </nav>
        <form action={logout}>
          <button className="button button-secondary">Выйти</button>
        </form>
      </aside>
      <main className="admin-content">{children}</main>
    </div>
  );
}
