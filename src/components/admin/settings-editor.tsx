"use client";
import { EditorForm, Field, TranslationFields, Toggle } from "./editor-fields";
import {
  saveSettings,
  saveDocument,
} from "@/app/admin/(protected)/settings/actions";
import type { LocalizedText } from "@/lib/restaurant/types";
export type SettingsRecord = {
  brand_name: string;
  telegram_url: string | null;
  email: string | null;
  phone: string | null;
  price_uzs: number | null;
  service_terms: LocalizedText;
  executor_name: string;
  executor_status: string;
  executor_address: string;
  executor_registration: string;
};
export type LegalRecord = {
  kind: "privacy" | "offer";
  title: LocalizedText;
  content: LocalizedText;
  is_published: boolean;
};
export function SettingsEditor({
  settings,
  documents,
}: {
  settings: SettingsRecord;
  documents: LegalRecord[];
}) {
  return (
    <>
      <section className="admin-panel">
        <h2>Контакты и условия услуги</h2>
        <EditorForm action={saveSettings}>
          <div className="editor-two-columns">
            <Field
              name="brand_name"
              label="Название платформы"
              value={settings.brand_name}
              required
            />
            <Field
              name="telegram_url"
              label="Telegram (https://t.me/username)"
              value={settings.telegram_url}
              type="url"
            />
            <Field
              name="email"
              label="Email"
              value={settings.email}
              type="email"
            />
            <Field
              name="phone"
              label="Телефон (необязательно)"
              value={settings.phone}
              type="tel"
            />
            <Field
              name="price_uzs"
              label="Стоимость, сум (пусто — договорная)"
              value={settings.price_uzs}
              type="number"
            />
          </div>
          <TranslationFields
            name="service_terms"
            label="Условия размещения и обновлений"
            value={settings.service_terms}
            textarea
          />
          <h3>Данные исполнителя</h3>
          <Field
            name="executor_name"
            label="Имя или название исполнителя"
            value={settings.executor_name}
          />
          <Field
            name="executor_status"
            label="Правовой статус (физлицо, ИП, организация)"
            value={settings.executor_status}
          />
          <Field
            name="executor_address"
            label="Адрес исполнителя"
            value={settings.executor_address}
          />
          <Field
            name="executor_registration"
            label="Регистрационные реквизиты (при наличии)"
            value={settings.executor_registration}
          />
        </EditorForm>
      </section>
      <section className="admin-panel">
        <h2>Юридические документы</h2>
        <p>
          Тексты публикуются отдельно. Проверьте, что они описывают вашу услугу,
          согласованные условия и фактическую обработку данных. Черновики
          посетителям недоступны.
        </p>
        {documents.map((doc) => (
          <details className="editor-details" key={doc.kind}>
            <summary>
              {doc.title.ru} · {doc.is_published ? "опубликована" : "черновик"}
            </summary>
            <EditorForm
              action={saveDocument}
              confirm="Сохранить документ с выбранным статусом публикации?"
            >
              <input name="kind" type="hidden" value={doc.kind} />
              <div className="editor-two-columns">
                {(["uz", "ru"] as const).map((lang) => (
                  <label className="editor-field" key={lang}>
                    Полный текст · {lang === "uz" ? "O‘zbekcha" : "Русский"}
                    <textarea
                      name={"content_" + lang}
                      defaultValue={doc.content[lang]}
                      rows={14}
                      maxLength={50000}
                    />
                  </label>
                ))}
              </div>
              <Toggle
                name="is_published"
                label="Опубликовать документ"
                checked={doc.is_published}
              />
            </EditorForm>
          </details>
        ))}
      </section>
    </>
  );
}
