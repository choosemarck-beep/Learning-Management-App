# Email Troubleshooting Guide

## Step-by-Step Guide to Fix Email Issues

This guide will help you diagnose and fix why emails aren't being sent from your Learning Management app.

---

## Step 1: Check Your Server Console for Errors

### What to do:
1. **Find your terminal window** where you ran `npm run dev`
   - This is the window that shows "Ready in 1570ms" and "Local: http://localhost:3001"
   
2. **Look for error messages** that say:
   - `❌ Failed to send onboarding email:`
   - `Email sending error:`
   - Any red text or error messages

3. **If you see errors**, write down the exact error message (or take a screenshot)

### What this tells us:
- If there are errors, we'll know exactly what's wrong
- If there are no errors, the email might have been sent but went to spam

---

## Step 2: Test Email Sending Directly

We'll use a test endpoint to see if email sending works at all.

### Option A: Using Browser Developer Tools (Easiest)

1. **Open your app in the browser**
   - Go to: `http://localhost:3001` (or whatever port your server is using)

2. **Open Developer Tools**
   - **On Mac**: Press `Cmd + Option + I` (or `Cmd + Shift + I`)
   - **On Windows/Linux**: Press `F12` or `Ctrl + Shift + I`
   - Or right-click on the page → "Inspect" or "Inspect Element"

3. **Go to the Console tab**
   - Click on the "Console" tab at the top of the developer tools window

4. **Run the test command**
   - Copy and paste this entire command into the console and press Enter:

```javascript
fetch('/api/test-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ to: 'marckspov@gmail.com' })
})
.then(response => response.json())
.then(result => {
  console.log('Email Test Result:', result);
  if (result.success) {
    console.log('✅ Email sent successfully!');
  } else {
    console.log('❌ Email failed:', result.error);
    console.log('Details:', result.details);
  }
})
.catch(error => {
  console.error('❌ Request failed:', error);
});
```

5. **Check the result**
   - You'll see a message in the console showing if the email was sent or what error occurred
   - **Take a screenshot** or write down the error message if it failed

### Option B: Using Terminal (Alternative Method)

If you prefer using the terminal:

1. **Open a new terminal window** (keep your dev server running in the other one)

2. **Run this command** (replace `3001` with your actual port if different):

```bash
curl -X POST http://localhost:3001/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"to":"marckspov@gmail.com"}'
```

3. **Check the output** - it will show you if the email was sent or what error occurred

---

## Step 3: Check Your Spam Folder

Even if the email was sent successfully, it might be in spam:

1. **Open your email** (marckspov@gmail.com)
2. **Check the Spam/Junk folder**
3. **Look for emails from** "Learning Management" or "onboarding@resend.dev"
4. **If you find it**, mark it as "Not Spam" so future emails go to your inbox

---

## Step 4: Verify Your Resend API Key

### Check if the API key is correct:

1. **Go to Resend Dashboard**
   - Visit: https://resend.com/login
   - Log in with your Resend account

2. **Check your API Keys**
   - Go to "API Keys" in the dashboard
   - Verify that the key `re_ag7omBds_QBxaRyC4LUd3Ln7KPRSkkTyS` exists and is active
   - Make sure it hasn't been revoked or expired

3. **Check Domain Verification**
   - Go to "Domains" in the Resend dashboard
   - If you see a domain listed, it needs to be verified
   - For testing, you can use `onboarding@resend.dev` without domain verification, but it has limitations

---

## Step 5: Common Issues and Solutions

### Issue 1: "Invalid API Key" Error

**Problem**: Your Resend API key is incorrect or expired

**Solution**:
1. Go to Resend dashboard → API Keys
2. Create a new API key
3. Copy the new key
4. Update your `.env` file:
   ```
   RESEND_API_KEY=your_new_api_key_here
   ```
5. Restart your dev server (stop with `Ctrl+C`, then run `npm run dev` again)

### Issue 2: "Domain not verified" Error

**Problem**: Resend requires domain verification for production emails

**Solution**:
- **For testing**: Use `onboarding@resend.dev` (should work for test emails)
- **For production**: You need to verify your domain in Resend dashboard
  - Go to Resend → Domains
  - Add your domain (e.g., `yourdomain.com`)
  - Follow the verification steps (add DNS records)
  - Once verified, update the "from" address in `lib/email/client.ts`

### Issue 3: "Email sent but not received"

**Possible causes**:
1. **Spam folder** - Check spam/junk folder
2. **Email provider blocking** - Some email providers block emails from unverified domains
3. **Delayed delivery** - Sometimes emails take a few minutes

**Solution**:
- Check spam folder first
- Wait 5-10 minutes and check again
- Try sending to a different email address (Gmail, Outlook, etc.) to test

### Issue 4: "Module not found" or Import Errors

**Problem**: Email packages might not be installed

**Solution**:
1. Stop your dev server (`Ctrl+C`)
2. Run: `npm install resend react-email @react-email/components @react-email/render`
3. Restart your dev server: `npm run dev`

---

## Step 6: Understanding the Results

### If the test email succeeds:
✅ **Great!** Your email setup is working. The issue might be:
- The email went to spam
- There was a temporary network issue during signup
- The email is delayed

**Next steps**:
- Check spam folder
- Try signing up again and check for the email

### If the test email fails:
❌ **We need to fix the configuration**

**What to do**:
1. **Copy the exact error message** from the console
2. **Check which issue it matches** from Step 5 above
3. **Follow the solution** for that issue
4. **Test again** using Step 2

---

## Step 7: Update Email Configuration (If Needed)

If you need to change the "from" email address:

1. **Open**: `lib/email/client.ts`

2. **Find this line** (around line 12):
   ```typescript
   from = "Learning Management <onboarding@resend.dev>",
   ```

3. **Change it to** (if you have a verified domain):
   ```typescript
   from = "Learning Management <noreply@yourdomain.com>",
   ```

4. **Save the file** - Next.js will automatically reload

---

## Quick Checklist

Before asking for help, make sure you've:

- [ ] Checked server console for errors
- [ ] Run the test email endpoint
- [ ] Checked spam folder
- [ ] Verified API key in Resend dashboard
- [ ] Restarted dev server after any .env changes
- [ ] Tried sending to a different email address

---

## Need More Help?

If you're still having issues after following these steps:

1. **Gather this information**:
   - Screenshot of the error from browser console
   - Screenshot of server console errors
   - The exact error message from the test endpoint
   - Confirmation that API key is active in Resend dashboard

2. **Share this information** and I can help you fix the specific issue!

---

## Summary

The email **should** be sent immediately after signup, regardless of approval status. If it's not working, it's likely one of these issues:

1. **API key problem** - Most common
2. **Domain verification** - Required for production
3. **Email in spam** - Very common
4. **Network/server error** - Temporary issue

Follow the steps above to identify and fix the issue!

