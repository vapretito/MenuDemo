function sanitizeHostnameLike(value?: string | null) {
  const rawValue = String(value ?? "").trim().toLowerCase();

  if (!rawValue) {
    return "";
  }

  const withoutProtocol = rawValue.replace(/^https?:\/\//, "");
  const withoutPath = withoutProtocol.split("/")[0] ?? "";
  const withoutPort = withoutPath.split(":")[0] ?? "";
  const withoutTrailingDot = withoutPort.replace(/\.$/, "");

  return withoutTrailingDot.replace(/^www\./, "");
}

export function getRootDomain() {
  return sanitizeHostnameLike(process.env.MENUI_ROOT_DOMAIN) || "menui.online";
}

export function normalizeHostname(value?: string | null) {
  return sanitizeHostnameLike(value);
}
