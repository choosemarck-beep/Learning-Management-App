# Cloudflare Tunnel Setup Guide

## Quick Setup Steps

### Step 1: Download Cloudflare Tunnel Manually

Since automatic download via npm isn't working with your network setup, let's download it manually:

1. **Open Safari or Chrome** on your Mac
2. **Go to this URL**: https://github.com/cloudflare/cloudflared/releases/latest
3. **Find and download** the file for your Mac:
   - **Apple Silicon (M1/M2/M3)**: Look for `cloudflared-darwin-arm64` and click to download
   - **Intel Mac**: Look for `cloudflared-darwin-amd64` and click to download
4. **After download completes**, open Terminal and run these commands:
   ```bash
   cd ~/Downloads
   chmod +x cloudflared-darwin-arm64
   mv cloudflared-darwin-arm64 "/Users/marck.baldorado/Documents/Learning Management/cloudflared"
   ```
   (If you downloaded `cloudflared-darwin-amd64`, use that filename instead)

**Alternative: Direct Download Link**
- For Apple Silicon: https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-darwin-arm64
- For Intel: https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-darwin-amd64

Just right-click the link and "Save Link As..." to your Downloads folder.

### Step 2: Start Your Development Server

Make sure your dev server is running:
```bash
cd "/Users/marck.baldorado/Documents/Learning Management"
npm run dev
```

### Step 3: Start Cloudflare Tunnel

In a **new Terminal window** (keep the dev server running), run:
```bash
cd "/Users/marck.baldorado/Documents/Learning Management"
./cloudflared tunnel --url http://localhost:3000
```

### Step 4: Get Your Public URL

After running the command, you'll see output like:
```
+--------------------------------------------------------------------------------------------+
|  Your quick Tunnel has been created! Visit it at (it may take some time to be reachable): |
|  https://random-words-1234.trycloudflare.com                                              |
+--------------------------------------------------------------------------------------------+
```

**Copy that URL** (the one that looks like `https://random-words-1234.trycloudflare.com`)

### Step 5: Access on Your Phone

1. Open any web browser on your phone
2. Paste the Cloudflare URL you copied
3. Your app should load!

## Notes

- The Cloudflare URL will change each time you restart the tunnel
- Keep both Terminal windows open (one for dev server, one for tunnel)
- The tunnel will automatically stop if you close the Terminal window

## Alternative: Use the npm script

Once cloudflared is in your project folder, you can use:
```bash
npm run dev:cloudflare
```

This will start the tunnel automatically!

