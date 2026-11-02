import type { APIRoute } from "astro";
import { isConnectKey, spotifyAuthorizationUrl } from "@lib/spotify";

/*
 * (Re)authorize Jorge's Spotify account in Vercel Connect:
 *   /api/spotify/connect?key=<SPOTIFY_CONNECT_KEY>
 * sends him to Spotify's consent screen and back to the home page. Without
 * the key (or with SPOTIFY_CONNECT_KEY unset) it's a 404, so nobody else can
 * swap in their own account.
 */

const headers = { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex" };

export const GET: APIRoute = async ({ url }) => {
  if (!isConnectKey(url.searchParams.get("key"))) {
    return new Response("Not found", { status: 404, headers });
  }
  try {
    const consent = await spotifyAuthorizationUrl(new URL("/", url).toString());
    return new Response(null, { status: 302, headers: { ...headers, Location: consent } });
  } catch (error) {
    console.error("[spotify] could not start the authorization", error);
    return new Response("Could not start the Spotify authorization, see the logs", { status: 502, headers });
  }
};
