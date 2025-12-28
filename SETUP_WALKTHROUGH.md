# Complete Setup Walkthrough: Vercel + GitHub + Railway

Follow this guide step-by-step. I'll walk you through everything.

## Current Status Check

Before we start, let's verify what you already have:

### ✅ What You Should Already Have:
- [ ] GitHub repository: `Learning-Management-App` (or similar name)
- [ ] Railway account with PostgreSQL database
- [ ] Code pushed to GitHub
- [ ] Railway `DATABASE_URL` connection string

### 📝 Quick Check Commands

Run these in your terminal to verify:

```bash
# Check if GitHub is connected
git remote -v

# Check if you have uncommitted changes
git status

# Check if Railway DATABASE_URL is in your .env
cat .env | grep DATABASE_URL
```

---

## Part 1: GitHub Setup (If Not Already Done)

### Step 1.1: Verify GitHub Repository

1. **Check your GitHub repository**:
   - Go to: https://github.com/choosemarck-beep/Learning-Management-App
   - Make sure it exists and has your code

2. **If repository doesn't exist or needs updates**:
   ```bash
   cd "/Users/marck.baldorado/Documents/Learning Management"
   
   # Check current status
   git status
   
   # If you have changes, commit them
   git add .
   git commit -m "Prepare for Vercel deployment"
   
   # Push to GitHub
   git push origin main
   ```

**✅ Checkpoint**: Your code should be on GitHub

---

## Part 2: Railway Database Setup (If Not Already Done)

### Step 2.1: Verify Railway Database

1. **Go to Railway**: https://railway.app
2. **Login** to your account
3. **Find your PostgreSQL database**:
   - Look for a project with a PostgreSQL service
   - Click on the PostgreSQL service

### Step 2.2: Get DATABASE_URL

1. **In Railway PostgreSQL service**:
   - Click on the **"Variables"** tab
   - Find `DATABASE_URL`
   - **Click the copy icon** to copy the connection string
   - **Save this somewhere safe** - you'll need it for Vercel

**Example format**: `postgresql://postgres:password@hostname:port/railway`

**✅ Checkpoint**: You have your Railway `DATABASE_URL` copied

---

## Part 3: Vercel Account Setup

### Step 3.1: Create/Login to Vercel

1. **Go to Vercel**: https://vercel.com
2. **Click "Sign Up"** (or "Log In" if you have an account)
3. **Choose "Continue with GitHub"**:
   - This is the easiest option
   - It automatically connects your GitHub account
   - Click "Authorize Vercel" when prompted

4. **Verify Email** (if new account):
   - Check your email
   - Click the verification link

**✅ Checkpoint**: You're logged into Vercel and see the dashboard

---

## Part 4: Import Project to Vercel

### Step 4.1: Add New Project

1. **In Vercel Dashboard**:
   - Click the **"Add New..."** button (top right)
   - Or click **"Add New Project"** from the main page

2. **Import Git Repository**:
   - You'll see "Import Git Repository"
   - If GitHub isn't connected, click "Connect GitHub Account"
   - You'll see a list of your repositories

3. **Select Your Repository**:
   - Find **"Learning-Management-App"** (or your repo name)
   - Click **"Import"** next to it

**✅ Checkpoint**: You see the project configuration page

---

## Part 5: Configure Project Settings

### Step 5.1: Verify Auto-Detected Settings

Vercel should auto-detect Next.js. Verify these settings:

- **Project Name**: `learning-management-app` (or change if you want)
- **Framework Preset**: Should show **"Next.js"** ✅
- **Root Directory**: `/` (leave as default)
- **Build Command**: `npm run build` ✅
- **Output Directory**: `.next` ✅
- **Install Command**: `npm install` ✅

**⚠️ IMPORTANT**: Don't click "Deploy" yet! We need to add environment variables first.

**✅ Checkpoint**: Settings are configured correctly

---

## Part 6: Prepare Environment Variables

### Step 6.1: Get Your Environment Variables

Run this helper script to see what you need:

```bash
cd "/Users/marck.baldorado/Documents/Learning Management"
./scripts/vercel-env-setup.sh
```

Or manually collect these values:

1. **DATABASE_URL**: From Railway (you copied this earlier)
2. **NEXTAUTH_SECRET**: Generate with:
   ```bash
   openssl rand -base64 32
   ```
   Or use: https://generate-secret.vercel.app/32
3. **GEMINI_API_KEY**: From your `.env` file
4. **RESEND_API_KEY**: From your `.env` file (if using email)
5. **YOUTUBE_API_KEY**: From your `.env` file (if using)
6. **VIMEO_API_TOKEN**: From your `.env` file (if using)

**✅ Checkpoint**: You have all your environment variable values ready

---

## Part 7: Add Environment Variables to Vercel

### Step 7.1: Add Variables in Vercel

**Still on the project configuration page**, scroll down to **"Environment Variables"**:

1. **For each variable below**, click **"Add"**:
   - Enter the **Name**
   - Enter the **Value**
   - **Select all three environments**: Production, Preview, Development
   - Click **"Save"**

### Step 7.2: Required Variables

Add these one by one:

#### 1. DATABASE_URL
- **Name**: `DATABASE_URL`
- **Value**: Your Railway connection string (paste it)
- **Environments**: ✅ Production, ✅ Preview, ✅ Development

#### 2. NEXTAUTH_SECRET
- **Name**: `NEXTAUTH_SECRET`
- **Value**: The secret you generated (from Step 6.1)
- **Environments**: ✅ Production, ✅ Preview, ✅ Development

#### 3. NEXTAUTH_URL
- **Name**: `NEXTAUTH_URL`
- **Value**: `http://localhost:3000` (temporary - we'll update after deploy)
- **Environments**: ✅ Production, ✅ Preview, ✅ Development

#### 4. GEMINI_API_KEY
- **Name**: `GEMINI_API_KEY`
- **Value**: Your Gemini API key (from `.env`)
- **Environments**: ✅ Production, ✅ Preview, ✅ Development

#### 5. RESEND_API_KEY (if using email)
- **Name**: `RESEND_API_KEY`
- **Value**: Your Resend API key (from `.env`)
- **Environments**: ✅ Production, ✅ Preview, ✅ Development

#### 6. YOUTUBE_API_KEY (if using YouTube)
- **Name**: `YOUTUBE_API_KEY`
- **Value**: Your YouTube API key (from `.env`)
- **Environments**: ✅ Production, ✅ Preview, ✅ Development

#### 7. VIMEO_API_TOKEN (if using Vimeo)
- **Name**: `VIMEO_API_TOKEN`
- **Value**: Your Vimeo API token (from `.env`)
- **Environments**: ✅ Production, ✅ Preview, ✅ Development

**✅ Checkpoint**: All environment variables are added to Vercel

---

## Part 8: Deploy to Vercel

### Step 8.1: Start Deployment

1. **Scroll to the bottom** of the configuration page
2. **Click the "Deploy" button**
3. **Watch the build logs**:
   - Build will take 3-5 minutes
   - You'll see real-time progress
   - Watch for any errors (there shouldn't be any!)

### Step 8.2: Wait for Build

You'll see:
- ✅ Installing dependencies
- ✅ Building Next.js app
- ✅ Generating Prisma client
- ✅ Build completed successfully

**✅ Checkpoint**: Build completes successfully

### Step 8.3: Get Your Vercel URL

After build completes:
- You'll see: **"Congratulations! Your project has been deployed"**
- Your URL will be: `https://learning-management-app.vercel.app` (or your project name)
- **Copy this URL** - you'll need it next!

**✅ Checkpoint**: You have your Vercel deployment URL

---

## Part 9: Update NEXTAUTH_URL

### Step 9.1: Update the Environment Variable

1. **In Vercel Dashboard**:
   - Go to your project (click on it)
   - Click **"Settings"** (top menu)
   - Click **"Environment Variables"** (left sidebar)

2. **Find NEXTAUTH_URL**:
   - Click the **three dots (⋯)** next to it
   - Click **"Edit"**

3. **Update the Value**:
   - Change from: `http://localhost:3000`
   - Change to: `https://your-actual-vercel-url.vercel.app`
   - (Use the URL you got in Step 8.3)
   - Make sure it's updated for **Production** environment
   - Click **"Save"**

### Step 9.2: Redeploy

1. **Go to "Deployments" tab** (top menu)
2. **Find the latest deployment**
3. **Click the three dots (⋯)** on the right
4. **Click "Redeploy"**
5. **Confirm redeploy**

**✅ Checkpoint**: NEXTAUTH_URL updated and app redeployed

---

## Part 10: Test Your Deployment

### Step 10.1: Visit Your App

1. **Open your Vercel URL** in a browser:
   - `https://your-project.vercel.app`

2. **Check the homepage**:
   - Should load without errors
   - No console errors (check browser DevTools)

### Step 10.2: Test Authentication

1. **Try signing up** (if registration is open):
   - Fill out the signup form
   - Submit
   - Should create account successfully

2. **Try logging in**:
   - Use the account you just created
   - Should log in successfully
   - Should redirect to dashboard

### Step 10.3: Test Database

1. **Check if data saves**:
   - Create a test account
   - Go to Railway dashboard
   - Check if user appears in database

2. **Check Vercel logs**:
   - Go to Vercel → Your Project → "Deployments"
   - Click on latest deployment
   - Click "Functions" tab
   - Check for any errors

### Step 10.4: Test API Routes

1. **Test a few API endpoints**:
   - Try accessing `/api/courses` (if exists)
   - Check browser network tab for responses
   - Verify no 500 errors

**✅ Checkpoint**: All functionality works correctly

---

## Part 11: Run Database Migrations (If Needed)

### Step 11.1: Check if Migrations Are Needed

If you've made database schema changes, you need to run migrations:

```bash
# Set your Railway DATABASE_URL in local .env
DATABASE_URL="your-railway-connection-string"

# Run migrations
cd "/Users/marck.baldorado/Documents/Learning Management"
npm run db:migrate
```

Or use Railway CLI:
```bash
# Install Railway CLI (if not installed)
npm i -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Run migrations
railway run npx prisma migrate deploy
```

**✅ Checkpoint**: Database migrations are up to date

---

## Part 12: Verify Everything Works

### Final Checklist

- [ ] ✅ Vercel deployment is live
- [ ] ✅ Homepage loads correctly
- [ ] ✅ Authentication works (signup/login)
- [ ] ✅ Database connection works
- [ ] ✅ API routes respond correctly
- [ ] ✅ No errors in Vercel logs
- [ ] ✅ NEXTAUTH_URL is correct
- [ ] ✅ Environment variables are set

---

## Troubleshooting

### Build Fails

**Check**:
- Vercel build logs for specific errors
- All environment variables are set
- `DATABASE_URL` is correct
- No TypeScript errors (shouldn't be any with Vercel!)

### Authentication Not Working

**Check**:
- `NEXTAUTH_URL` matches your Vercel URL exactly
- `NEXTAUTH_SECRET` is set
- Cookies are enabled in browser
- Try clearing browser cookies and retry

### Database Connection Issues

**Check**:
- `DATABASE_URL` from Railway is correct
- Railway database is running
- Database allows connections (Railway should handle this)

### Environment Variables Not Working

**Check**:
- Variables are set for correct environment (Production/Preview/Development)
- Variable names match exactly (case-sensitive)
- Redeploy after adding new variables

---

## Success! 🎉

If everything works, you're done! Your app is now live on Vercel.

**Your app URL**: `https://your-project.vercel.app`

**Next Steps**:
1. Share the URL with testers
2. Monitor Vercel dashboard for any issues
3. Set up custom domain (optional)
4. Configure analytics (optional)

---

## Need Help?

If you get stuck at any step:
1. Check the error message in Vercel build logs
2. Review the troubleshooting section above
3. Check Vercel documentation: https://vercel.com/docs
4. Ask me for help with the specific step!

Good luck! 🚀

