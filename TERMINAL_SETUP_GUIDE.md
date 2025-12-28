# Step-by-Step Terminal Setup Guide

Follow these steps **IN ORDER** in your terminal.

---

## Step 1: Navigate to Your Project

Open Terminal and run:
```bash
cd "/Users/marck.baldorado/Documents/Learning Management"
```

Verify you're in the right place:
```bash
pwd
```
You should see: `/Users/marck.baldorado/Documents/Learning Management`

---

## Step 2: Check Your .env File

Make sure your `.env` file has the Cloudflare URL:
```bash
grep NEXTAUTH_URL .env
```

You should see:
```
NEXTAUTH_URL="https://wallet-boston-symptoms-eagle.trycloudflare.com"
```

If it's different, update it:
```bash
sed -i '' 's|NEXTAUTH_URL=.*|NEXTAUTH_URL="https://wallet-boston-symptoms-eagle.trycloudflare.com"|' .env
```

---

## Step 3: Stop Any Running Servers

Stop any existing Next.js or Cloudflare processes:
```bash
pkill -f "next dev"
pkill -f cloudflared
```

Wait 2 seconds:
```bash
sleep 2
```

---

## Step 4: Start Next.js Dev Server (Terminal 1)

**Open a NEW terminal window** (keep this one open):

```bash
cd "/Users/marck.baldorado/Documents/Learning Management"
npm run dev
```

**Wait until you see:**
```
✓ Ready in X.XXs
```

**Keep this terminal open!** This is Terminal 1.

---

## Step 5: Start Cloudflare Tunnel (Terminal 2)

**Open ANOTHER NEW terminal window**:

```bash
cd "/Users/marck.baldorado/Documents/Learning Management"
npm run dev:cloudflare
```

**Wait until you see a box with a URL like:**
```
+--------------------------------------------------------------------------------------------+
|  Your quick Tunnel has been created! Visit it at:                                          |
|  https://xxxx-xxxx-xxxx.trycloudflare.com                                                 |
+--------------------------------------------------------------------------------------------+
```

**Copy that URL!** This is Terminal 2 - keep it open.

---

## Step 6: Update .env with the New URL (if different)

If the URL in Terminal 2 is **different** from `wallet-boston-symptoms-eagle.trycloudflare.com`:

1. Copy the new URL from Terminal 2
2. Update `.env`:
   ```bash
   sed -i '' 's|NEXTAUTH_URL=.*|NEXTAUTH_URL="https://YOUR-NEW-URL.trycloudflare.com"|' .env
   ```
   (Replace `YOUR-NEW-URL` with the actual URL)

3. **Restart Terminal 1** (stop with Ctrl+C, then run `npm run dev` again)

---

## Step 7: Verify Everything is Running

Check both processes are running:

```bash
ps aux | grep "next dev" | grep -v grep
ps aux | grep cloudflared | grep -v grep
```

You should see both processes listed.

---

## Step 8: Test on Your Phone

1. **Get the URL from Terminal 2** (the Cloudflare URL)
2. **On your phone**, open Safari/Chrome
3. **Go to:** `https://YOUR-URL.trycloudflare.com/login`
4. **Try logging in**

---

## Troubleshooting

### If login still doesn't work:

**Check Terminal 1 for errors:**
- Look for any red error messages
- Check if the server is actually running

**Check Terminal 2:**
- Make sure the tunnel is still connected
- Look for any error messages

**Verify the URL matches:**
```bash
grep NEXTAUTH_URL .env
```
Should match the URL in Terminal 2.

**Check if user is approved:**
The account might need admin approval. Check the database or try with a different account.

---

## Quick Reference Commands

```bash
# Check if servers are running
ps aux | grep "next dev" | grep -v grep
ps aux | grep cloudflared | grep -v grep

# Stop everything
pkill -f "next dev"
pkill -f cloudflared

# Check .env
grep NEXTAUTH_URL .env

# Start dev server
npm run dev

# Start tunnel
npm run dev:cloudflare
```

