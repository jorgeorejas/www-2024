import { timingSafeEqual } from "node:crypto";

/*
 * Spotify access for "now playing", through Vercel Connect: Vercel keeps
 * Jorge's Spotify grant and refreshes it (rotated refresh tokens included),
 * so there's no client secret or refresh token in the env, and a revoked
 * grant is fixed by authorizing again at /api/spotify/connect, without a
 * deploy. See SPOTIFY_SETUP.md.
 *
 * SPOTIFY_REFRESH_TOKEN (+ client id/secret) still works as a fallback, for
 * local development, where there's no Vercel OIDC token.
 */

const env = (name: string): string | undefined =>
  (typeof process !== "undefined" ? process.env[name] : undefined) ??
  (import.meta.env as Record<string, string | undefined>)[name];

export const SPOTIFY_CONNECTOR = env("SPOTIFY_CONNECTOR") ?? "spotify/www";
/** One owner: the site only ever shows Jorge's music */
const OWNER = { type: "user", id: "jorge" } as const;
/**
 * What the site reads. The connector has no default scopes, so asking for
 * none would get a grant that can't see the player. The token request asks
 * for the same scopes as the consent, or Connect won't find the grant.
 */
const SCOPES = ["user-read-currently-playing", "user-read-playback-state", "user-read-recently-played"];

async function legacyToken(): Promise<string | undefined> {
  const id = env("SPOTIFY_CLIENT_ID");
  const secret = env("SPOTIFY_CLIENT_SECRET");
  const refresh = env("SPOTIFY_REFRESH_TOKEN");
  if (!id || !secret || !refresh) return undefined;
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${id}:${secret}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: refresh }),
  });
  if (!response.ok) {
    // Spotify says why (invalid_grant = revoked or expired); no secret in the log
    const body = (await response.json().catch(() => ({}))) as { error?: string; error_description?: string };
    throw new Error(`Spotify refused the refresh token: ${response.status} ${body.error ?? ""} ${body.error_description ?? ""}`.trim());
  }
  return ((await response.json()) as { access_token: string }).access_token;
}

/**
 * A Spotify access token: from Vercel Connect (cached in memory by the SDK
 * until it's about to expire), or from the env refresh token. `fresh` skips
 * the cache, for when Spotify just rejected the cached token.
 */
export async function spotifyAccessToken(fresh = false): Promise<string> {
  try {
    const { getToken } = await import("@vercel/connect");
    return await getToken(SPOTIFY_CONNECTOR, { subject: OWNER, scopes: SCOPES }, { forceRefresh: fresh });
  } catch (error) {
    const { name, message, code } = error as Error & { code?: string };
    console.warn(`[spotify] no token from Vercel Connect (${name} ${code ?? ""}: ${message}), trying the env refresh token`);
    const fallback = await legacyToken();
    if (fallback) return fallback;
    throw error;
  }
}

/** Where to send Jorge to (re)authorize his Spotify account in Vercel Connect */
export async function spotifyAuthorizationUrl(returnUrl: string): Promise<string> {
  const { startAuthorization } = await import("@vercel/connect");
  const { url } = await startAuthorization(SPOTIFY_CONNECTOR, { subject: OWNER, scopes: SCOPES }, { callbackUrl: returnUrl });
  return url;
}

/** The ?key= of /api/spotify/connect against SPOTIFY_CONNECT_KEY; no key set = closed */
export function isConnectKey(candidate: string | null): boolean {
  const key = env("SPOTIFY_CONNECT_KEY");
  if (!key || !candidate) return false;
  const a = Buffer.from(candidate);
  const b = Buffer.from(key);
  return a.length === b.length && timingSafeEqual(a, b);
}
