export const authRequiredMessage = "Sign in to save and manage decks";

export type AuthEnv = {
  NEXT_PUBLIC_SUPABASE_URL?: string;
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?: string;
} & Record<string, string | undefined>;

export type AuthUser = {
  id: string;
};

export function isAuthConfigured(env: AuthEnv) {
  return Boolean(env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}

export function deckOwnerPayload(user: AuthUser) {
  return { user_id: user.id };
}
