import type { RestaurantAccessMode } from "@/types/platform";
import { getRootDomain } from "@/lib/domain";

type RestaurantUrlInput = {
  slug: string;
  subdomain: string;
  accessMode?: RestaurantAccessMode | null;
  groupSlug?: string | null;
};

const normalizeAccessMode = (
  accessMode?: RestaurantAccessMode | null
): RestaurantAccessMode =>
  accessMode === "container_path" ? "container_path" : "subdomain";

export function getRestaurantPublicPath({
  slug,
  accessMode,
  groupSlug,
}: Pick<RestaurantUrlInput, "slug" | "accessMode" | "groupSlug">) {
  if (normalizeAccessMode(accessMode) === "container_path") {
    return `/${groupSlug || "contenedores"}/${slug}/menu`;
  }

  return "/";
}

export function getRestaurantPublicUrl({
  slug,
  subdomain,
  accessMode,
}: RestaurantUrlInput) {
  if (normalizeAccessMode(accessMode) === "container_path") {
    return `https://${getRootDomain()}${getRestaurantPublicPath({
      slug,
      accessMode,
      groupSlug,
    })}`;
  }

  return `https://${subdomain}`;
}

export function getRestaurantLoginUrl({
  slug,
  subdomain,
  accessMode,
}: RestaurantUrlInput) {
  if (normalizeAccessMode(accessMode) === "container_path") {
    return `https://${getRootDomain()}/${groupSlug || "contenedores"}/${slug}/login`;
  }

  return `https://${subdomain}/login`;
}

export function getRestaurantAdminUrl({
  slug,
  subdomain,
  accessMode,
}: RestaurantUrlInput) {
  if (normalizeAccessMode(accessMode) === "container_path") {
    return `https://${getRootDomain()}/restaurant/${slug}/admin`;
  }

  return `https://${subdomain}/admin`;
}

export function getRestaurantQrMenuUrl({
  slug,
  subdomain,
  accessMode,
}: RestaurantUrlInput) {
  if (normalizeAccessMode(accessMode) === "container_path") {
    return `https://${getRootDomain()}/${groupSlug || "contenedores"}/${slug}/menu`;
  }

  return `https://${subdomain}/qr`;
}

export function getRestaurantLocalOrderingUrl({
  slug,
  subdomain,
  accessMode,
}: RestaurantUrlInput) {
  if (normalizeAccessMode(accessMode) === "container_path") {
    return `https://${getRootDomain()}/${groupSlug || "contenedores"}/${slug}/menu/ordenar`;
  }

  return `https://${subdomain}/ordenar/${slug}/acceso`;
}
