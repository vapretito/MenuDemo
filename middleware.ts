import { NextRequest, NextResponse } from "next/server";

const ROOT_DOMAIN = (process.env.MENUI_ROOT_DOMAIN ?? "menui.online")
  .replace(/^https?:\/\//, "")
  .replace(/^www\./, "")
  .replace(/\/$/, "")
  .toLowerCase();

const RESERVED_PATHS = [
  "/api",
  "/_next",
  "/favicon.ico",
  "/manifest.json",
  "/sw.js",
];

const MAIN_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  ROOT_DOMAIN,
  `www.${ROOT_DOMAIN}`,
]);

function getHostname(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  return host.split(":")[0].toLowerCase();
}

function getRestaurantSlugFromHost(hostname: string) {
  if (MAIN_HOSTS.has(hostname)) {
    return null;
  }

  if (hostname.endsWith(`.${ROOT_DOMAIN}`)) {
    const subdomain = hostname.replace(`.${ROOT_DOMAIN}`, "");
    return subdomain.split(".")[0] || null;
  }

  if (hostname.endsWith(".localhost")) {
    const subdomain = hostname.replace(".localhost", "");
    return subdomain.split(".")[0] || null;
  }

  return null;
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (RESERVED_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  const hostname = getHostname(request);
  const restaurantSlug = getRestaurantSlugFromHost(hostname);

  if (!restaurantSlug) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();

  /**
   * Si por alguna razón el navegador terminó mostrando
   * /menu/[slug] en un subdominio, lo limpiamos y volvemos a "/".
   * La URL pública correcta debe ser:
   * https://nicolasito.menui.online/
   */
  if (pathname.startsWith("/menu/")) {
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  if (pathname === "/") {
    url.pathname = `/menu/${restaurantSlug}`;
    return NextResponse.rewrite(url);
  }

  if (pathname === "/login") {
    url.pathname = `/restaurant/${restaurantSlug}/login`;
    return NextResponse.rewrite(url);
  }

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    url.pathname = `/restaurant/${restaurantSlug}${pathname}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)"],
};