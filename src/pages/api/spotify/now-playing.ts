import type { APIRoute } from "astro";

const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";
const SPOTIFY_NOW_PLAYING_URL =
  "https://api.spotify.com/v1/me/player/currently-playing";
const SPOTIFY_RECENTLY_PLAYED_URL =
  "https://api.spotify.com/v1/me/player/recently-played?limit=1";

const client_id = import.meta.env.SPOTIFY_CLIENT_ID;
const client_secret = import.meta.env.SPOTIFY_CLIENT_SECRET;
const refresh_token = import.meta.env.SPOTIFY_REFRESH_TOKEN;

interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

interface SpotifyImage {
  url: string;
  width: number;
  height: number;
}

interface SpotifyNowPlayingResponse {
  is_playing: boolean;
  progress_ms?: number;
  item?: {
    name: string;
    duration_ms: number;
    artists: Array<{ name: string }>;
    album: { name: string; images: SpotifyImage[] };
    external_urls: {
      spotify: string;
    };
  };
}

interface SpotifyRecentlyPlayedResponse {
  items: Array<{
    played_at: string;
    track: {
      name: string;
      duration_ms: number;
      artists: Array<{ name: string }>;
      album: { name: string; images: SpotifyImage[] };
      external_urls: {
        spotify: string;
      };
    };
  }>;
}

function smallestImage(images: SpotifyImage[] | undefined): string | undefined {
  if (!images || images.length === 0) return undefined;
  return images.reduce((a, b) => (a.width <= b.width ? a : b)).url;
}

async function getAccessToken(): Promise<string> {
  const basic = btoa(`${client_id}:${client_secret}`);

  const response = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refresh_token,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to get access token");
  }

  const data: SpotifyTokenResponse = await response.json();
  return data.access_token;
}

async function getNowPlaying(accessToken: string) {
  const response = await fetch(SPOTIFY_NOW_PLAYING_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (response.status === 204 || response.status > 400) {
    return null;
  }

  const data: SpotifyNowPlayingResponse = await response.json();

  if (!data.is_playing || !data.item) {
    return null;
  }

  return {
    isPlaying: true,
    title: data.item.name,
    artist: data.item.artists.map((artist) => artist.name).join(", "),
    album: data.item.album.name,
    albumImage: smallestImage(data.item.album.images),
    url: data.item.external_urls.spotify,
    progressMs: data.progress_ms ?? 0,
    durationMs: data.item.duration_ms,
  };
}

async function getRecentlyPlayed(accessToken: string) {
  const response = await fetch(SPOTIFY_RECENTLY_PLAYED_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    return null;
  }

  const data: SpotifyRecentlyPlayedResponse = await response.json();

  if (!data.items || data.items.length === 0) {
    return null;
  }

  const item = data.items[0];
  const track = item.track;

  return {
    isPlaying: false,
    title: track.name,
    artist: track.artists.map((artist) => artist.name).join(", "),
    album: track.album.name,
    albumImage: smallestImage(track.album.images),
    url: track.external_urls.spotify,
    playedAt: item.played_at,
  };
}

export const GET: APIRoute = async () => {
  // Check if Spotify credentials are configured
  if (!client_id || !client_secret || !refresh_token) {
    return new Response(
      JSON.stringify({
        isPlaying: false,
        error: "Spotify credentials not configured",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      }
    );
  }

  try {
    const accessToken = await getAccessToken();
    const nowPlaying = await getNowPlaying(accessToken);

    // If nothing is currently playing, fetch the last played track
    if (!nowPlaying) {
      const recentlyPlayed = await getRecentlyPlayed(accessToken);
      return new Response(
        JSON.stringify(recentlyPlayed || { isPlaying: false }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
          },
        }
      );
    }

    return new Response(JSON.stringify(nowPlaying), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
      },
    });
  } catch (error) {
    console.error("Spotify API error:", error);
    return new Response(JSON.stringify({ isPlaying: false }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  }
};
