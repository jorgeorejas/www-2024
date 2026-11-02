# Spotify "now playing"

The footer (and the line under the home bio) shows what's playing on Spotify, or the last track played. `src/pages/api/spotify/now-playing.ts` asks Spotify for the current or last track; `src/components/margin/NowPlayingMini.astro` polls it.

## How it gets a token: Vercel Connect

The Spotify grant lives in **Vercel Connect** (connector `spotify/www`, attached to the `www` project), not in env vars. Vercel keeps the OAuth client, stores Jorge's grant and refreshes the access token itself, rotated refresh tokens included. `src/lib/spotify.ts` asks for a token with `getToken("spotify/www", { subject: { type: "user", id: "jorge" } })`. The SDK caches it in memory until it's about to expire, so Connect sees about one request per instance per hour.

| Variable | What it is |
|---|---|
| `SPOTIFY_CONNECT_KEY` | Secret that opens `/api/spotify/connect`. Without it the route is a 404 |
| `SPOTIFY_CONNECTOR` | Optional, defaults to `spotify/www` |
| `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REFRESH_TOKEN` | Optional fallback, only used when Connect can't give a token (local development has no Vercel OIDC token). Safe to delete from Vercel once Connect works |

## Authorizing (once, or whenever Spotify cuts access)

1. Set the key, any long random string, in Production: `vcp env add SPOTIFY_CONNECT_KEY production`. Env changes need a deploy to apply.
2. Open `https://www.jorgeorejas.com/api/spotify/connect?key=<the key>`, log in to Spotify and accept. Vercel Connect finishes the OAuth handshake and sends you back to the home page.
3. Check `https://www.jorgeorejas.com/api/spotify/now-playing` returns a track.

No code change, env change or deploy is needed when re-authorizing later: just step 2.

## When the line disappears

```bash
vcp logs -e production -q 'requestPath:"/api/spotify/now-playing"'
```

- `UserAuthorizationRequiredError` / `no_token`: the grant is missing or was revoked. Authorize again (step 2).
- `Spotify refused the refresh token: 400 invalid_grant`: the fallback env token was revoked. It doesn't matter once Connect works.

Scopes come from the connector: `user-read-currently-playing user-read-playback-state user-read-recently-played` is what the site needs.
