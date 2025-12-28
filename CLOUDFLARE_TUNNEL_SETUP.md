# Cloudflare Tunnel Setup Guide

## What is Cloudflare Tunnel?

Cloudflare Tunnel (cloudflared) creates a **secure, free public URL** that tunnels to your local development server. Unlike ngrok, **the URLs are free and can be static** (don't change).

**Key Difference from Vercel:**
- **Vercel**: Hosts your app in production (deployment platform)
- **Cloudflare Tunnel**: Just exposes your local dev server for testing (development tool)

## Quick Start

### Step 1: Start Your Dev Server

In **Terminal 1**, make sure your Next.js server is running:
```bash
npm run dev
```

### Step 2: Start Cloudflare Tunnel

In **Terminal 2**, run:
```bash
npm run dev:cloudflare
```

Or manually:
```bash
./cloudflared tunnel --url http://localhost:3000
```

### Step 3: Get Your Public URL

After starting, you'll see output like:
```
+--------------------------------------------------------------------------------------------+
|  Your quick Tunnel has been created! Visit it at (it may take some time to be reachable): |
|  https://xxxx-xxxx-xxxx.trycloudflare.com                                                 |
+--------------------------------------------------------------------------------------------+
```

**Copy that `https://xxxx-xxxx-xxxx.trycloudflare.com` URL!**

### Step 4: Update NEXTAUTH_URL

1. Open your `.env` file
2. Update `NEXTAUTH_URL` to your Cloudflare Tunnel URL:
   ```
   NEXTAUTH_URL="https://xxxx-xxxx-xxxx.trycloudflare.com"
   ```
   (Replace with your actual URL)

3. **Restart your Next.js dev server** (Terminal 1):
   - Stop it (Ctrl+C)
   - Start again: `npm run dev`

### Step 5: Access from Your Phone

Open the Cloudflare Tunnel URL in your phone's browser:
```
https://xxxx-xxxx-xxxx.trycloudflare.com
```

## Important Notes

### URL Stability

- **Quick Tunnel URLs** (default): Change each time you restart the tunnel
- **Named Tunnels** (advanced): Can have static URLs (requires Cloudflare account, but still free)

### For a Permanent URL (Optional)

If you want a URL that never changes:

1. Sign up for free Cloudflare account: https://dash.cloudflare.com/sign-up
2. Create a named tunnel (one-time setup)
3. Get a permanent URL like: `https://your-app.your-domain.com`

But for development, the quick tunnel is usually fine!

## Running Both Services

You need **two terminal windows**:

**Terminal 1:**
```bash
npm run dev
```

**Terminal 2:**
```bash
npm run dev:cloudflare
```

## Troubleshooting

- **Can't see the URL?** Make sure you run the tunnel command in a terminal (not background) so you can see the output
- **URL not working?** Make sure both the dev server and tunnel are running
- **Connection issues?** Check that `NEXTAUTH_URL` in `.env` matches your tunnel URL

## Advantages Over ngrok

✅ **Free static URLs** (with named tunnels)  
✅ **No account needed** for quick tunnels  
✅ **Fast and reliable** (Cloudflare's global network)  
✅ **No bandwidth limits**  
✅ **HTTPS by default**

## Next Steps

1. Run `npm run dev:cloudflare` in a new terminal
2. Copy the URL it gives you
3. Update `.env` with that URL
4. Restart `npm run dev`
5. Access from your phone!

