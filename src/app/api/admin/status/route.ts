import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    return Response.json({ configured: false });
  }

  const supabase = await createClient();
  const [{ count: printCount, error: printError }, { data: ingestRuns, error: ingestError }] =
    await Promise.all([
      supabase.from("card_prints").select("scryfall_id", { count: "exact", head: true }),
      supabase
        .from("ingest_runs")
        .select("id,source,status,card_count,started_at,finished_at")
        .order("started_at", { ascending: false })
        .limit(5),
    ]);

  if (printError) return Response.json({ error: printError.message }, { status: 500 });
  if (ingestError) return Response.json({ error: ingestError.message }, { status: 500 });

  return Response.json({
    configured: true,
    cardPrintCount: printCount ?? 0,
    latestIngestRun: ingestRuns?.[0] ?? null,
    ingestRuns: ingestRuns ?? [],
  });
}
