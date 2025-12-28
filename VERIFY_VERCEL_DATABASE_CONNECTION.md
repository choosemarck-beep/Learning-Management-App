# Verify Vercel Database Connection

If login isn't working, Vercel might not be connected to your Railway database. Follow these steps to check and fix it.

## Step 1: Check Vercel Environment Variables

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Click on your project** (Learning-Management-App or similar)
3. **Go to Settings** (top navigation)
4. **Click "Environment Variables"** (left sidebar)
5. **Look for `DATABASE_URL`**:
   - ✅ If you see it → Check Step 2 (verify the value is correct)
   - ❌ If you DON'T see it → Go to Step 3 (add it)

## Step 2: Verify DATABASE_URL Value

If `DATABASE_URL` exists in Vercel:

1. **Check the value**:
   - Click on `DATABASE_URL` to see its value (it will be hidden/masked)
   - It should start with: `postgresql://` or `postgres://`
   - It should contain your Railway database connection details

2. **Compare with Railway**:
   - Go to Railway: https://railway.app
   - Click on your PostgreSQL database
   - Go to "Variables" tab
   - Copy the `DATABASE_URL` value
   - Compare with what's in Vercel (they should match)

3. **If they don't match**:
   - Update Vercel's `DATABASE_URL` with the Railway value
   - See Step 3 for instructions

## Step 3: Add DATABASE_URL to Vercel

If `DATABASE_URL` is missing or incorrect:

### Get Railway DATABASE_URL:

1. **Go to Railway**: https://railway.app
2. **Login** to your account
3. **Find your PostgreSQL database**:
   - Look for a project with PostgreSQL service
   - Click on the PostgreSQL service
4. **Get the connection string**:
   - Click on the **"Variables"** tab
   - Find `DATABASE_URL`
   - **Click the copy icon** (or click "Reveal" if hidden)
   - **Copy the entire value**

### Add to Vercel:

1. **Go to Vercel Dashboard** → Your Project → Settings → Environment Variables
2. **Click "Add New"** button
3. **Fill in the form**:
   - **Key**: `DATABASE_URL`
   - **Value**: Paste the Railway `DATABASE_URL` you just copied
   - **Environments**: Select all three:
     - ✅ Production
     - ✅ Preview
     - ✅ Development
4. **Click "Save"**

## Step 4: Verify Other Required Variables

While you're in Environment Variables, make sure these are also set:

### Required Variables:
- ✅ `DATABASE_URL` - Railway PostgreSQL connection string
- ✅ `NEXTAUTH_SECRET` - Random secret for authentication
- ✅ `NEXTAUTH_URL` - Your Vercel app URL (e.g., `https://your-app.vercel.app`)

### Optional but Recommended:
- `GEMINI_API_KEY` - For AI question generation
- `RESEND_API_KEY` - For sending emails
- `YOUTUBE_API_KEY` - If using YouTube videos
- `VIMEO_API_TOKEN` - If using Vimeo videos

## Step 5: Redeploy After Adding Variables

After adding/updating environment variables:

1. **Go to Vercel Dashboard** → Your Project → Deployments
2. **Click the three dots** (⋯) on the latest deployment
3. **Click "Redeploy"**
4. **Or**: Make a small change and push to GitHub (triggers new deployment)

**Important**: Environment variable changes require a new deployment to take effect!

## Step 6: Test Database Connection

After redeploying, test if the connection works:

1. **Try logging in** with your credentials
2. **Check Vercel deployment logs**:
   - Go to your deployment
   - Click "Functions" or "Logs" tab
   - Look for any database connection errors

3. **Common errors to look for**:
   - `Can't reach database server`
   - `Connection refused`
   - `Authentication failed`
   - `PrismaClientInitializationError`

## Troubleshooting

### Error: "Can't reach database server"
- **Cause**: Railway database might be paused
- **Fix**: Go to Railway → Your database → Make sure it's running (not paused)

### Error: "Authentication failed"
- **Cause**: DATABASE_URL might be incorrect or expired
- **Fix**: Get a fresh DATABASE_URL from Railway and update Vercel

### Error: "Prisma Client not generated"
- **Cause**: Build process issue
- **Fix**: Check that build command includes `prisma generate` (should be: `prisma generate && next build`)

### Still Not Working?
1. **Check Railway database status**:
   - Is the database running?
   - Is it paused?
   - Check Railway logs for errors

2. **Verify DATABASE_URL format**:
   - Should start with `postgresql://` or `postgres://`
   - Should contain: username, password, host, port, database name
   - Example: `postgresql://user:password@hostname:5432/railway`

3. **Test connection locally**:
   - Add Railway DATABASE_URL to your local `.env` file
   - Run: `npm run db:push` (should connect successfully)
   - If it works locally but not on Vercel, it's an environment variable issue

## Quick Checklist

- [ ] DATABASE_URL exists in Vercel Environment Variables
- [ ] DATABASE_URL value matches Railway's DATABASE_URL
- [ ] DATABASE_URL is set for Production, Preview, and Development
- [ ] Railway database is running (not paused)
- [ ] Vercel deployment completed after adding variables
- [ ] Tried logging in after deployment

## Next Steps

After verifying the connection:
1. Try logging in again
2. If it works, the issue was the missing DATABASE_URL
3. If it still doesn't work, check the deployment logs for specific errors

