"use client";
import { useEffect, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import {
  ArrowUpRight,
  ArrowRight,
  Check,
  ChevronDown,
  Coffee,
  Globe2,
  Menu,
  Palette,
  Phone,
  QrCode,
  RefreshCw,
  Smartphone,
  Utensils,
  X,
} from "lucide-react";
import { dictionaries, type Locale } from "@/lib/i18n/dictionaries";
import { platform } from "@/config/platform";
import { buttonVariants } from "@/components/ui/button";
import { Modal } from "@/components/ui/dialog";
const anchors = ["features", "examples", "process", "pricing", "contact"];
const featureIcons = [QrCode, Smartphone, Palette, RefreshCw, Utensils, Phone];
function subscribe(callback: () => void) {
  window.addEventListener("dasturxon-locale", callback);
  return () => window.removeEventListener("dasturxon-locale", callback);
}
function snapshot(): Locale {
  try {
    return localStorage.getItem("dasturxon-locale") === "ru" ? "ru" : "uz";
  } catch {
    return "uz";
  }
}
function serverSnapshot(): Locale {
  return "uz";
}
export function Landing() {
  const locale = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const t = dictionaries[locale];
  const [mobileOpen, setMobileOpen] = useState(false);
  const [preview, setPreview] = useState<number | null>(null);
  const [privacy, setPrivacy] = useState(false);
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  function changeLocale(next: Locale) {
    try {
      localStorage.setItem("dasturxon-locale", next);
    } catch {}
    window.dispatchEvent(new Event("dasturxon-locale"));
  }
  return (
    <>
      <a className="skip-link" href="#main">
        {t.skip}
      </a>
      <header className="site-header">
        <div className="container header-inner">
          <a className="brand" href="#">
            <span className="brand-icon">
              <Utensils size={21} />
            </span>
            {platform.name}
            <span className="brand-dot">.</span>
          </a>
          <nav className="desktop-nav" aria-label={t.menuLabel}>
            {t.nav.slice(0, 4).map((text, i) => (
              <a href={`#${anchors[i]}`} key={text}>
                {text}
              </a>
            ))}
          </nav>
          <div className="header-actions">
            <div
              className="language-picker"
              role="group"
              aria-label={t.language}
            >
              {(["uz", "ru"] as Locale[]).map((lang) => (
                <button
                  key={lang}
                  aria-pressed={locale === lang}
                  onClick={() => changeLocale(lang)}
                >
                  {lang.toUpperCase()}
                </button>
              ))}
            </div>
            <a className="header-cta" href="#contact">
              {t.order}
              <ArrowUpRight size={16} />
            </a>
            <button
              className="mobile-toggle"
              aria-expanded={mobileOpen}
              aria-controls="mobile-navigation"
              aria-label={mobileOpen ? t.close : t.menuLabel}
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
        {mobileOpen && (
          <nav id="mobile-navigation" className="mobile-nav">
            {t.nav.map((text, i) => (
              <a
                key={text}
                href={`#${anchors[i]}`}
                onClick={() => setMobileOpen(false)}
              >
                {text}
              </a>
            ))}
          </nav>
        )}
      </header>
      <main id="main">
        <section className="hero">
          <div className="container hero-grid">
            <div className="hero-copy">
              <p className="pill">
                <span />
                {t.badge}
              </p>
              <h1>
                {t.title}
                <br />
                <em>{t.accent}</em>
                <br />
                {t.titleEnd}
              </h1>
              <p className="hero-description">{t.subtitle}</p>
              <div className="hero-buttons">
                <a href="#examples" className={buttonVariants()}>
                  {t.view}
                  <ArrowUpRight size={19} />
                </a>
                <a
                  href="#contact"
                  className={buttonVariants({ variant: "secondary" })}
                >
                  {t.order}
                </a>
              </div>
              <div className="hero-checks">
                <span>
                  <Check size={15} />
                  {t.noApp}
                </span>
                <span>
                  <Check size={15} />
                  {t.mobile}
                </span>
              </div>
            </div>
            <div className="hero-art">
              <div className="art-orbit orbit-one" />
              <div className="art-orbit orbit-two" />
              <span className="art-spark">✳</span>
              <div className="phone">
                <div className="phone-notch" />
                <div className="phone-cover">
                  <span>{t.phoneTag}</span>
                  <h2>
                    {t.phoneName}
                    <span>✳</span>
                  </h2>
                  <p>{t.phoneDesc}</p>
                </div>
                <div className="phone-body">
                  <div className="phone-categories">
                    {t.phoneCats.map((cat, i) => (
                      <span className={i === 0 ? "active" : ""} key={cat}>
                        {cat}
                      </span>
                    ))}
                  </div>
                  <div className="food-picture">
                    <Image
                      src="/plov.svg"
                      alt=""
                      width={480}
                      height={340}
                      priority
                    />
                    <span>01</span>
                  </div>
                  <div className="phone-dish">
                    <h3>{t.dish}</h3>
                    <p>{t.dishDesc}</p>
                    <strong>
                      45 000 <small>{t.currency}</small>
                    </strong>
                  </div>
                  <div className="phone-note">{t.phoneBottom}</div>
                </div>
                <div className="phone-home" />
              </div>
              <div className="scan-note">
                <div className="scan-icon">
                  <Smartphone size={29} />
                  <span>↗</span>
                </div>
                <div>
                  <strong>{t.floatingTitle}</strong>
                  <p>{t.floatingDesc}</p>
                </div>
              </div>
              <span className="art-caption">
                {t.sample} · {platform.name}
              </span>
            </div>
          </div>
        </section>
        <section id="features" className="section features-section">
          <div className="container">
            <div className="section-heading">
              <p className="eyebrow">{t.featuresEyebrow}</p>
              <h2>{t.featuresTitle}</h2>
              <p>{t.featuresSubtitle}</p>
            </div>
            <div className="feature-grid">
              {t.features.map(([title, description], i) => {
                const Icon = featureIcons[i];
                return (
                  <article className="feature" key={title}>
                    <div className="feature-icon">
                      <Icon size={24} strokeWidth={1.6} />
                    </div>
                    <h3>{title}</h3>
                    <p>{description}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
        <section id="examples" className="section examples-section">
          <div className="container">
            <div className="section-heading">
              <p className="eyebrow">{t.examplesEyebrow}</p>
              <h2>{t.examplesTitle}</h2>
              <p>{t.examplesSubtitle}</p>
            </div>
            <div className="example-grid">
              {["Chinor", "KUN Coffee", "Olova"].map((name, i) => (
                <article className={`example-card theme-${i}`} key={name}>
                  <div className="example-visual">
                    <span className="sample-label">{t.sample}</span>
                    <div className="mini-menu">
                      <span>{t.exampleTypes[i]}</span>
                      <h3>{name}</h3>
                      <div className="mini-divider" />
                      {i === 0 ? (
                        <Image
                          src="/plov.svg"
                          alt=""
                          width={260}
                          height={185}
                        />
                      ) : i === 1 ? (
                        <Coffee size={92} strokeWidth={1} />
                      ) : (
                        <Utensils size={92} strokeWidth={1} />
                      )}
                      <div className="mini-lines">
                        <i />
                        <i />
                        <i />
                      </div>
                    </div>
                  </div>
                  <div className="example-copy">
                    <div>
                      <h3>{name}</h3>
                      <p>{t.exampleNotes[i]}</p>
                    </div>
                    <button
                      aria-label={`${t.preview}: ${name}`}
                      onClick={() => setPreview(i)}
                    >
                      <ArrowUpRight size={24} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
        <section id="process" className="section">
          <div className="container process-grid">
            <div className="section-heading">
              <p className="eyebrow">{t.processEyebrow}</p>
              <h2>{t.processTitle}</h2>
              <div className="process-decoration">
                <Utensils size={42} strokeWidth={1.2} />
                <span>→</span>
                <Smartphone size={48} strokeWidth={1.2} />
              </div>
            </div>
            <div className="steps">
              {t.steps.map(([title, text], i) => (
                <article className="step" key={title}>
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
        <section id="pricing" className="section pricing-section">
          <div className="container pricing-grid">
            <div className="section-heading">
              <p className="eyebrow">{t.pricingEyebrow}</p>
              <h2>{t.pricingTitle}</h2>
              <p>{t.priceDesc}</p>
            </div>
            <article className="pricing-card">
              <div className="plan-label">
                <span>{t.plan}</span>
                <Globe2 size={22} />
              </div>
              <h3>
                {platform.priceUZS === null
                  ? t.pricePending
                  : `${new Intl.NumberFormat(locale === "uz" ? "uz-UZ" : "ru-RU").format(platform.priceUZS)} ${t.currency}`}
              </h3>
              <ul>
                {t.included.map((item) => (
                  <li key={item}>
                    <Check size={18} />
                    {item}
                  </li>
                ))}
              </ul>
              <a href="#contact" className={buttonVariants()}>
                {t.order}
                <ArrowRight size={18} />
              </a>
              <p className="pricing-terms">{t.terms}</p>
            </article>
          </div>
        </section>
        <section className="section faq-section">
          <div className="container faq-grid">
            <h2>{t.faqTitle}</h2>
            <div>
              {t.faq.map(([question, answer]) => (
                <details key={question}>
                  <summary>
                    {question}
                    <ChevronDown size={20} />
                  </summary>
                  <p>{answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
        <section id="contact" className="contact-section">
          <div className="container contact-inner">
            <p className="eyebrow">{t.contactEyebrow}</p>
            <h2>{t.contactTitle}</h2>
            <p>{t.contactDesc}</p>
            <div className="contact-links">
              {platform.telegramUrl && (
                <a
                  className={buttonVariants({ variant: "light" })}
                  href={platform.telegramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Telegram
                  <ArrowUpRight size={18} />
                </a>
              )}
              {platform.email && (
                <a
                  className={buttonVariants({ variant: "light" })}
                  href={`mailto:${platform.email}`}
                >
                  {platform.email}
                  <ArrowUpRight size={18} />
                </a>
              )}
              {!platform.telegramUrl && !platform.email && (
                <p className="contact-pending">{t.contactPending}</p>
              )}
            </div>
            <span className="contact-star" aria-hidden="true">
              ✳
            </span>
          </div>
        </section>
      </main>
      <footer>
        <div className="container footer-inner">
          <div>
            <a className="brand" href="#">
              {platform.name}
              <span className="brand-dot">.</span>
            </a>
            <p>{t.footerDesc}</p>
          </div>
          <div className="footer-right">
            <button onClick={() => setPrivacy(true)}>{t.privacy}</button>
            <p>
              © {new Date().getFullYear()} {platform.name}. {t.rights}
            </p>
          </div>
        </div>
      </footer>
      <Modal
        open={preview !== null}
        onOpenChange={(open) => {
          if (!open) setPreview(null);
        }}
        title={
          preview === null
            ? t.sample
            : ["Chinor", "KUN Coffee", "Olova"][preview]
        }
        closeLabel={t.close}
      >
        <p>{t.previewNote}</p>
        {preview !== null && (
          <div className={`preview-panel theme-${preview}`}>
            <p>{t.exampleTypes[preview]}</p>
            {preview === 0 ? (
              <Image src="/plov.svg" alt="" width={480} height={340} />
            ) : preview === 1 ? (
              <Coffee size={100} />
            ) : (
              <Utensils size={100} />
            )}
            <p>{t.exampleNotes[preview]}</p>
          </div>
        )}
      </Modal>
      <Modal
        open={privacy}
        onOpenChange={setPrivacy}
        title={t.privacyTitle}
        closeLabel={t.close}
      >
        <p>{t.privacyText}</p>
      </Modal>
    </>
  );
}
