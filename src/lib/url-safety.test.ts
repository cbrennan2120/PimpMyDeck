import { describe, expect, it } from "vitest";
import { parseAllowedTcgplayerUrl, safeRelativePath } from "./url-safety";

describe("safeRelativePath", () => {
  it("keeps relative app paths", () => {
    expect(safeRelativePath("/decks?id=1#top")).toBe("/decks?id=1#top");
  });

  it("rejects absolute and protocol-relative redirects", () => {
    expect(safeRelativePath("https://evil.example/phish")).toBe("/");
    expect(safeRelativePath("//evil.example/phish")).toBe("/");
  });
});

describe("parseAllowedTcgplayerUrl", () => {
  it("allows known TCGplayer HTTPS hosts", () => {
    expect(parseAllowedTcgplayerUrl("https://www.tcgplayer.com/product/123")).toBe(
      "https://www.tcgplayer.com/product/123",
    );
  });

  it("rejects non-TCGplayer, malformed, and non-HTTPS URLs", () => {
    expect(parseAllowedTcgplayerUrl("https://evil.example/product/123")).toBeNull();
    expect(parseAllowedTcgplayerUrl("http://www.tcgplayer.com/product/123")).toBeNull();
    expect(parseAllowedTcgplayerUrl("not a url")).toBeNull();
  });
});
