"use client";
import { useActionState } from "react";
import { login } from "@/app/admin/login/actions";
export function LoginForm() {
  const [state, action, pending] = useActionState(login, { error: null });
  return (
    <form action={action} className="admin-login-form">
      <label htmlFor="email">Email администратора</label>
      <input
        id="email"
        name="email"
        type="email"
        autoComplete="username"
        maxLength={254}
        required
      />
      <label htmlFor="password">Пароль</label>
      <input
        id="password"
        name="password"
        type="password"
        autoComplete="current-password"
        maxLength={256}
        required
      />
      {state.error && (
        <p className="admin-error" role="alert">
          {state.error}
        </p>
      )}
      <button className="button button-primary" disabled={pending}>
        {pending ? "Входим…" : "Войти в панель"}
      </button>
    </form>
  );
}
