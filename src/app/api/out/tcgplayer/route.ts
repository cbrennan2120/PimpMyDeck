import { getCachedPrintById } from "@/lib/scryfall";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { parseAllowedTcgplayerUrl } from "@/lib/url-safety";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function buildImpactUrl(destination: string, subId: string) {
  const base = process.env.TCGPLAYER_IMPACT_BASE_URL;
  const accountId = process.env.TCGPLAYER_ACCOUNT_ID;
  const destinationUrl = new URL(destination);

  if (!base || !accountId) {
    destinationUrl.searchParams.set("utm_source", "pimp-my-deck");
    destinationUrl.searchParams.set("utm_medium", "affiliate-pending");
    destinationUrl.searchParams.set("utm_campaign", subId);
    return destinationUrl.toString();
  }

  const impactUrl = new URL(base);
  impactUrl.searchParams.set("u", destination);
  impactUrl.searchParams.set("subId1", subId);
  impactUrl.searchParams.set("sharedid", accountId);
  return impactUrl.toString();
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const scryfallId = url.searchParams.get("scryfallId");
  const slot = url.searchParams.get("slot") ?? "deck";
  const fallback = url.searchParams.get("url");

  if (!scryfallId && !fallback) {
    return Response.json({ error: "Missing scryfallId or url" }, { status: 400 });
  }

  const print = scryfallId ? getCachedPrintById(scryfallId) : undefined;
  const destination = parseAllowedTcgplayerUrl(print?.purchaseUris.tcgplayer ?? fallback);

  if (!destination) {
    return Response.json({ error: "No allowed TCGplayer URL available" }, { status: 404 });
  }

  const prefix = process.env.SUBID_PREFIX ?? "pmd";
  const subId = `${prefix}-${slot}-${scryfallId ?? "direct"}-${Date.now()}`;
  const outboundUrl = buildImpactUrl(destination, subId);

  if (
    scryfallId &&
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    const supabase = createServiceRoleClient();
    await supabase?.from("affiliate_clicks").insert({
      scryfall_id: scryfallId,
      merchant: "tcgplayer",
      outbound_url: outboundUrl,
      sub_id: subId,
    });
  }

  return Response.redirect(outboundUrl, 302);
}
