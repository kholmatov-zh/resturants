"use client";
export default function AdminError({ reset }: { reset: () => void }) {
  return (
    <main className="admin-login-page">
      <div className="admin-login-card">
        <h1>Не удалось загрузить панель</h1>
        <p>
          Проверьте подключение Supabase, SQL-миграцию и права администратора.
          Рабочие данные не удалось получить.
        </p>
        <button className="button button-primary" onClick={reset}>
          Повторить
        </button>
      </div>
    </main>
  );
}
