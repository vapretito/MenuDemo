import { headers } from "next/headers";
import { getRootDomain, normalizeHostname } from "@/lib/domain";

function getMainHosts() {
  const rootDomain = getRootDomain();

  return new Set([
    "localhost",
    "127.0.0.1",
    rootDomain,
    `www.${rootDomain}`,
  ]);
}

export function getRestaurantSlugFromHostname(hostname: string) {
  const normalizedHostname = normalizeHostname(hostname);
  const rootDomain = getRootDomain();

  if (!normalizedHostname || getMainHosts().has(normalizedHostname)) {
    return null;
  }

  if (normalizedHostname.endsWith(`.${rootDomain}`)) {
    const subdomain = normalizedHostname.replace(`.${rootDomain}`, "");
    return subdomain.split(".")[0] || null;
  }

  if (normalizedHostname.endsWith(".localhost")) {
    const subdomain = normalizedHostname.replace(".localhost", "");
    return subdomain.split(".")[0] || null;
  }

  return null;
}

export async function getRestaurantSlugFromRequestHeaders() {
  const requestHeaders = await headers();
  const hostHeader =
    requestHeaders.get("x-forwarded-host") ??
    requestHeaders.get("host") ??
    "";

  const hostname = hostHeader.split(",")[0]?.trim() ?? "";

  return getRestaurantSlugFromHostname(hostname);
}
