# Cloudflare Pages - Quick Start Checklist

Follow these steps to deploy your app to Cloudflare Pages:

## ✅ Pre-Deployment Checklist

- [ ] Code is pushed to GitHub
- [ ] Cloudflare account created (free tier works)
- [ ] Railway database is running
- [ ] You have all environment variable values ready

## 🚀 Deployment Steps

### Step 1: Push to GitHub (if not already done)

```bash
# Check if you're in a git repository
git status

# If not initialized, run:
git init
git add .
git commit -m "Ready for Cloudflare deployment"

# Add your GitHub repository
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

### Step 2: Deploy to Cloudflare Pages

1. **Go to**: https://dash.cloudflare.com
2. **Click**: "Workers & Pages" → "Create application" → "Pages" → "Connect to Git"
3. **Authorize**: Connect your GitHub account
4. **Select**: Your "Learning Management" repository
5. **Configure**:
   - Project name: `learning-management-app`
   - Framework: `Next.js`
   - Build command: `npm run build`
   - Build output: `.next`
   - Node version: `18` or `20`

### Step 3: Add Environment Variables

Before deploying, add these in Cloudflare Pages settings:

```
DATABASE_URL=your-railway-connection-string
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32
NEXTAUTH_URL=https://your-project-name.pages.dev
GEMINI_API_KEY=your-gemini-key
RESEND_API_KEY=your-resend-key
```

**Quick Generate NEXTAUTH_SECRET**:
```bash
openssl rand -base64 32
```

Or visit: https://generate-secret.vercel.app/32

### Step 4: Deploy & Update

1. **Click**: "Save and Deploy"
2. **Wait**: 3-5 minutes for first build
3. **Get URL**: `https://your-project-name.pages.dev`
4. **Update**: `NEXTAUTH_URL` to your actual Cloudflare Pages URL
5. **Redeploy**: Happens automatically after updating env vars

### Step 5: Run Database Migrations

```bash
# Set Railway DATABASE_URL in local .env
DATABASE_URL="your-railway-connection-string"

# Run migrations
npm run db:migrate
```

## 🎉 Done!

Your app is now live at: `https://your-project-name.pages.dev`

Share this URL with testers!

## 📚 Full Guide

See `docs/CLOUDFLARE_DEPLOYMENT.md` for detailed instructions and troubleshooting.

