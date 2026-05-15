"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/backoffice/login/actions";

const initialState = {
  error: null,
};

export function BackofficeLoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="authForm">
      <label>
        <span>Email</span>
        <input defaultValue="admin@menui.oi" name="email" type="email" />
      </label>
      <label>
        <span>Password</span>
        <input defaultValue="Menui2026!" name="password" type="password" />
      </label>
      {state.error ? <p className="authError">{state.error}</p> : null}
      <button className="primaryButton" disabled={isPending} type="submit">
        {isPending ? "Ingresando..." : "Ingresar al backoffice"}
      </button>
    </form>
  );
}
