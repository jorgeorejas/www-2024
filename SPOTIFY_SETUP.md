# Spotify Now Playing Setup Guide

This guide will help you set up the Spotify "Now Playing" widget that displays your currently playing track in the footer.

## Prerequisites

- A Spotify account (Free or Premium)
- Access to the Spotify Developer Dashboard

## Step 1: Create a Spotify Application

1. Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Log in with your Spotify account
3. Click **"Create app"**
4. Fill in the application details:
   - **App name**: `Personal Website Now Playing` (or any name you prefer)
   - **App description**: `Displays currently playing track on my website`
   - **Redirect URI**: `http://localhost:3000/callback`
   - **API/SDK**: Check "Web API"
5. Accept the Terms of Service and click **"Save"**
6. On your app's page, click **"Settings"**
7. Copy your **Client ID** and **Client Secret** - you'll need these later

## Step 2: Get Your Refresh Token

To get your refresh token, you'll need to authorize your application. You can use this one-time script:

1. Create a temporary file called `get-spotify-token.html` anywhere on your computer:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Get Spotify Refresh Token</title>
</head>
<body>
  <h1>Get Spotify Refresh Token</h1>
  <button id="login">Login with Spotify</button>
  <pre id="result"></pre>

  <script>
    const CLIENT_ID = 'YOUR_CLIENT_ID_HERE'; // Replace with your Client ID
    const CLIENT_SECRET = 'YOUR_CLIENT_SECRET_HERE'; // Replace with your Client Secret
    const REDIRECT_URI = 'http://localhost:3000/callback';
    const SCOPES = 'user-read-currently-playing user-read-playback-state user-read-recently-played';

    document.getElementById('login').addEventListener('click', () => {
      const authUrl = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(SCOPES)}`;
      window.location.href = authUrl;
    });

    // After redirect, extract the code from URL
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (code) {
      fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + btoa(CLIENT_ID + ':' + CLIENT_SECRET)
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: REDIRECT_URI
        })
      })
      .then(response => response.json())
      .then(data => {
        document.getElementById('result').textContent = JSON.stringify(data, null, 2);
      })
      .catch(error => {
        document.getElementById('result').textContent = 'Error: ' + error;
      });
    }
  </script>
</body>
</html>
```

2. Replace `YOUR_CLIENT_ID_HERE` and `YOUR_CLIENT_SECRET_HERE` with your actual credentials
3. Open this file in your browser
4. Click "Login with Spotify"
5. Authorize the application
6. You'll see a JSON response with a `refresh_token` field - copy this value

**Alternative method using cURL:**

```bash
# Step 1: Get the authorization code
# Open this URL in your browser (replace YOUR_CLIENT_ID):
https://accounts.spotify.com/authorize?client_id=YOUR_CLIENT_ID&response_type=code&redirect_uri=http://localhost:3000/callback&scope=user-read-currently-playing%20user-read-playback-state%20user-read-recently-played

# Step 2: After authorization, you'll be redirected to a URL like:
# http://localhost:3000/callback?code=YOUR_CODE
# Copy the code parameter

# Step 3: Exchange the code for a refresh token (replace YOUR_CLIENT_ID, YOUR_CLIENT_SECRET, and YOUR_CODE):
curl -X POST "https://accounts.spotify.com/api/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code" \
  -d "code=YOUR_CODE" \
  -d "redirect_uri=http://localhost:3000/callback" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET"
```

## Step 3: Add Environment Variables

Add the following to your `.env` file:

```env
SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here
SPOTIFY_REFRESH_TOKEN=your_refresh_token_here
```

## Step 4: Test the Integration

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Play a song on Spotify

3. Navigate to your website and check the footer - you should see your currently playing track appear after a few seconds

## How It Works

- The widget polls `/api/spotify/now-playing` every 30 seconds
- The API endpoint uses your refresh token to get a fresh access token
- It fetches your currently playing track from Spotify's API
- When you're listening to music, it displays with a music note icon: "Listening to Song Name by Artist Name"
- When you're not listening, it shows your last played track with a pause icon: "Last played Song Name by Artist Name"
- The widget gracefully hides if no track information is available

## Troubleshooting

**Widget doesn't appear:**
- Make sure you have all three environment variables set correctly
- Check that you're actually playing music on Spotify
- Open your browser's developer console to check for any errors

**401 Unauthorized errors:**
- Your refresh token may have expired - generate a new one following Step 2
- Double-check your Client ID and Client Secret

**Widget shows old songs:**
- The widget updates every 30 seconds, so there may be a slight delay
- Try refreshing the page to force an immediate update

## Security Note

Your Spotify credentials in the `.env` file should **never** be committed to version control. Make sure `.env` is in your `.gitignore` file.
