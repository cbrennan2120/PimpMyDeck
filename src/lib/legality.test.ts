import { describe, expect, it } from "vitest";

import { deckLegalityWarnings } from "./legality";
import type { ResolvedDeckCard } from "./types";

function card(name: string, quantity: number, section = "Main"): ResolvedDeckCard {
  return {
    id: `${section}-${name}`,
    quantity,
    name,
    section,
    raw: `${quantity} ${name}`,
    status: "resolved",
    candidates: [],
  };
}

describe("deck legality warnings", () => {
  it("warns when a 60-card deck has fewer than 60 main-deck copies", () => {
    expect(deckLegalityWarnings([card("Lightning Bolt", 4)], "modern")).toContain(
      "Modern decks usually need at least 60 main-deck cards.",
    );
  });

  it("warns when a 60-card deck has more than four non-basic copies", () => {
    expect(deckLegalityWarnings([card("Lightning Bolt", 5), card("Island", 20), card("Mountain", 35)], "modern")).toContain(
      "Lightning Bolt has 5 copies; most 60-card formats allow 4.",
    );
  });

  it("does not warn for basic land copy counts in 60-card formats", () => {
    expect(deckLegalityWarnings([card("Island", 24), card("Mountain", 36)], "modern")).toEqual([]);
  });

  it("warns when commander decks are not 100 total cards", () => {
    expect(deckLegalityWarnings([card("Atraxa, Praetors' Voice", 1, "Commander")], "commander")).toContain(
      "Commander decks are expected to have exactly 100 cards including commanders.",
    );
  });

  it("warns when commander decks have repeated non-basic cards outside commander section", () => {
    const warnings = deckLegalityWarnings(
      [card("Atraxa, Praetors' Voice", 1, "Commander"), card("Sol Ring", 2), card("Island", 97)],
      "commander",
    );

    expect(warnings).toContain("Sol Ring has 2 copies; Commander is singleton outside basic lands.");
  });
});
