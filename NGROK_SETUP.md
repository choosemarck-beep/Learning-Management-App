# Ngrok Setup Guide

Ngrok creates a secure tunnel to your local development server, allowing you to access it from any device (including your mobile phone) via a public URL.

## Step 1: Sign Up for Ngrok (Free)

1. Go to https://ngrok.com/signup
2. Sign up for a free account (no credit card required)
3. After signing up, you'll get an **authtoken**

## Step 2: Configure Ngrok

Run this command with your authtoken:

```bash
npx ngrok config add-authtoken YOUR_AUTHTOKEN_HERE
```

Replace `YOUR_AUTHTOKEN_HERE` with the token you received from ngrok.

## Step 3: Start Ngrok Tunnel

Once configured, you can start the tunnel:

```bash
npm run dev:tunnel
```

Or manually:
```bash
npx ngrok http 3000
```

## Step 4: Get Your Public URL

After starting ngrok, you'll see output like:

```
Forwarding  https://abc123.ngrok.io -> http://localhost:3000
```

**Copy the `https://abc123.ngrok.io` URL** - this is your public URL that works from anywhere!

## Step 5: Update NEXTAUTH_URL

1. Open your `.env` file
2. Update `NEXTAUTH_URL` to your ngrok URL:
   ```
   NEXTAUTH_URL="https://abc123.ngrok.io"
   ```
   (Replace `abc123.ngrok.io` with your actual ngrok URL)

3. Restart your Next.js dev server:
   ```bash
   npm run dev
   ```

## Step 6: Access from Your Phone

Open the ngrok URL in your phone's browser:
```
https://abc123.ngrok.io
```

## Important Notes

- **Free ngrok URLs change each time** you restart ngrok (unless you have a paid plan)
- You'll need to update `NEXTAUTH_URL` in `.env` each time you get a new ngrok URL
- The ngrok web interface is available at: http://localhost:4040 (shows requests, URLs, etc.)
- Keep both `npm run dev` and `npm run dev:tunnel` running simultaneously

## Quick Start Commands

```bash
# Terminal 1: Start Next.js dev server
npm run dev

# Terminal 2: Start ngrok tunnel
npm run dev:tunnel

# Then update .env with the ngrok URL and restart npm run dev
```

## Troubleshooting

- If ngrok says "authtoken required", make sure you've run `npx ngrok config add-authtoken YOUR_TOKEN`
- If the URL doesn't work, check that both the dev server and ngrok are running
- Make sure `NEXTAUTH_URL` in `.env` matches your current ngrok URL

