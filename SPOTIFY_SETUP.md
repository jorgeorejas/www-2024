# Spotify "now playing"

The footer (and the line under the home bio) shows what's playing on Spotify, or the last track played. `src/pages/api/spotify/now-playing.ts` turns a long-lived **refresh token** into an access token on each request and asks Spotify for the current or last track; `src/components/margin/NowPlayingMini.astro` polls it.

## Environment variables (Vercel: Production, Preview and Development)

| Variable | What it is |
|---|---|
| `SPOTIFY_CLIENT_ID` | Client ID of the app in the Spotify Developer Dashboard |
| `SPOTIFY_CLIENT_SECRET` | Client secret of that app |
| `SPOTIFY_REFRESH_TOKEN` | Refresh token for Jorge's account, from `/spotify-auth` |
| `SPOTIFY_REDIRECT_URI` | Optional. Defaults to `<origin>/spotify-auth` |

## When the line disappears

The endpoint logs why Spotify refused the token:

```bash
vcp logs -e production -q 'requestPath:"/api/spotify/now-playing"'
```

- `400 invalid_grant Refresh token revoked`: the token was revoked (access removed from the account, password change, app changes). Get a new one, below.
- `400 invalid_client`: the client ID or secret is wrong.

## Getting a new refresh token

1. **Redirect URI.** In the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard), open the app → Settings → Redirect URIs and add `http://127.0.0.1:4321/spotify-auth`. Spotify no longer accepts `localhost`, only the loopback IP.
2. **Local credentials.** Put `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET` in your local `.env` (same values as in Vercel).
3. **Authorize.** Run `pnpm dev`, open `http://127.0.0.1:4321/spotify-auth` (the IP, not `localhost`, so the redirect matches), click the button and accept. The page shows the new refresh token. It only works in development.
4. **Save it in Vercel**, for each environment:

   ```bash
   vcp env rm SPOTIFY_REFRESH_TOKEN production
   vcp env add SPOTIFY_REFRESH_TOKEN production
   # same for preview and development
   ```

5. **Redeploy** production so it picks up the new value (`vcp redeploy <production url>` or push to `main`), then check `https://www.jorgeorejas.com/api/spotify/now-playing` returns a track.

Scopes requested: `user-read-currently-playing user-read-playback-state user-read-recently-played`.
