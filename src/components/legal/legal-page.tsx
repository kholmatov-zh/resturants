"use client";
import Link from "next/link";
import { useLocale } from "@/lib/i18n/use-locale";
import type { LocalizedText } from "@/lib/restaurant/types";
export function LegalPage({
  kind,
  document,
}: {
  kind: "privacy" | "offer";
  document: {
    title: LocalizedText;
    content: LocalizedText;
    updated_at: string;
  } | null;
}) {
  const { locale, changeLocale } = useLocale();
  const t =
    locale === "ru"
      ? {
          back: "На главную",
          privacy: "Политика конфиденциальности",
          offer: "Публичная оферта",
          pending: "Документ ещё не опубликован.",
          note: "Условия услуги согласуются с исполнителем до начала работы. Публичного принятия оферты на этой странице пока нет.",
          updated: "Обновлено",
        }
      : {
          back: "Bosh sahifaga",
          privacy: "Maxfiylik siyosati",
          offer: "Ommaviy oferta",
          pending: "Hujjat hali e’lon qilinmagan.",
          note: "Xizmat shartlari ish boshlanishidan oldin ijrochi bilan kelishiladi. Bu sahifada ofertani qabul qilish hali yoqilmagan.",
          updated: "Yangilangan",
        };
  return (
    <main className="legal-page container">
      <header className="restaurant-topbar">
        <Link href="/">← {t.back}</Link>
        <div className="language-picker">
          {(["uz", "ru"] as const).map((lang) => (
            <button
              key={lang}
              aria-pressed={lang === locale}
              onClick={() => changeLocale(lang)}
            >
              {lang.toUpperCase()}
            </button>
          ))}
        </div>
      </header>
      <h1>{document?.title[locale] ?? t[kind]}</h1>
      {document ? (
        <>
          <p className="legal-date">
            {t.updated}: {document.updated_at.slice(0, 10)}
          </p>
          <div className="legal-content">
            {document.content[locale].split(/\n\s*\n/).map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
        </>
      ) : (
        <div className="admin-setup">
          <h2>{t.pending}</h2>
          <p>{t.note}</p>
        </div>
      )}
    </main>
  );
}
