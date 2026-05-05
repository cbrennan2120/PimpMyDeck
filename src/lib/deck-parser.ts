import type { ParsedDeckLine } from "./types";

const SECTION_ALIASES = new Map<string, string>([
  ["commander", "Commander"],
  ["commanders", "Commander"],
  ["main", "Main"],
  ["maindeck", "Main"],
  ["main deck", "Main"],
  ["sideboard", "Sideboard"],
  ["maybeboard", "Maybeboard"],
  ["considering", "Maybeboard"],
]);

const SECTION_LINE = /^([A-Za-z ]+):?$/;
const QUANTITY_LINE =
  /^(?:SB:\s*)?(?:(\d+)\s*x?\s+)(.+?)(?:\s+\[[^\]]+\])?(?:\s+\([A-Z0-9]{2,6}\)\s*[\w-]+)?(?:\s+#.*)?$/i;

export function normalizeCardName(input: string) {
  return input
    .replace(/\s+\*F\*$/i, "")
    .replace(/\s+\*E\*$/i, "")
    .replace(/\s+\([A-Z0-9]{2,6}\)\s*[\w-]*$/i, "")
    .replace(/\s+\[[^\]]+\]$/i, "")
    .replace(/\s+#.*$/, "")
    .trim();
}

export function parseDecklist(source: string): ParsedDeckLine[] {
  const cards: ParsedDeckLine[] = [];
  let section = "Main";

  source.split(/\r?\n/).forEach((line, index) => {
    const raw = line.trim();
    if (!raw || raw.startsWith("//") || raw.startsWith("#")) return;

    const sectionMatch = raw.match(SECTION_LINE);
    const sectionKey = sectionMatch?.[1]?.trim().toLowerCase();
    if (sectionKey && SECTION_ALIASES.has(sectionKey)) {
      section = SECTION_ALIASES.get(sectionKey) ?? section;
      return;
    }

    const match = raw.match(QUANTITY_LINE);
    if (!match) return;

    const quantity = Number.parseInt(match[1] ?? "1", 10);
    const name = normalizeCardName(match[2] ?? "");
    if (!quantity || !name) return;

    cards.push({
      id: `${index}-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      quantity,
      name,
      section: raw.toLowerCase().startsWith("sb:") ? "Sideboard" : section,
      raw,
    });
  });

  return cards;
}

export function toExportLine(card: {
  quantity: number;
  name: string;
  selectedPrint?: { setCode: string; collectorNumber: string };
}) {
  if (!card.selectedPrint) return `${card.quantity} ${card.name}`;
  return `${card.quantity} ${card.name} (${card.selectedPrint.setCode.toUpperCase()}) ${card.selectedPrint.collectorNumber}`;
}
