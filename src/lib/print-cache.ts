import { existsSync, readFileSync } from "node:fs";
import type { CardPrint, ParsedDeckLine, ResolvedDeckCard } from "./types";

export type PrintCache = {
  lookupByName(name: string): CardPrint[];
  size: number;
};

export type LivePrintLookup = (name: string) => Promise<CardPrint[]>;

export function normalizeLookupName(name: string) {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9/ ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function createPrintCache(prints: CardPrint[]): PrintCache {
  const byName = new Map<string, CardPrint[]>();

  for (const print of prints) {
    const key = normalizeLookupName(print.name);
    const current = byName.get(key) ?? [];
    current.push(print);
    byName.set(key, current);
  }

  return {
    size: prints.length,
    lookupByName(name: string) {
      return byName.get(normalizeLookupName(name)) ?? [];
    },
  };
}

export function loadPrintCacheFromFile(path?: string) {
  if (!path || !existsSync(path)) {
    return createPrintCache([]);
  }

  const payload = JSON.parse(readFileSync(path, "utf8")) as CardPrint[];
  return createPrintCache(payload);
}

export async function resolveFromPrintCache(
  lines: ParsedDeckLine[],
  cache: PrintCache,
  liveLookup: LivePrintLookup,
): Promise<ResolvedDeckCard[]> {
  const resolved: ResolvedDeckCard[] = [];

  for (const line of lines) {
    const cached = cache.lookupByName(line.name);
    const candidates = cached.length > 0 ? cached : await liveLookup(line.name);
    const paperCandidates = candidates.filter((print) => !print.digital);
    const selectedPrint =
      paperCandidates.find((print) => print.lang === "en" && print.imageUris.normal) ??
      paperCandidates[0];

    resolved.push({
      ...line,
      oracleId: selectedPrint?.oracleId,
      status: selectedPrint ? "resolved" : "unresolved",
      selectedPrint,
      candidates: paperCandidates,
      reason: selectedPrint ? undefined : "No Scryfall print found",
    });
  }

  return resolved;
}
