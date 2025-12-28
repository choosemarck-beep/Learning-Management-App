# Cloudflare Pages Deployment Guide

This guide will help you deploy your Learning Management Web App to Cloudflare Pages so others can test it.

## Prerequisites

1. **Cloudflare Account** (free tier works)
   - Sign up at: https://dash.cloudflare.com/sign-up
   - Free tier includes unlimited bandwidth and requests

2. **GitHub Repository**
   - Your code should be in a GitHub repository
   - If not already, push your code to GitHub

3. **Railway Database** (already set up)
   - Your PostgreSQL database on Railway
   - Keep the `DATABASE_URL` connection string handy

## Step 1: Prepare Your Repository

### 1.1 Push Code to GitHub

If you haven't already, push your code to GitHub:

```bash
# Initialize git if needed
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - ready for Cloudflare deployment"

# Add your GitHub repository as remote (replace with your repo URL)
git remote add origin https://github.com/yourusername/your-repo-name.git

# Push to GitHub
git push -u origin main
```

### 1.2 Create Cloudflare Pages Configuration

A `wrangler.toml` file will be created automatically, but we'll configure it through the Cloudflare dashboard.

## Step 2: Deploy to Cloudflare Pages

### 2.1 Connect GitHub to Cloudflare

1. **Go to Cloudflare Dashboard**
   - Visit: https://dash.cloudflare.com
   - Log in to your account

2. **Navigate to Pages**
   - Click "Workers & Pages" in the left sidebar
   - Click "Create application"
   - Select "Pages" tab
   - Click "Connect to Git"

3. **Authorize GitHub**
   - Click "Connect GitHub" or "Authorize Cloudflare"
   - Select your GitHub account
   - Authorize Cloudflare to access your repositories

4. **Select Your Repository**
   - Find your "Learning Management" repository
   - Click "Begin setup"

### 2.2 Configure Build Settings

Fill in the project configuration:

- **Project name**: `learning-management-app` (or your preferred name)
- **Production branch**: `main` (or `master` if that's your default branch)
- **Framework preset**: `Next.js`
- **Build command**: `npm run build`
- **Build output directory**: `.next`
- **Root directory**: `/` (leave as default)

**Important**: Cloudflare Pages for Next.js requires special configuration. Update these settings:

- **Build command**: `npm run build`
- **Build output directory**: `.next`
- **Node version**: `18` or `20` (select from dropdown)

### 2.3 Add Environment Variables

Before deploying, add your environment variables:

1. **Click "Environment variables"** in the project settings
2. **Add the following variables**:

```
DATABASE_URL=your-railway-postgresql-connection-string
NEXTAUTH_SECRET=your-generated-secret-here
NEXTAUTH_URL=https://your-project-name.pages.dev
GEMINI_API_KEY=your-gemini-api-key
RESEND_API_KEY=your-resend-api-key
```

**How to get values**:

- **DATABASE_URL**: Copy from Railway dashboard → Your database → Connect → Connection string
- **NEXTAUTH_SECRET**: Generate with: `openssl rand -base64 32` (or use: https://generate-secret.vercel.app/32)
- **NEXTAUTH_URL**: Will be `https://your-project-name.pages.dev` (you'll get this after first deploy)
- **GEMINI_API_KEY**: Your Google Gemini API key (from `.env` file)
- **RESEND_API_KEY**: Your Resend API key (from `.env` file)

**Important**: 
- For the first deploy, set `NEXTAUTH_URL` to `http://localhost:3000` temporarily
- After first deployment, update it to your actual Cloudflare Pages URL

### 2.4 Deploy

1. **Click "Save and Deploy"**
2. **Wait for build** (~3-5 minutes for first build)
3. **Your app will be live** at: `https://your-project-name.pages.dev`

### 2.5 Update NEXTAUTH_URL

After first deployment:

1. Go to your Cloudflare Pages project
2. Click "Settings" → "Environment variables"
3. Update `NEXTAUTH_URL` to: `https://your-actual-project-name.pages.dev`
4. Click "Save"
5. The app will automatically redeploy

## Step 3: Configure Next.js for Cloudflare Pages

Cloudflare Pages uses a different runtime than Vercel. We need to ensure compatibility:

### 3.1 Update next.config.js

Your `next.config.js` should work, but we may need to add Cloudflare-specific settings. The current config should be fine for most cases.

### 3.2 Database Migrations

After deployment, run migrations on your production database:

```bash
# Set Railway DATABASE_URL in your local .env
DATABASE_URL="your-railway-connection-string"

# Run migrations
npm run db:migrate
```

Or use Railway CLI:

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Run migrations
railway run npx prisma migrate deploy
```

## Step 4: Custom Domain (Optional)

If you want a custom domain:

1. Go to Cloudflare Pages project → "Custom domains"
2. Click "Set up a custom domain"
3. Enter your domain name
4. Follow DNS configuration instructions
5. Cloudflare will automatically configure SSL

## Step 5: Share Your App

Once deployed, share your Cloudflare Pages URL:

```
https://your-project-name.pages.dev
```

Anyone with this URL can access and test your webapp!

## Troubleshooting

### Build Fails

- **Check build logs** in Cloudflare Pages dashboard
- **Verify Node version** is 18 or 20
- **Check environment variables** are set correctly
- **Ensure all dependencies** are in `package.json`

### Database Connection Issues

- **Verify DATABASE_URL** is correct in environment variables
- **Check Railway database** is running and accessible
- **Verify IP allowlist** in Railway (if enabled)

### Authentication Not Working

- **Check NEXTAUTH_URL** matches your Cloudflare Pages URL exactly
- **Verify NEXTAUTH_SECRET** is set
- **Check browser console** for errors

### API Routes Not Working

- Cloudflare Pages supports Next.js API routes via serverless functions
- Ensure your API routes are in the `app/api` directory
- Check Cloudflare Pages logs for API errors

## Cloudflare Pages vs Vercel

**Cloudflare Pages Advantages**:
- ✅ Free tier with unlimited bandwidth
- ✅ Global CDN (faster worldwide)
- ✅ Built-in DDoS protection
- ✅ Free SSL certificates
- ✅ Custom domains included

**Considerations**:
- ⚠️ Build times may be slightly longer
- ⚠️ Some Next.js features may need adjustment
- ⚠️ Serverless functions have different limits

## Next Steps

1. **Test your deployment** thoroughly
2. **Share the URL** with testers
3. **Monitor usage** in Cloudflare dashboard
4. **Set up custom domain** if desired
5. **Configure analytics** (optional)

## Support

- **Cloudflare Pages Docs**: https://developers.cloudflare.com/pages/
- **Next.js on Cloudflare**: https://developers.cloudflare.com/pages/framework-guides/nextjs/
- **Cloudflare Community**: https://community.cloudflare.com/

