"use client";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { demoRestaurants } from "@/demo/restaurants";
import { useLocale } from "@/lib/i18n/use-locale";
import { menuDictionaries } from "@/lib/i18n/menu-dictionaries";
import type { CSSProperties } from "react";
export function DemoCatalogue() {
  const { locale, changeLocale } = useLocale();
  const t = menuDictionaries[locale];
  return (
    <div className="menu-container demo-catalogue">
      <header className="restaurant-topbar">
        <Link href="/" className="menu-back">
          <ArrowLeft size={17} />
          {t.home}
        </Link>
        <div className="language-picker" role="group" aria-label={t.language}>
          {(["uz", "ru"] as const).map((lang) => (
            <button
              key={lang}
              aria-pressed={locale === lang}
              onClick={() => changeLocale(lang)}
            >
              {lang.toUpperCase()}
            </button>
          ))}
        </div>
      </header>
      <p className="eyebrow">Dasturxon · {t.demo}</p>
      <h1>{t.catalogueTitle}</h1>
      <p className="demo-catalogue-intro">{t.catalogueDescription}</p>
      <div className="example-grid">
        {demoRestaurants.map((r) => (
          <article
            className="catalogue-card"
            key={r.id}
            style={{ "--restaurant-primary": r.primaryColor } as CSSProperties}
          >
            <div className="catalogue-image">
              <Image
                src={r.cover}
                alt={r.name}
                fill
                sizes="(max-width: 900px) 100vw, 33vw"
              />
              <span className="sample-label">{t.demo}</span>
            </div>
            <div className="catalogue-copy">
              <p className="eyebrow">
                {r.categories.length} · {t.categories}
              </p>
              <h2>{r.name}</h2>
              <p>{r.description[locale]}</p>
              <Link className="menu-button" href={`/demo/${r.slug}`}>
                {t.open}
                <ArrowUpRight size={17} />
              </Link>
            </div>
          </article>
        ))}
      </div>
      <p className="demo-contact-note">{t.demoNotice}</p>
    </div>
  );
}
