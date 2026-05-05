import { describe, expect, it } from "vitest";
import { parseDecklist, toExportLine } from "./deck-parser";

describe("parseDecklist", () => {
  it("handles section labels, set codes, sideboard prefixes, and foil markers", () => {
    const parsed = parseDecklist(`Commander:
1 Atraxa, Praetors' Voice

Main:
1x Sol Ring (CMM) 400 *F*
2 Counterspell [2XM]
SB: 1 Lightning Bolt # burn

Maybeboard
1 Birds of Paradise`);

    expect(parsed).toEqual([
      expect.objectContaining({ quantity: 1, name: "Atraxa, Praetors' Voice", section: "Commander" }),
      expect.objectContaining({ quantity: 1, name: "Sol Ring", section: "Main" }),
      expect.objectContaining({ quantity: 2, name: "Counterspell", section: "Main" }),
      expect.objectContaining({ quantity: 1, name: "Lightning Bolt", section: "Sideboard" }),
      expect.objectContaining({ quantity: 1, name: "Birds of Paradise", section: "Maybeboard" }),
    ]);
  });
});

describe("toExportLine", () => {
  it("exports selected set and collector number", () => {
    expect(
      toExportLine({
        quantity: 1,
        name: "Sol Ring",
        selectedPrint: { setCode: "sld", collectorNumber: "999" },
      }),
    ).toBe("1 Sol Ring (SLD) 999");
  });
});
