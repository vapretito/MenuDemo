"use server";

import { redirect } from "next/navigation";
import { createBackofficeSession, getBackofficeCredentials } from "@/lib/backoffice-auth";

export type LoginState = {
  error: string | null;
};

export async function loginAction(_: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const expected = getBackofficeCredentials();

  if (email !== expected.email || password !== expected.password) {
    return { error: "Credenciales invalidas para el backoffice." };
  }

  await createBackofficeSession();
  redirect("/backoffice");
}

export async function logoutAction() {
  const { clearBackofficeSession } = await import("@/lib/backoffice-auth");
  await clearBackofficeSession();
  redirect("/backoffice/login");
}
