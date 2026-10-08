"use client";
import { useActionState, useEffect, useState, useRef } from "react";
import Image from "next/image";
import type { LocalizedText } from "@/lib/restaurant/types";
import type { EditorState } from "@/app/admin/(protected)/restaurants/editor-actions";
export function EditorForm({
  action,
  children,
  submit = "Сохранить",
  confirm,
}: {
  action: (state: EditorState, form: FormData) => Promise<EditorState>;
  children: React.ReactNode;
  submit?: string;
  confirm?: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const formRef = useRef<HTMLFormElement>(null);
  const saved = useRef<
    {
      element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
      value: string;
      checked: boolean;
    }[]
  >([]);
  useEffect(() => {
    if (state.error)
      queueMicrotask(() =>
        saved.current.forEach(({ element, value, checked }) => {
          if (
            element instanceof HTMLInputElement &&
            ["checkbox", "radio"].includes(element.type)
          )
            element.checked = checked;
          else if (!(
            element instanceof HTMLInputElement && element.type === "file"
          ))
            element.value = value;
        }),
      );
  }, [state]);
  return (
    <form
      ref={formRef}
      action={formAction}
      className="editor-form"
      onSubmit={(e) => {
        if (confirm && !window.confirm(confirm)) {
          e.preventDefault();
          return;
        }
        saved.current = Array.from(e.currentTarget.elements)
          .filter(
            (
              element,
            ): element is
              HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement =>
              element instanceof HTMLInputElement ||
              element instanceof HTMLTextAreaElement ||
              element instanceof HTMLSelectElement,
          )
          .map((element) => ({
            element,
            value: element.value,
            checked:
              element instanceof HTMLInputElement ? element.checked : false,
          }));
      }}
    >
      {children}
      <div className="editor-submit">
        <button className="button button-primary" disabled={pending}>
          {pending ? "Сохраняем…" : submit}
        </button>
        {state.error && (
          <p className="admin-error" role="alert">
            {state.error}
          </p>
        )}
        {state.message && (
          <p className="editor-success" role="status">
            {state.message}
          </p>
        )}
      </div>
    </form>
  );
}
export function Field({
  name,
  label,
  value = "",
  type = "text",
  required = false,
  maxLength = 2000,
  readOnly = false,
}: {
  name: string;
  label: string;
  value?: string | number | null;
  type?: string;
  required?: boolean;
  maxLength?: number;
  readOnly?: boolean;
}) {
  return (
    <label className="editor-field">
      {label}
      <input
        name={name}
        defaultValue={value ?? ""}
        type={type}
        required={required}
        maxLength={maxLength}
        readOnly={readOnly}
        min={type === "number" ? 0 : undefined}
        step={type === "number" ? 1 : undefined}
      />
    </label>
  );
}
export function TranslationFields({
  name,
  label,
  value,
  textarea = false,
  required = false,
}: {
  name: string;
  label: string;
  value?: LocalizedText;
  textarea?: boolean;
  required?: boolean;
}) {
  return (
    <div className="editor-two-columns">
      {(["uz", "ru"] as const).map((lang) => (
        <label className="editor-field" key={lang}>
          {label} · {lang === "uz" ? "O‘zbekcha" : "Русский"}
          {textarea ? (
            <textarea
              name={name + "_" + lang}
              defaultValue={value?.[lang] ?? ""}
              rows={3}
              maxLength={2000}
              required={required}
            />
          ) : (
            <input
              name={name + "_" + lang}
              defaultValue={value?.[lang] ?? ""}
              maxLength={160}
              required={required}
            />
          )}
        </label>
      ))}
    </div>
  );
}
export function Toggle({
  name,
  label,
  checked = false,
}: {
  name: string;
  label: string;
  checked?: boolean;
}) {
  return (
    <label className="editor-toggle">
      <input name={name} type="checkbox" defaultChecked={checked} />
      {label}
    </label>
  );
}
export function ImageUpload({
  name,
  label,
  current,
}: {
  name: string;
  label: string;
  current?: string | null;
}) {
  const [preview, setPreview] = useState<string | null>(null),
    [error, setError] = useState("");
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );
  return (
    <div className="editor-image">
      <label className="editor-field">
        {label}
        <input
          name={name}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => {
            const selected = e.target.files?.[0];
            if (selected && selected.size > 5 * 1024 * 1024) {
              setError("Файл больше 5 МБ.");
              e.target.value = "";
              setPreview(null);
              return;
            }
            setError("");
            setPreview(selected ? URL.createObjectURL(selected) : null);
          }}
        />
      </label>
      <p className="editor-hint">
        JPG, PNG или WebP, до 5 МБ. Изображение будет оптимизировано.
      </p>
      {(preview || current) && (
        <Image
          unoptimized
          src={preview || current!}
          alt={label}
          width={240}
          height={150}
        />
      )}{" "}
      {current && (
        <Toggle name={"remove_" + name} label="Удалить текущее изображение" />
      )}
      {error && (
        <p role="alert" className="admin-error">
          {error}
        </p>
      )}
    </div>
  );
}
