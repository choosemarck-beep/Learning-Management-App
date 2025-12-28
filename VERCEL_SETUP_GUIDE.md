# Vercel Setup Guide - Step by Step

This guide will help you migrate from Cloudflare Pages to Vercel. Follow these steps in order.

## Prerequisites

- GitHub repository already set up (✅ You have this)
- Railway database already set up (✅ You have this)
- Environment variables from your `.env` file

## Step 1: Create/Login to Vercel Account

1. **Go to Vercel**: https://vercel.com
2. **Sign up or Login**:
   - Click "Sign Up" or "Log In"
   - **Recommended**: Sign up with GitHub (one-click setup)
   - This automatically authorizes Vercel to access your GitHub repositories
3. **Verify Email** (if new account):
   - Check your email for verification link
   - Click to verify your account

**✅ Mark this complete when done**: You should see the Vercel dashboard

---

## Step 2: Import GitHub Repository

1. **In Vercel Dashboard**:
   - Click the **"Add New Project"** button (top right, or in the main dashboard)
2. **Import Git Repository**:
   - You'll see a list of your GitHub repositories
   - Find and click on **"Learning-Management-App"** (or your repo name)
   - Click **"Import"**
3. **Vercel Auto-Detection**:
   - Vercel will automatically detect Next.js
   - Framework Preset should show: **"Next.js"**
   - If it doesn't, select "Next.js" from the dropdown

**✅ Mark this complete when done**: You should see the project configuration page

---

## Step 3: Configure Project Settings

On the project configuration page, verify these settings (Vercel should auto-detect most):

- **Project Name**: `learning-management-app` (or your choice)
- **Framework Preset**: `Next.js` ✅ (auto-detected)
- **Root Directory**: `/` (default - leave as is)
- **Build Command**: `npm run build` ✅ (auto-detected)
- **Output Directory**: `.next` ✅ (auto-detected)
- **Install Command**: `npm install` ✅ (auto-detected)

**⚠️ DO NOT CLICK "Deploy" YET** - We need to add environment variables first!

---

## Step 4: Add Environment Variables

**CRITICAL**: Add these BEFORE deploying!

1. **On the same configuration page**, scroll down to **"Environment Variables"** section
2. **Click "Add"** for each variable below
3. **For each variable**, select all three environments:
   - ✅ Production
   - ✅ Preview  
   - ✅ Development

### Required Environment Variables:

#### 1. DATABASE_URL
- **Name**: `DATABASE_URL`
- **Value**: Copy from Railway dashboard
  - Go to Railway → Your PostgreSQL database → Variables tab
  - Copy the `DATABASE_URL` value
- **Environments**: Production, Preview, Development

#### 2. NEXTAUTH_SECRET
- **Name**: `NEXTAUTH_SECRET`
- **Value**: Generate a new secret:
  ```bash
  openssl rand -base64 32
  ```
  Or use: https://generate-secret.vercel.app/32
- **Environments**: Production, Preview, Development

#### 3. NEXTAUTH_URL
- **Name**: `NEXTAUTH_URL`
- **Value**: `http://localhost:3000` (temporary - we'll update after first deploy)
- **Environments**: Production, Preview, Development

#### 4. GEMINI_API_KEY
- **Name**: `GEMINI_API_KEY`
- **Value**: Your existing Gemini API key (from your `.env` file)
- **Environments**: Production, Preview, Development

#### 5. RESEND_API_KEY (if using email)
- **Name**: `RESEND_API_KEY`
- **Value**: Your existing Resend API key (from your `.env` file)
- **Environments**: Production, Preview, Development

#### 6. YOUTUBE_API_KEY (if using YouTube videos)
- **Name**: `YOUTUBE_API_KEY`
- **Value**: Your existing YouTube API key (from your `.env` file)
- **Environments**: Production, Preview, Development

#### 7. VIMEO_API_TOKEN (if using Vimeo videos)
- **Name**: `VIMEO_API_TOKEN`
- **Value**: Your existing Vimeo API token (from your `.env` file)
- **Environments**: Production, Preview, Development

**✅ Mark this complete when done**: All environment variables should be listed in the Environment Variables section

---

## Step 5: Deploy

1. **Click "Deploy"** button (bottom of the page)
2. **Wait for Build**:
   - First build takes 3-5 minutes
   - You'll see build logs in real-time
   - Watch for any errors (there shouldn't be any!)
3. **Build Success**:
   - You'll see "Build Completed" message
   - Your app URL will be: `https://learning-management-app.vercel.app` (or your project name)

**✅ Mark this complete when done**: Build should succeed without errors

---

## Step 6: Update NEXTAUTH_URL

After successful deployment:

1. **Get Your Vercel URL**:
   - In Vercel dashboard, go to your project
   - Click on the deployment (latest one)
   - Copy the URL (e.g., `https://learning-management-app.vercel.app`)

2. **Update Environment Variable**:
   - Go to Project Settings → Environment Variables
   - Find `NEXTAUTH_URL`
   - Click "Edit"
   - Change value from `http://localhost:3000` to your Vercel URL: `https://your-project.vercel.app`
   - Make sure it's updated for **Production** environment
   - Click "Save"

3. **Redeploy**:
   - Go to "Deployments" tab
   - Click the three dots (⋯) on the latest deployment
   - Click "Redeploy"
   - Or push a new commit to trigger automatic redeploy

**✅ Mark this complete when done**: NEXTAUTH_URL updated and app redeployed

---

## Step 7: Test Your Application

Visit your Vercel URL and test:

1. **Homepage**: Should load without errors
2. **Authentication**:
   - Try signing up (if registration is open)
   - Try logging in
   - Verify sessions work correctly
3. **Database**:
   - Create a test account
   - Verify data saves to Railway database
4. **API Routes**:
   - Test any API endpoints
   - Check browser console for errors
5. **Quiz Functionality**:
   - Test quiz taking
   - Verify questions load
   - Test quiz submission

**✅ Mark this complete when done**: All functionality works on Vercel

---

## Troubleshooting

### Build Fails
- Check build logs in Vercel dashboard
- Verify all environment variables are set
- Ensure `DATABASE_URL` is correct
- Check that Prisma client is generated (should happen automatically)

### Authentication Not Working
- Verify `NEXTAUTH_URL` matches your Vercel URL exactly
- Check `NEXTAUTH_SECRET` is set
- Ensure cookies are enabled in browser

### Database Connection Issues
- Verify `DATABASE_URL` from Railway is correct
- Check Railway database is running
- Ensure database allows connections from Vercel IPs

### Environment Variables Not Working
- Make sure variables are set for the correct environment (Production/Preview/Development)
- Redeploy after adding new variables
- Check variable names match exactly (case-sensitive)

---

## Next Steps

After successful deployment:

1. **Share Your URL**: Give testers your Vercel URL
2. **Monitor Deployments**: Vercel automatically deploys on every push to `main` branch
3. **Set Up Custom Domain** (optional): Add your own domain in Vercel project settings
4. **Configure Analytics** (optional): Add Google Analytics or Vercel Analytics

---

## Support

- **Vercel Docs**: https://vercel.com/docs
- **Next.js on Vercel**: https://vercel.com/docs/frameworks/nextjs
- **Vercel Support**: https://vercel.com/support

---

## Checklist

- [ ] Vercel account created/logged in
- [ ] GitHub repository imported
- [ ] Project settings configured
- [ ] All environment variables added
- [ ] First deployment successful
- [ ] NEXTAUTH_URL updated
- [ ] Application tested and working
- [ ] Ready to share with testers!

