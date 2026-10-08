import Link from "next/link";
export default function NotFound() {
  return (
    <main className="not-found">
      <p className="eyebrow">404</p>
      <h1>Sahifa topilmadi</h1>
      <p>Bu manzilda sahifa mavjud emas.</p>
      <Link className="button button-primary" href="/">
        Bosh sahifaga qaytish
      </Link>
    </main>
  );
}
