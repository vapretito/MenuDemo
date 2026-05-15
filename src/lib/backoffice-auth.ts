import { cookies } from "next/headers";

const SESSION_COOKIE = "menui_backoffice_session";
const DEFAULT_EMAIL = "admin@menui.oi";
const DEFAULT_PASSWORD = "Menui2026!";

const getExpectedSessionValue = () =>
  process.env.SUPERADMIN_SESSION_TOKEN ?? "menui-backoffice-session";

export const getBackofficeCredentials = () => ({
  email: process.env.SUPERADMIN_EMAIL ?? DEFAULT_EMAIL,
  password: process.env.SUPERADMIN_PASSWORD ?? DEFAULT_PASSWORD,
});

export async function isBackofficeAuthenticated() {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value === getExpectedSessionValue();
}

export async function createBackofficeSession() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, getExpectedSessionValue(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export async function clearBackofficeSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
