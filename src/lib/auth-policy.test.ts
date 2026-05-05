import { describe, expect, it } from "vitest";

import { authRequiredMessage, deckOwnerPayload, isAuthConfigured } from "./auth-policy";

describe("auth policy helpers", () => {
  it("detects whether Supabase auth is configured", () => {
    expect(isAuthConfigured({})).toBe(false);
    expect(
      isAuthConfigured({
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "publishable",
      }),
    ).toBe(true);
  });

  it("adds the signed-in user id to a deck payload", () => {
    expect(deckOwnerPayload({ id: "user-1" })).toEqual({ user_id: "user-1" });
  });

  it("uses a consistent unauthenticated message", () => {
    expect(authRequiredMessage).toBe("Sign in to save and manage decks");
  });
});
