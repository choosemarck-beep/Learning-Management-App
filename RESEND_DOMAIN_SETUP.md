# Resend Domain Setup Guide

## The Problem

Resend's free tier with `onboarding@resend.dev` has restrictions:
- ✅ Can send to: Your account owner email (`choosemarck@gmail.com`)
- ❌ Cannot send to: Other email addresses (like `layoutninja@gmail.com`)

## The Solution

To send emails to any recipient, you need to **verify a domain** in Resend.

---

## Option 1: Verify Your Domain (Recommended for Production)

### Step 1: Go to Resend Dashboard
1. Visit: https://resend.com/domains
2. Log in with your Resend account

### Step 2: Add Your Domain
1. Click "Add Domain"
2. Enter your domain (e.g., `yourdomain.com`)
3. Follow the verification steps

### Step 3: Add DNS Records
Resend will provide DNS records to add:
- **TXT record** for domain verification
- **SPF record** for email authentication
- **DKIM record** for email signing

### Step 4: Update Email Configuration
Once verified, update `lib/email/client.ts`:
```typescript
from = "Learning Management <noreply@yourdomain.com>",
```

### Step 5: Restart Server
```bash
# Stop server (Ctrl+C)
npm run dev
```

---

## Option 2: Use Test Email for Development (Quick Fix)

For now, you can test with your verified email:

1. **Sign up with**: `choosemarck@gmail.com` (your Resend account email)
2. **Check that email** for the onboarding message
3. **For production**, set up domain verification (Option 1)

---

## Option 3: Use a Different Email Service (Alternative)

If domain verification is not possible right now, consider:
- **Postmark** - $10/month, better for transactional emails
- **SendGrid** - Free tier (100 emails/day)
- **Mailgun** - Free for 3 months

---

## Current Status

- ✅ Email system is working correctly
- ✅ Code is properly configured
- ⚠️ **Limitation**: Can only send to `choosemarck@gmail.com` until domain is verified

---

## Next Steps

1. **For Development**: Test with `choosemarck@gmail.com`
2. **For Production**: Verify your domain in Resend
3. **Update Configuration**: Change "from" address after domain verification

---

## Quick Test

To test with your verified email:

1. Go to: `http://localhost:3000/signup`
2. Sign up with: `choosemarck@gmail.com`
3. Check that email inbox for the onboarding message

The email should arrive successfully!

