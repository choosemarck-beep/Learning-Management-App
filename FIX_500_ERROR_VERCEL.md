# Fix 500 Error on Vercel

The 500 error you're seeing is likely because Vercel can't connect to your Railway database.

## Immediate Fix: Add DATABASE_URL to Vercel

### Step 1: Get Railway DATABASE_URL

1. **Go to Railway**: https://railway.app
2. **Click your PostgreSQL database**
3. **Click "Variables" tab**
4. **Find `DATABASE_URL`**
5. **Click "Copy"** (or "Reveal" if hidden)
6. **Copy the entire value** (starts with `postgresql://`)

### Step 2: Add to Vercel

1. **Go to Vercel**: https://vercel.com/dashboard
2. **Click your project** (learning-management-app)
3. **Click "Settings"** (top navigation)
4. **Click "Environment Variables"** (left sidebar)
5. **Click "Add New"**
6. **Fill in**:
   - **Key**: `DATABASE_URL`
   - **Value**: Paste the Railway DATABASE_URL you copied
   - **Environments**: Select all three:
     - ✅ Production
     - ✅ Preview
     - ✅ Development
7. **Click "Save"**

### Step 3: Redeploy

1. **Go to "Deployments" tab**
2. **Click the three dots (⋯)** on the latest deployment
3. **Click "Redeploy"**
4. **Wait for deployment to complete** (~2-3 minutes)

## Check Vercel Logs for Exact Error

To see the exact error message:

1. **Go to Vercel Dashboard** → Your Project
2. **Click "Deployments" tab**
3. **Click on the latest deployment** (the one with the error)
4. **Click "Functions" or "Logs" tab**
5. **Look for error messages** - they'll tell you exactly what's wrong

Common errors you might see:
- `PrismaClientInitializationError: Can't reach database server`
- `Error: P1001: Can't reach database server`
- `Environment variable not found: DATABASE_URL`

## Why This Happens

The error occurs because:

1. **Dashboard Layout** (`app/(dashboard)/layout.tsx`) calls `getCurrentUser()`
2. **getCurrentUser()** uses NextAuth which may query the database
3. **Without DATABASE_URL**, Prisma can't connect to Railway
4. **This causes a 500 Internal Server Error** during server-side rendering

## Verify It's Fixed

After adding DATABASE_URL and redeploying:

1. **Refresh your Vercel app** (hard refresh: Ctrl+F5 / Cmd+Shift+R)
2. **Check the browser console** - the 500 error should be gone
3. **Try logging in** - it should work now

## Still Getting Errors?

If you still see errors after adding DATABASE_URL:

1. **Check Vercel logs** (see above) for the exact error
2. **Verify DATABASE_URL format**:
   - Should start with `postgresql://` or `postgres://`
   - Should contain: username, password, host, port, database
3. **Check Railway database status**:
   - Is the database running? (not paused)
   - Check Railway logs for connection issues
4. **Verify other required variables**:
   - `NEXTAUTH_SECRET` - Required for authentication
   - `NEXTAUTH_URL` - Should be your Vercel app URL

## Quick Checklist

- [ ] DATABASE_URL added to Vercel Environment Variables
- [ ] DATABASE_URL value matches Railway's DATABASE_URL
- [ ] DATABASE_URL set for Production, Preview, and Development
- [ ] Redeployed after adding the variable
- [ ] Checked Vercel logs for specific errors
- [ ] Railway database is running (not paused)

