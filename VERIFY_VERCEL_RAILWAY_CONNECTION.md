# Verify Vercel ↔ Railway Database Connection

This guide helps you test if Vercel can successfully connect to your Railway PostgreSQL database.

## Quick Test: Use the Diagnostic Endpoint

After deploying, visit this URL in your browser:

```
https://your-app.vercel.app/api/health/database
```

Replace `your-app` with your actual Vercel app name.

### What to Look For:

#### ✅ **Success Response** (Status 200):
```json
{
  "timestamp": "2025-01-28T...",
  "databaseUrl": "✅ Set (hidden for security)",
  "connectionStatus": "✅ Connected",
  "details": {
    "connectionTime": "45ms",
    "userCount": 10,
    "schemaAccess": "✅ Accessible"
  }
}
```

#### ❌ **Failure Response** (Status 500):
```json
{
  "timestamp": "2025-01-28T...",
  "databaseUrl": "✅ Set (hidden for security)",
  "connectionStatus": "❌ Failed",
  "error": "Error message here",
  "details": {
    "errorCode": "P1001",
    "help": "Cannot reach database server..."
  }
}
```

## Common Error Codes & Solutions

### P1001: Cannot reach database server
**Problem**: Vercel can't connect to Railway database.

**Solutions**:
1. **Check Railway database status**:
   - Go to Railway → Your PostgreSQL database
   - Make sure it's **running** (not paused)
   - Railway free tier databases pause after inactivity

2. **Check DATABASE_URL host**:
   - Railway databases use dynamic hostnames
   - If you copied DATABASE_URL a while ago, it might be outdated
   - Get a fresh DATABASE_URL from Railway

3. **Check Railway database region**:
   - Some regions might have connectivity issues
   - Try restarting the database in Railway

### P1000: Authentication failed
**Problem**: Database credentials are incorrect.

**Solutions**:
1. **Get fresh DATABASE_URL from Railway**:
   - Go to Railway → PostgreSQL → Variables tab
   - Copy the `DATABASE_URL` value
   - Update it in Vercel Environment Variables

2. **Check for special characters**:
   - If password has special characters, they might need URL encoding
   - Railway usually handles this automatically

### P1003: Database does not exist
**Problem**: Database name in DATABASE_URL is wrong.

**Solutions**:
1. **Verify database name**:
   - Check Railway → PostgreSQL → Variables
   - Compare database name in DATABASE_URL

### ENOTFOUND / ECONNREFUSED
**Problem**: Cannot resolve database hostname.

**Solutions**:
1. **Check DATABASE_URL format**:
   - Should start with `postgresql://` or `postgres://`
   - Should contain: `username:password@host:port/database`

2. **Get fresh DATABASE_URL**:
   - Railway hostnames can change
   - Always get the latest from Railway dashboard

## Step-by-Step Verification

### Step 1: Check Railway Database Status

1. **Go to Railway**: https://railway.app
2. **Click your PostgreSQL database**
3. **Check status**:
   - ✅ **Running** = Good
   - ⏸️ **Paused** = Click "Resume" or "Start"
   - ❌ **Stopped** = Click "Start"

### Step 2: Get Fresh DATABASE_URL

1. **In Railway PostgreSQL service**:
   - Click **"Variables"** tab
   - Find `DATABASE_URL`
   - Click **"Copy"** (or "Reveal" if hidden)
   - **Save this value**

### Step 3: Verify in Vercel

1. **Go to Vercel**: https://vercel.com/dashboard
2. **Click your project** → **Settings** → **Environment Variables**
3. **Check DATABASE_URL**:
   - Does it exist? ✅
   - Does the value match Railway? Compare them
   - Is it set for **Production, Preview, and Development**? ✅

### Step 4: Update if Needed

If DATABASE_URL is different or missing:

1. **Click on DATABASE_URL** in Vercel
2. **Click "Edit"**
3. **Paste the fresh value from Railway**
4. **Make sure all environments are selected**
5. **Click "Save"**

### Step 5: Redeploy

After updating environment variables:

1. **Go to Deployments tab**
2. **Click three dots (⋯)** on latest deployment
3. **Click "Redeploy"**
4. **Wait for deployment** (~2-3 minutes)

### Step 6: Test Connection

1. **Visit**: `https://your-app.vercel.app/api/health/database`
2. **Check the response**:
   - ✅ Status 200 = Connected!
   - ❌ Status 500 = Check error message

## Manual Connection Test (Alternative)

If the diagnostic endpoint doesn't work, you can test locally:

1. **Add Railway DATABASE_URL to your local `.env`**:
   ```env
   DATABASE_URL="postgresql://..."
   ```

2. **Run Prisma Studio**:
   ```bash
   npm run db:studio
   ```

3. **If Prisma Studio opens** = Connection works!
4. **If it errors** = Check DATABASE_URL format

## Troubleshooting Checklist

- [ ] Railway database is **running** (not paused)
- [ ] DATABASE_URL exists in **Vercel Environment Variables**
- [ ] DATABASE_URL value **matches** Railway's DATABASE_URL
- [ ] DATABASE_URL is set for **all environments** (Production, Preview, Development)
- [ ] Vercel deployment **completed** after adding/updating DATABASE_URL
- [ ] Diagnostic endpoint returns **Status 200**
- [ ] No error codes (P1001, P1000, etc.)

## Still Not Working?

If you've checked everything and it's still not working:

1. **Check Vercel deployment logs**:
   - Go to Vercel → Your Project → Deployments
   - Click latest deployment → **Functions** or **Logs** tab
   - Look for database connection errors

2. **Check Railway logs**:
   - Go to Railway → PostgreSQL → **Logs** tab
   - Look for connection attempts or errors

3. **Try restarting Railway database**:
   - Railway → PostgreSQL → Click "Restart"
   - Wait 1-2 minutes
   - Test again

4. **Verify DATABASE_URL format**:
   - Should be: `postgresql://user:password@host:port/database`
   - No spaces or extra characters
   - Special characters in password should be URL-encoded

## Next Steps

Once the diagnostic endpoint returns ✅ Connected:

1. **Try logging in** to your app
2. **Check if data loads** (dashboard, courses, etc.)
3. **Monitor Vercel logs** for any runtime errors

The diagnostic endpoint is safe to leave in production - it only reads data and doesn't expose sensitive information.

