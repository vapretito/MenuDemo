import { NextRequest, NextResponse } from "next/server";
import { getRootDomain, normalizeHostname } from "@/lib/domain";
import { getRestaurantSlugFromHostname } from "@/lib/subdomain-routing";

const ROOT_DOMAIN = getRootDomain();

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
  const forwardedHost = request.headers.get("x-forwarded-host");
  const hostHeader = forwardedHost ?? request.headers.get("host");
  const rawHost =
    hostHeader?.split(",")[0]?.trim() ?? request.nextUrl.hostname ?? "";

  return normalizeHostname(rawHost);
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (RESERVED_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  const hostname = getHostname(request);
  const restaurantSlug =
    MAIN_HOSTS.has(hostname) ? null : getRestaurantSlugFromHostname(hostname);

  if (!restaurantSlug) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();

  if (pathname === "/") {
    url.pathname = `/menu/${restaurantSlug}`;
    return NextResponse.rewrite(url);
  }

  if (pathname === "/login") {
    url.pathname = `/restaurant/${restaurantSlug}/login`;
    return NextResponse.rewrite(url);
  }

  if (pathname === "/admin") {
    url.pathname = `/restaurant/${restaurantSlug}/admin`;
    return NextResponse.rewrite(url);
  }

  if (pathname.startsWith("/admin/")) {
    url.pathname = `/restaurant/${restaurantSlug}${pathname}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)"],
};
