"use client";
export default function MenuError({ reset }: { reset: () => void }) {
  return (
    <main className="not-found">
      <h1>Menu vaqtincha ochilmadi</h1>
      <p>Iltimos, birozdan so‘ng yana urinib ko‘ring.</p>
      <button className="button button-primary" onClick={reset}>
        Qayta urinish
      </button>
    </main>
  );
}
