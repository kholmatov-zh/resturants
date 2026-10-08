import Link from "next/link";
import { LoginForm } from "@/components/admin/login-form";
import { getSupabaseConfiguration } from "@/lib/supabase/config";
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ denied?: string }>;
}) {
  let ready = false;
  try {
    ready = !!getSupabaseConfiguration();
  } catch {}
  const { denied } = await searchParams;
  return (
    <main className="admin-login-page">
      <div className="admin-login-card">
        <Link href="/" className="brand">
          Dasturxon.
        </Link>
        <p className="eyebrow">ПАНЕЛЬ ВЛАДЕЛЬЦА</p>
        <h1>Управление меню</h1>
        <p>Вход только для разрешённых администраторов.</p>
        {denied && (
          <p className="admin-error" role="alert">
            У вашей учётной записи нет прав администратора.
          </p>
        )}
        {ready ? (
          <LoginForm />
        ) : (
          <div className="admin-setup">
            <h2>Подключите Supabase</h2>
            <p>
              Добавьте в <code>.env.local</code> адрес проекта и публичный ключ.
              Затем перезапустите сервер.
            </p>
            <pre>
              NEXT_PUBLIC_SUPABASE_URL=…{"\n"}
              NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=…
            </pre>
            <p>
              Создайте пользователя в Supabase Auth и добавьте его UUID в
              таблицу <code>admins</code>.
            </p>
            <a
              href="https://github.com/kholmatov-zh/resturants/blob/main/docs/SUPABASE_SETUP.md"
              target="_blank"
              rel="noopener noreferrer"
            >
              Инструкция настройки ↗
            </a>
          </div>
        )}
      </div>
    </main>
  );
}
