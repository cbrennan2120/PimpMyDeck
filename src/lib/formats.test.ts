import { describe, expect, it } from "vitest";

import { DEFAULT_FORMAT, formatLabel, isSixtyCardFormat } from "./formats";

describe("deck formats", () => {
  it("defaults to casual instead of commander", () => {
    expect(DEFAULT_FORMAT).toBe("casual");
  });

  it("labels common 60-card formats", () => {
    expect(formatLabel("modern")).toBe("Modern");
    expect(formatLabel("standard")).toBe("Standard");
  });

  it("distinguishes 60-card formats from commander", () => {
    expect(isSixtyCardFormat("modern")).toBe(true);
    expect(isSixtyCardFormat("commander")).toBe(false);
  });
});
