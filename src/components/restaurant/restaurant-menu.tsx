"use client";
import { useState, type CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  Clock,
  Copy,
  MapPin,
  Phone,
  Search,
  Utensils,
  X,
} from "lucide-react";
import { useLocale } from "@/lib/i18n/use-locale";
import { menuDictionaries } from "@/lib/i18n/menu-dictionaries";
import { formatPriceUZS } from "@/lib/restaurant/price";
import { visibleMenu } from "@/lib/restaurant/menu";
import type { MenuItem, RestaurantMenu } from "@/lib/restaurant/types";
import { Modal } from "@/components/ui/dialog";
export function RestaurantMenuView({
  restaurant,
}: {
  restaurant: RestaurantMenu;
}) {
  const { locale, changeLocale } = useLocale();
  const t = menuDictionaries[locale];
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [contact, setContact] = useState<"order" | "reserve" | null>(null);
  const [photo, setPhoto] = useState<MenuItem | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">(
    "idle",
  );
  const { categories, items } = visibleMenu(
    restaurant,
    locale,
    category,
    query,
  );
  const phone = restaurant.isDemo ? null : restaurant.phone;
  const style = {
    "--restaurant-primary": restaurant.primaryColor,
    "--restaurant-secondary": restaurant.secondaryColor,
  } as CSSProperties;
  function openContact(mode: "order" | "reserve") {
    setCopyState("idle");
    setContact(mode);
  }
  async function copyPhone() {
    if (!phone) return;
    try {
      await navigator.clipboard.writeText(phone);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
  }
  return (
    <div className="restaurant-site" style={style}>
      <a className="skip-link" href="#restaurant-menu">
        {t.skip}
      </a>
      {restaurant.isDemo && (
        <div className="demo-banner">
          <span>{t.demo}</span>
          <p>{t.demoNotice}</p>
        </div>
      )}
      <header className="restaurant-topbar menu-container">
        <Link href={restaurant.isDemo ? "/demo" : "/"} className="menu-back">
          <ArrowLeft size={17} />
          {restaurant.isDemo ? t.back : t.home}
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
      <main>
        <section className="restaurant-hero menu-container">
          <div className="restaurant-intro">
            <span className="restaurant-logo" aria-hidden="true">
              {restaurant.logo ? (
                <Image
                  src={restaurant.logo}
                  unoptimized
                  alt=""
                  width={58}
                  height={58}
                />
              ) : (
                restaurant.monogram
              )}
            </span>
            <h1>{restaurant.name}</h1>
            <p className="restaurant-description">
              {restaurant.description[locale]}
            </p>
            <div className="restaurant-meta">
              <span>
                <MapPin size={16} />
                {restaurant.address[locale]}
              </span>
              <span>
                <Clock size={16} />
                {restaurant.workingHours[locale]}
              </span>
            </div>
            {phone && (
              <a
                className="restaurant-phone"
                href={`tel:${phone.replace(/[^+\d]/g, "")}`}
              >
                <Phone size={16} />
                {phone}
              </a>
            )}
            <div className="restaurant-actions">
              <button
                className="menu-button"
                onClick={() => openContact("order")}
              >
                <Phone size={17} />
                {t.order}
              </button>
              <button
                className="menu-button menu-button-outline"
                onClick={() => openContact("reserve")}
              >
                {t.reserve}
              </button>
            </div>
          </div>
          <div className="restaurant-cover">
            {restaurant.cover ? (
              <Image
                unoptimized={restaurant.cover.startsWith("/media/")}
                src={restaurant.cover}
                alt={restaurant.name}
                fill
                sizes="(max-width: 700px) 100vw, 50vw"
                priority
              />
            ) : (
              <div className="restaurant-cover-empty">
                <Utensils size={70} />
                <span>{restaurant.name}</span>
              </div>
            )}
            {restaurant.coverKind === "illustration" && (
              <span>{t.illustration}</span>
            )}
          </div>
        </section>
        <section id="restaurant-menu" className="menu-container menu-section">
          <div className="menu-heading">
            <div>
              <p className="eyebrow">{restaurant.name}</p>
              <h2>{t.menu}</h2>
            </div>
            <span aria-live="polite">
              {items.length} {t.found}
            </span>
          </div>
          <div className="menu-search">
            <Search size={20} />
            <input
              type="search"
              aria-label={t.search}
              placeholder={t.search}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button aria-label={t.clear} onClick={() => setQuery("")}>
                <X size={18} />
              </button>
            )}
          </div>
          <nav className="category-strip" aria-label={t.categories}>
            <button
              aria-pressed={category === "all"}
              onClick={() => setCategory("all")}
            >
              {t.all}
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                aria-pressed={category === c.id}
                onClick={() => setCategory(c.id)}
              >
                {c.name[locale]}
              </button>
            ))}
          </nav>
          {items.length === 0 ? (
            <div className="menu-empty">
              <Search size={34} />
              <h3>{t.empty}</h3>
              <p>{t.emptyHint}</p>
              <button
                className="menu-button"
                onClick={() => {
                  setCategory("all");
                  setQuery("");
                }}
              >
                {t.reset}
              </button>
            </div>
          ) : (
            <div className="dish-grid">
              {items.map((item) => (
                <article
                  className={`dish-card ${item.isAvailable ? "" : "dish-unavailable"} ${item.image ? "" : "dish-without-image"}`}
                  key={item.id}
                >
                  {item.image && (
                    <button
                      className="dish-image"
                      aria-label={`${t.enlarge}: ${item.name[locale]}`}
                      onClick={() => setPhoto(item)}
                    >
                      <Image
                        src={item.image}
                        unoptimized={item.image.startsWith("/media/")}
                        alt={item.name[locale]}
                        fill
                        sizes="(max-width: 600px) 100vw, (max-width: 1000px) 50vw, 33vw"
                      />
                      {item.imageKind === "illustration" && (
                        <span>{t.illustration}</span>
                      )}
                    </button>
                  )}
                  <div className="dish-details">
                    <span className="dish-category">
                      {
                        categories.find((c) => c.id === item.categoryId)?.name[
                          locale
                        ]
                      }
                    </span>
                    <h3>{item.name[locale]}</h3>
                    <p>{item.description[locale]}</p>
                    <div className="dish-price">
                      <strong>
                        {formatPriceUZS(item.price)} <small>{t.currency}</small>
                      </strong>
                      {!item.isAvailable && <span>{t.unavailable}</span>}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
        <section className="restaurant-contacts menu-container">
          <h2>{t.contacts}</h2>
          <div className="contact-info-grid">
            <div>
              <MapPin size={21} />
              <h3>{t.address}</h3>
              <p>{restaurant.address[locale]}</p>
              {restaurant.mapUrl && !restaurant.isDemo && (
                <a
                  href={restaurant.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t.route}
                  <ArrowUpRight size={16} />
                </a>
              )}
            </div>
            <div>
              <Clock size={21} />
              <h3>{t.hours}</h3>
              <p>{restaurant.workingHours[locale]}</p>
            </div>
            <div>
              <Phone size={21} />
              <h3>{t.phone}</h3>
              {phone ? (
                <a href={`tel:${phone.replace(/[^+\d]/g, "")}`}>{phone}</a>
              ) : (
                <p>{restaurant.isDemo ? t.demoPhoneLabel : t.noPhone}</p>
              )}
            </div>
          </div>
          {restaurant.isDemo && (
            <p className="demo-contact-note">{t.demoContact}</p>
          )}
          {!restaurant.isDemo &&
            (restaurant.instagramUrl || restaurant.telegramUrl) && (
              <div className="restaurant-socials">
                {restaurant.instagramUrl && (
                  <a
                    href={restaurant.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Instagram
                    <ArrowUpRight size={16} />
                  </a>
                )}
                {restaurant.telegramUrl && (
                  <a
                    href={restaurant.telegramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Telegram
                    <ArrowUpRight size={16} />
                  </a>
                )}
              </div>
            )}
        </section>
      </main>
      <footer className="restaurant-footer menu-container">
        <span>
          <Utensils size={15} />
          {restaurant.name}
        </span>
        {restaurant.isDemo && (
          <Link href="/">
            Dasturxon
            <ArrowUpRight size={15} />
          </Link>
        )}
      </footer>
      <Modal
        open={contact !== null}
        onOpenChange={(open) => {
          if (!open) setContact(null);
        }}
        title={contact === "reserve" ? t.reserveTitle : t.orderTitle}
        closeLabel={t.close}
      >
        <div className="phone-dialog">
          <p>
            {contact === "reserve" ? t.reserveDescription : t.orderDescription}
          </p>
          <h3>{restaurant.name}</h3>
          {phone ? (
            <>
              <p className="phone-number">{phone}</p>
              <a
                className="menu-button"
                href={`tel:${phone.replace(/[^+\d]/g, "")}`}
              >
                <Phone size={18} />
                {t.call}
              </a>
              <button
                className="menu-button menu-button-outline"
                onClick={copyPhone}
              >
                {copyState === "copied" ? (
                  <Check size={18} />
                ) : (
                  <Copy size={18} />
                )}{" "}
                {t.copy}
              </button>
              <p role="status">
                {copyState === "copied"
                  ? t.copied
                  : copyState === "failed"
                    ? t.copyFailed
                    : ""}
              </p>
            </>
          ) : (
            <p className="demo-phone-note">
              {restaurant.isDemo ? t.demoPhone : t.noPhone}
            </p>
          )}
        </div>
      </Modal>
      <Modal
        open={photo !== null}
        onOpenChange={(open) => {
          if (!open) setPhoto(null);
        }}
        title={photo?.name[locale] ?? t.menu}
        closeLabel={t.close}
      >
        {photo?.image && (
          <div className="enlarged-photo">
            <Image
              src={photo.image}
              unoptimized={photo.image.startsWith("/media/")}
              alt={photo.name[locale]}
              width={900}
              height={650}
            />
            {photo.imageKind === "illustration" && <p>{t.illustration}</p>}
          </div>
        )}
      </Modal>
    </div>
  );
}
