"use client";
import {
  EditorForm,
  Field,
  TranslationFields,
  ImageUpload,
} from "./editor-fields";
import {
  saveRestaurant,
  changeRestaurantStatus,
} from "@/app/admin/(protected)/restaurants/editor-actions";
import type { RestaurantRecord } from "@/lib/restaurant/records";
export function RestaurantEditor({
  restaurant,
}: {
  restaurant?: RestaurantRecord;
}) {
  return (
    <>
      <section className="admin-panel">
        <h2>{restaurant ? "Информация о ресторане" : "Новый ресторан"}</h2>
        <EditorForm
          action={saveRestaurant}
          submit={restaurant ? "Сохранить ресторан" : "Создать черновик"}
        >
          <input name="id" type="hidden" value={restaurant?.id ?? ""} />
          <div className="editor-two-columns">
            <Field
              name="name"
              label="Название"
              value={restaurant?.name}
              required
              maxLength={160}
            />
            <Field
              name="slug"
              label="Постоянный адрес меню (латиница)"
              value={restaurant?.slug}
              readOnly={!!restaurant}
              required
              maxLength={100}
            />
          </div>
          {restaurant && (
            <p className="editor-hint">
              Адрес /r/{restaurant.slug} постоянный: переименование ресторана
              его не меняет.
            </p>
          )}
          <TranslationFields
            name="description"
            label="Описание"
            value={restaurant?.description}
            textarea
          />
          <TranslationFields
            name="address"
            label="Адрес"
            value={restaurant?.address}
          />
          <TranslationFields
            name="working_hours"
            label="Часы работы"
            value={restaurant?.working_hours}
          />
          <div className="editor-two-columns">
            <Field
              name="phone"
              label="Телефон (+998…)"
              value={restaurant?.phone}
              type="tel"
            />
            <Field
              name="map_url"
              label="Ссылка на карту (https://)"
              value={restaurant?.map_url}
              type="url"
            />
            <Field
              name="telegram_url"
              label="Telegram (https://)"
              value={restaurant?.telegram_url}
              type="url"
            />
            <Field
              name="instagram_url"
              label="Instagram (https://)"
              value={restaurant?.instagram_url}
              type="url"
            />
            <Field
              name="primary_color"
              label="Основной цвет"
              type="color"
              value={restaurant?.primary_color ?? "#324b38"}
            />
            <Field
              name="secondary_color"
              label="Дополнительный цвет"
              type="color"
              value={restaurant?.secondary_color ?? "#e2e8d4"}
            />
          </div>
          {restaurant && (
            <div className="editor-two-columns">
              <ImageUpload
                name="logo"
                label="Логотип"
                current={
                  restaurant.logo_path ? "/media/" + restaurant.logo_path : null
                }
              />
              <ImageUpload
                name="cover"
                label="Обложка"
                current={
                  restaurant.cover_path
                    ? "/media/" + restaurant.cover_path
                    : null
                }
              />
            </div>
          )}
        </EditorForm>
      </section>
      {restaurant && (
        <section className="admin-panel">
          <h2>Публикация</h2>
          <p>
            Текущий статус:{" "}
            {restaurant.status === "published"
              ? "опубликован"
              : restaurant.status === "draft"
                ? "черновик"
                : "архив"}
            .
          </p>
          <p className="editor-hint">
            Для публикации нужны телефон, адрес, часы работы, видимая категория
            и блюдо. Черновики и архивы недоступны посетителям.
          </p>
          <EditorForm
            action={changeRestaurantStatus}
            submit="Изменить статус"
            confirm="Изменить доступность сайта ресторана для посетителей?"
          >
            <input type="hidden" name="restaurant_id" value={restaurant.id} />
            <label className="editor-field">
              Новый статус
              <select name="status" defaultValue={restaurant.status}>
                <option value="draft">Черновик — снять с публикации</option>
                <option value="published">Опубликовать</option>
                <option value="archived">Архив</option>
              </select>
            </label>
          </EditorForm>
        </section>
      )}
    </>
  );
}
