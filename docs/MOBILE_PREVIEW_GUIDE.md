# How to Preview the Web App on Your Mobile Phone

This guide will help you test your mobile-first Learning Management app on your actual phone.

## What You Need

1. Your computer (Mac) with the app running
2. Your mobile phone (iPhone or Android)
3. Both devices connected to the **same Wi-Fi network**

---

## Step-by-Step Instructions

### Step 1: Find Your Computer's IP Address

Your computer has a unique address on your Wi-Fi network. We need to find it so your phone can connect to it.

**On Mac:**

1. Click the **Apple menu** (🍎) in the top-left corner
2. Click **System Settings** (or **System Preferences** on older Macs)
3. Click **Network** (or **Wi-Fi**)
4. Click on your connected Wi-Fi network
5. Look for **IP Address** - it will look something like `192.168.1.100` or `10.0.0.50`
6. **Write this number down** - you'll need it!

**Alternative Method (Terminal):**

1. Open **Terminal** (Press `Cmd + Space`, type "Terminal", press Enter)
2. Type this command and press Enter:
   ```bash
   ipconfig getifaddr en0
   ```
3. You'll see your IP address (something like `192.168.1.100`)
4. **Write this number down**

---

### Step 2: Start the Development Server

The app needs to be running on your computer for your phone to access it.

1. Open **Terminal** (Press `Cmd + Space`, type "Terminal", press Enter)
2. Navigate to your project folder:
   ```bash
   cd "/Users/marck.baldorado/Documents/Learning Management"
   ```
3. Start the development server with network access:
   ```bash
   npm run dev -- -H 0.0.0.0
   ```
   
   **What this does:**
   - `npm run dev` - Starts the development server
   - `-H 0.0.0.0` - Makes it accessible from other devices on your network (not just your computer)

4. Wait for it to start - you'll see:
   ```
   ▲ Next.js 14.x.x
   - Local:        http://localhost:3000
   - Network:      http://192.168.1.100:3000
   ```

5. **Keep this terminal window open** - don't close it while testing!

---

### Step 3: Access from Your Phone

Now that the server is running, you can access it from your phone.

1. **Make sure your phone is on the same Wi-Fi network** as your computer
2. Open your phone's web browser (Safari on iPhone, Chrome on Android)
3. In the address bar, type:
   ```
   http://YOUR_IP_ADDRESS:3000
   ```
   
   **Replace `YOUR_IP_ADDRESS` with the IP address you wrote down in Step 1**
   
   **Example:** If your IP is `192.168.1.100`, type:
   ```
   http://192.168.1.100:3000
   ```

4. Press **Go** or **Enter**
5. The app should load on your phone! 🎉

---

## Troubleshooting

### "Can't connect" or "Site can't be reached"

**Check these things:**

1. **Same Wi-Fi Network?**
   - Your phone and computer must be on the same Wi-Fi network
   - Check your phone's Wi-Fi settings to confirm

2. **Firewall Blocking?**
   - Your Mac's firewall might be blocking the connection
   - Go to **System Settings** → **Network** → **Firewall**
   - Temporarily turn off the firewall to test
   - If it works, you can add an exception for Node.js

3. **IP Address Changed?**
   - Your IP address might change when you reconnect to Wi-Fi
   - Find your IP address again using Step 1

4. **Server Still Running?**
   - Check the Terminal window - make sure the server is still running
   - If you see errors, share them and we can fix them

### "Connection refused" or "ERR_CONNECTION_REFUSED"

- Make sure the development server is running (`npm run dev -- -H 0.0.0.0`)
- Check that you're using the correct IP address
- Try restarting the development server

### The page loads but looks broken

- This is normal during development - some features might not work perfectly
- Try refreshing the page
- Check the Terminal for any error messages

---

## Quick Reference

**Start server with network access:**
```bash
npm run dev -- -H 0.0.0.0
```

**Find your IP address:**
```bash
ipconfig getifaddr en0
```

**Access from phone:**
```
http://YOUR_IP_ADDRESS:3000
```

---

## Alternative: Using ngrok (Advanced)

If you want to test from anywhere (not just on the same Wi-Fi), you can use **ngrok**:

1. Install ngrok: `brew install ngrok` (or download from ngrok.com)
2. Start your dev server normally: `npm run dev`
3. In another terminal, run: `ngrok http 3000`
4. Copy the URL ngrok gives you (looks like `https://abc123.ngrok.io`)
5. Open that URL on your phone from anywhere!

**Note:** ngrok free tier has limitations, but it's great for testing.

---

## Tips

- **Keep the terminal open** - Closing it stops the server
- **Test on real devices** - This is the best way to see how the mobile design looks
- **Try different phones** - Test on both iPhone and Android if possible
- **Check different screen sizes** - The app is optimized for 320px-428px widths

---

## Need Help?

If you run into any issues:
1. Share the error message you see
2. Confirm both devices are on the same Wi-Fi
3. Check that the server is running in Terminal
4. Verify you're using the correct IP address

Happy testing! 🚀

