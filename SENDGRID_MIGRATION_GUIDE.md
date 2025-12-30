# SendGrid Migration Guide

## Migration Complete ✅

The email service has been migrated from **Resend** to **SendGrid**.

## What Changed

### 1. Package Update
- **Removed**: `resend` package
- **Added**: `@sendgrid/mail` package

### 2. Environment Variable
- **Old**: `RESEND_API_KEY=re_...`
- **New**: `SENDGRID_API_KEY=SG....`

### 3. Code Changes
- Updated `lib/email/client.ts` to use SendGrid API
- Updated default "from" address to `noreply@sendgrid.net`
- All React Email templates continue to work (no changes needed)

## Setup Instructions

### Step 1: Get SendGrid API Key

1. **Sign up for SendGrid** (if you don't have an account):
   - Go to: https://signup.sendgrid.com/
   - Create a free account (100 emails/day = 3,000/month)

2. **Create an API Key**:
   - Log in to SendGrid dashboard
   - Go to **Settings** → **API Keys**
   - Click **Create API Key**
   - Name it: "Learning Management App"
   - Choose **Full Access** (or **Restricted Access** with Mail Send permissions)
   - Click **Create & View**
   - **IMPORTANT**: Copy the API key immediately! It starts with `SG.` and looks like: `SG.abc123xyz...`
   - ⚠️ You won't be able to see it again after closing the window

### Step 2: Update Environment Variables

#### Local Development (.env file)
```env
# Replace RESEND_API_KEY with SENDGRID_API_KEY
SENDGRID_API_KEY=SG.your_actual_api_key_here
```

#### Vercel Production
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. **Remove** `RESEND_API_KEY` (if it exists)
3. **Add** `SENDGRID_API_KEY` with your SendGrid API key
4. Set it for **Production**, **Preview**, and **Development** environments
5. Redeploy your application

### Step 3: Verify Setup

1. **Test Email Sending**:
   ```bash
   # Start your dev server
   npm run dev
   
   # Test via API (or use your app's signup flow)
   curl -X POST http://localhost:3000/api/test-email \
     -H "Content-Type: application/json" \
     -d '{"to": "your-email@example.com"}'
   ```

2. **Check Email Delivery**:
   - Check your inbox (and spam folder)
   - Verify email was received
   - Check SendGrid dashboard → **Activity** to see email status

## SendGrid Free Tier Benefits

✅ **100 emails per day** (3,000 per month)  
✅ **Can send to any email address** (no domain verification required)  
✅ **No branding in footer** (professional appearance)  
✅ **Good deliverability**  
✅ **Free forever** (not a trial)

## Default "From" Address

The default "from" address is: `Learning Management <noreply@sendgrid.net>`

**For Production** (recommended):
- Verify your domain in SendGrid for better deliverability
- Update the "from" address in `lib/email/client.ts` to use your domain:
  ```typescript
  from = "Learning Management <noreply@yourdomain.com>"
  ```

**Domain Verification Steps**:
1. Go to SendGrid Dashboard → **Settings** → **Sender Authentication**
2. Click **Authenticate Your Domain**
3. Follow the DNS setup instructions
4. Once verified, update the "from" address

## Troubleshooting

### Error: "SENDGRID_API_KEY is not set"
- **Solution**: Make sure you've added `SENDGRID_API_KEY` to your `.env` file and Vercel environment variables

### Error: "Unauthorized" or "403 Forbidden"
- **Solution**: Check that your API key is correct and has "Mail Send" permissions

### Emails Not Arriving
- **Check**: SendGrid Dashboard → **Activity** → See if emails are being sent
- **Check**: Spam folder
- **Check**: SendGrid Dashboard → **Suppressions** → See if email is blocked

### Rate Limit Exceeded
- **Free tier limit**: 100 emails/day
- **Solution**: Wait 24 hours or upgrade to a paid plan

## Code Structure (No Changes Needed)

The abstraction layer in `lib/email/client.ts` means:
- ✅ All existing email functions work the same way
- ✅ React Email templates continue to work
- ✅ No changes needed to `lib/email/sendEmail.ts`
- ✅ No changes needed to email templates

## Next Steps

1. ✅ Update environment variables (local and Vercel)
2. ✅ Test email sending
3. ✅ Verify emails are being delivered
4. ⚠️ (Optional) Verify your domain for better deliverability

## Support

- **SendGrid Documentation**: https://docs.sendgrid.com/
- **SendGrid Dashboard**: https://app.sendgrid.com/
- **API Reference**: https://docs.sendgrid.com/api-reference

---

**Migration Date**: December 30, 2024  
**Previous Service**: Resend  
**New Service**: SendGrid

