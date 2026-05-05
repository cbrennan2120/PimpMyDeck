import { describe, expect, it } from "vitest";
import { pickBulkDownloadUri } from "./bulk-data";

describe("pickBulkDownloadUri", () => {
  it("selects all_cards because MVP print browsing needs every printing", () => {
    const uri = pickBulkDownloadUri([
      { type: "oracle_cards", download_uri: "https://example.com/oracle.json" },
      { type: "all_cards", download_uri: "https://example.com/all.json" },
    ]);

    expect(uri).toBe("https://example.com/all.json");
  });

  it("throws when all_cards is unavailable", () => {
    expect(() =>
      pickBulkDownloadUri([{ type: "oracle_cards", download_uri: "https://example.com/oracle.json" }]),
    ).toThrow("all_cards");
  });
});
