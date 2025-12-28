# Quick Email Diagnostic - layoutninja@gmail.com

## Step 1: Check Server Console (Most Important!)

**Look at your terminal where `npm run dev` is running:**

1. **Scroll up** to find when you signed up
2. **Look for these messages:**
   - `✅ Onboarding email sent successfully to: layoutninja@gmail.com`
   - `❌ Failed to send onboarding email:`
   - `Email sending error:`

3. **Copy the exact error message** if you see any

---

## Step 2: Test Email Directly

**Open your browser console (F12) and run:**

```javascript
fetch('/api/test-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ to: 'layoutninja@gmail.com' })
})
.then(r => r.json())
.then(result => {
  console.log('Result:', result);
  if (result.success) {
    alert('✅ Email sent! Check your inbox (and spam folder)');
  } else {
    alert('❌ Error: ' + result.error + '\nDetails: ' + result.details);
  }
});
```

**This will tell us exactly what's wrong!**

---

## Step 3: Check Spam Folder

- Open `layoutninja@gmail.com`
- Check **Spam/Junk** folder
- Look for emails from "Learning Management" or "onboarding@resend.dev"

---

## Step 4: Verify Server Restart

**Important:** If you added the API key after starting the server, you need to restart:

1. Stop server: `Ctrl+C`
2. Start again: `npm run dev`
3. Try signing up again

---

## Common Issues & Quick Fixes

### Issue 1: "Invalid API Key"
- **Fix:** Verify the key in Resend dashboard
- **Fix:** Restart server after adding API key

### Issue 2: "Domain not verified"
- **Fix:** `onboarding@resend.dev` has restrictions
- **Fix:** May only work for specific test scenarios

### Issue 3: No errors but no email
- **Fix:** Check spam folder
- **Fix:** Wait 5-10 minutes (delayed delivery)
- **Fix:** Try a different email address

---

## What to Share

After running Step 2, share:
1. **The result from the test** (success or error message)
2. **Any errors from server console** (Step 1)
3. **Whether you checked spam folder**

This will help me fix the exact issue!

