const TCGPLAYER_HOSTS = new Set([
  "tcgplayer.com",
  "www.tcgplayer.com",
  "shop.tcgplayer.com",
  "partner.tcgplayer.com",
]);

export function safeRelativePath(value: string | null | undefined) {
  if (!value) return "/";
  if (!value.startsWith("/") || value.startsWith("//")) return "/";

  try {
    const parsed = new URL(value, "https://pimp-my-deck.local");
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return "/";
  }
}

export function parseAllowedTcgplayerUrl(value: string | null | undefined) {
  if (!value) return null;

  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "https:") return null;
    if (!TCGPLAYER_HOSTS.has(parsed.hostname.toLowerCase())) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}
