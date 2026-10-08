"use client";
import { useState } from "react";
import type { CategoryRecord, ItemRecord } from "@/lib/restaurant/records";
import {
  EditorForm,
  Field,
  TranslationFields,
  Toggle,
  ImageUpload,
} from "./editor-fields";
import {
  saveCategory,
  deleteCategory,
  saveItem,
  bulkItems,
} from "@/app/admin/(protected)/restaurants/editor-actions";
export function MenuEditor({
  restaurantId,
  categories,
  items,
}: {
  restaurantId: string;
  categories: CategoryRecord[];
  items: ItemRecord[];
}) {
  const [selected, setSelected] = useState<string[]>([]);
  function itemFields(item?: ItemRecord) {
    return (
      <>
        <input type="hidden" name="restaurant_id" value={restaurantId} />
        <input type="hidden" name="id" value={item?.id ?? ""} />
        <TranslationFields
          name="name"
          label="Название блюда"
          value={item?.name}
          required
        />
        <TranslationFields
          name="description"
          label="Описание блюда"
          value={item?.description}
          textarea
        />
        <div className="editor-two-columns">
          <label className="editor-field">
            Категория
            <select
              name="category_id"
              defaultValue={item?.category_id ?? categories[0]?.id}
              required
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name.ru}
                  {c.is_visible ? "" : " (скрыта)"}
                </option>
              ))}
            </select>
          </label>
          <Field
            name="price"
            label="Цена, сум"
            type="number"
            value={item?.price ?? ""}
            required
          />
          <Field
            name="sort_order"
            label="Порядок блюда"
            type="number"
            value={item?.sort_order ?? items.length}
          />
        </div>
        <div className="editor-toggles">
          <Toggle
            name="is_available"
            label="Есть в наличии"
            checked={item?.is_available ?? true}
          />
          <Toggle
            name="is_visible"
            label="Показывать в меню"
            checked={item?.is_visible ?? true}
          />
          <Toggle
            name="is_archived"
            label="В архиве"
            checked={item?.is_archived ?? false}
          />
        </div>
        <ImageUpload
          name="image"
          label="Фотография блюда"
          current={item?.image_path ? "/media/" + item.image_path : null}
        />
      </>
    );
  }
  return (
    <>
      <section className="admin-panel">
        <h2>Категории</h2>
        <details className="editor-details">
          <summary>Добавить категорию</summary>
          <EditorForm action={saveCategory} submit="Добавить категорию">
            <input type="hidden" name="restaurant_id" value={restaurantId} />
            <TranslationFields
              name="name"
              label="Название категории"
              required
            />
            <Field
              name="sort_order"
              label="Порядок категории"
              type="number"
              value={categories.length}
            />
            <Toggle name="is_visible" label="Показывать категорию" checked />
          </EditorForm>
        </details>
        {categories.map((c) => (
          <details className="editor-details" key={c.id}>
            <summary>
              {c.name.ru} · {c.is_visible ? "видна" : "скрыта"}
            </summary>
            <EditorForm action={saveCategory}>
              <input type="hidden" name="restaurant_id" value={restaurantId} />
              <input type="hidden" name="id" value={c.id} />
              <TranslationFields
                name="name"
                label="Название категории"
                value={c.name}
                required
              />
              <Field
                name="sort_order"
                label="Порядок категории"
                type="number"
                value={c.sort_order}
              />
              <Toggle
                name="is_visible"
                label="Показывать категорию"
                checked={c.is_visible}
              />
            </EditorForm>
            <EditorForm
              action={deleteCategory}
              submit="Удалить категорию"
              confirm="Удалить категорию? Если в ней остались блюда, операция будет отклонена."
            >
              <input type="hidden" name="restaurant_id" value={restaurantId} />
              <input type="hidden" name="id" value={c.id} />
            </EditorForm>
          </details>
        ))}
      </section>
      <section className="admin-panel">
        <h2>Блюда</h2>
        {!categories.length ? (
          <p>Сначала добавьте категорию.</p>
        ) : (
          <details className="editor-details">
            <summary>Добавить блюдо</summary>
            <EditorForm action={saveItem} submit="Добавить блюдо">
              {itemFields()}
            </EditorForm>
          </details>
        )}
        {items.length > 0 && (
          <div className="bulk-editor">
            <p>Массовые операции · выбрано {selected.length}</p>
            <EditorForm
              action={bulkItems}
              submit="Применить к выбранным"
              confirm="Применить операцию ко всем выбранным блюдам?"
            >
              <input type="hidden" name="restaurant_id" value={restaurantId} />
              {selected.map((id) => (
                <input key={id} type="hidden" name="item_ids" value={id} />
              ))}
              <label className="editor-field">
                Операция
                <select name="operation">
                  <option value="hide">Скрыть</option>
                  <option value="show">Показать</option>
                  <option value="unavailable">Нет в наличии</option>
                  <option value="available">Есть в наличии</option>
                  <option value="archive">Архивировать</option>
                  <option value="restore">Вернуть из архива</option>
                </select>
              </label>
            </EditorForm>
          </div>
        )}
        {items.map((item) => (
          <div className="editor-item" key={item.id}>
            <label className="editor-toggle">
              <input
                type="checkbox"
                checked={selected.includes(item.id)}
                onChange={(e) =>
                  setSelected(
                    e.target.checked
                      ? [...selected, item.id]
                      : selected.filter((id) => id !== item.id),
                  )
                }
              />
              Выбрать {item.name.ru}
            </label>
            <details className="editor-details">
              <summary>
                {item.name.ru} · {item.price} сум{" "}
                {item.is_archived
                  ? "· архив"
                  : !item.is_visible
                    ? "· скрыто"
                    : !item.is_available
                      ? "· нет в наличии"
                      : ""}
              </summary>
              <EditorForm action={saveItem}>{itemFields(item)}</EditorForm>
            </details>
          </div>
        ))}
      </section>
    </>
  );
}
