# Fix Railway Database SSL Connection

Railway proxy databases (like `shortline.proxy.rlwy.net`) **require SSL connections**. If you're getting connection errors, you may need to add SSL parameters to your `DATABASE_URL`.

## Quick Fix: Add SSL to DATABASE_URL

### Step 1: Get Current DATABASE_URL from Railway

1. **Go to Railway** → Your PostgreSQL database
2. **Click "Variables" tab**
3. **Copy the `DATABASE_URL` value**

It will look like:
```
postgresql://postgres:password@shortline.proxy.rlwy.net:5432/railway
```

### Step 2: Add SSL Parameter

Add `?sslmode=require` to the end of your DATABASE_URL:

**Before:**
```
postgresql://postgres:password@shortline.proxy.rlwy.net:5432/railway
```

**After:**
```
postgresql://postgres:password@shortline.proxy.rlwy.net:5432/railway?sslmode=require
```

### Step 3: Update in Vercel

1. **Go to Vercel** → Your Project → Settings → Environment Variables
2. **Click on `DATABASE_URL`**
3. **Click "Edit"**
4. **Add `?sslmode=require` to the end** (if not already there)
5. **Click "Save"**

### Step 4: Redeploy

1. **Go to Deployments tab**
2. **Click three dots (⋯)** on latest deployment
3. **Click "Redeploy"**
4. **Wait 2-3 minutes**

### Step 5: Test

Visit: `https://your-app.vercel.app/api/health/database`

Should return: `"connectionStatus": "✅ Connected"`

## Alternative SSL Modes

If `sslmode=require` doesn't work, try:

### Option 1: Prefer SSL (recommended)
```
postgresql://...?sslmode=prefer
```

### Option 2: Allow SSL
```
postgresql://...?sslmode=allow
```

### Option 3: Disable SSL verification (not recommended, only for testing)
```
postgresql://...?sslmode=require&sslcert=&sslkey=&sslrootcert=
```

## How to Check if SSL is Needed

1. **Check your Railway database URL**:
   - If it contains `.proxy.rlwy.net` → **SSL required** ✅
   - If it contains `.railway.app` → **SSL required** ✅
   - If it's a direct IP → SSL may not be required

2. **Test connection**:
   - Visit: `https://your-app.vercel.app/api/health/database`
   - If you see SSL-related errors → Add `?sslmode=require`

## Common SSL Errors

### Error: "SSL connection required"
**Fix**: Add `?sslmode=require` to DATABASE_URL

### Error: "certificate verify failed"
**Fix**: Try `?sslmode=prefer` instead of `require`

### Error: "no pg_hba.conf entry"
**Fix**: This might be a firewall issue, not SSL. Check Railway database settings.

## Verify Connection

After adding SSL parameters:

1. **Test diagnostic endpoint**:
   ```
   https://your-app.vercel.app/api/health/database
   ```

2. **Check response**:
   - ✅ `"connectionStatus": "✅ Connected"` = Success!
   - ❌ Still failing? Check error message in response

3. **Try logging in**:
   - If diagnostic works, try logging in to your app
   - Should work now!

## Important Notes

- **Railway proxy URLs always require SSL** (`.proxy.rlwy.net`)
- **Don't use `sslmode=disable`** for Railway - it won't work
- **Always test after updating** DATABASE_URL in Vercel
- **Redeploy is required** after changing environment variables

## Still Not Working?

If SSL fix doesn't work:

1. **Check Railway database status**:
   - Make sure it's **Online** (not paused)
   - Check Railway logs for errors

2. **Verify DATABASE_URL format**:
   - Should be: `postgresql://user:password@host:port/database?sslmode=require`
   - No extra spaces or characters
   - Special characters in password should be URL-encoded

3. **Get fresh DATABASE_URL**:
   - Railway hostnames can change
   - Get latest from Railway → Variables tab

4. **Check Vercel logs**:
   - Vercel → Deployments → Latest → Functions/Logs
   - Look for specific error messages

