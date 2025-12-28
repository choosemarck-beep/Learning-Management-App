# Cloudflare Pages Deployment Checklist

## ✅ Pre-Deployment (I'll do this for you)

- [x] Code is ready
- [x] NEXTAUTH_SECRET generation instructions provided
- [x] Git repository initialized
- [x] .env.example created

## 🔐 What You Need to Do (Requires Your Authentication)

### Step 1: Push Code to GitHub

**Option A: Create New Repository**
1. Go to: https://github.com/new
2. Create a new repository (e.g., "learning-management-app")
3. **Don't** initialize with README, .gitignore, or license
4. Copy the repository URL

**Option B: Use Existing Repository**
- If you already have a GitHub repo, use that URL

**Then run these commands in your terminal:**
```bash
cd "/Users/marck.baldorado/Documents/Learning Management"

# Add all files
git add .

# Commit
git commit -m "Initial commit - ready for Cloudflare deployment"

# Add your GitHub repository (replace with your actual repo URL)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Push to GitHub
git push -u origin main
```

### Step 2: Deploy to Cloudflare Pages

1. **Go to Cloudflare Dashboard**
   - Visit: https://dash.cloudflare.com
   - Sign up or log in (free account works)

2. **Create Pages Project**
   - Click "Workers & Pages" in left sidebar
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

5. **Configure Build Settings**
   - **Project name**: `learning-management-app` (or your choice)
   - **Production branch**: `main`
   - **Framework preset**: `Next.js`
   - **Build command**: `npm run build`
   - **Build output directory**: `.next`
   - **Root directory**: `/` (leave as default)
   - **Node version**: Select `18` or `20`

6. **Add Environment Variables** (BEFORE clicking Deploy)
   Click "Environment variables" and add:

   ```
   DATABASE_URL=your-railway-postgresql-connection-string
   NEXTAUTH_SECRET=generate-new-secret-here
   NEXTAUTH_URL=https://your-project-name.pages.dev
   GEMINI_API_KEY=your-gemini-api-key
   RESEND_API_KEY=your-resend-api-key
   ```

   **Where to get these:**
   - **DATABASE_URL**: Railway dashboard → Your database → Connect → Copy connection string
   - **NEXTAUTH_SECRET**: Generate with `openssl rand -base64 32` or https://generate-secret.vercel.app/32
   - **NEXTAUTH_URL**: Will be `https://your-project-name.pages.dev` (you'll get this after first deploy)
   - **GEMINI_API_KEY**: From your `.env` file
   - **RESEND_API_KEY**: From your `.env` file

   **Important**: For first deploy, set `NEXTAUTH_URL` to `http://localhost:3000` temporarily, then update after deployment.

7. **Deploy**
   - Click "Save and Deploy"
   - Wait 3-5 minutes for first build
   - Your app will be live at: `https://your-project-name.pages.dev`

8. **Update NEXTAUTH_URL**
   - After first deployment, go to Settings → Environment variables
   - Update `NEXTAUTH_URL` to your actual Cloudflare Pages URL
   - Save (will auto-redeploy)

### Step 3: Run Database Migrations

After deployment, run migrations on your production database:

```bash
# Set Railway DATABASE_URL in your local .env
DATABASE_URL="your-railway-connection-string"

# Run migrations
npm run db:migrate
```

## 🎉 Done!

Your app will be live at: `https://your-project-name.pages.dev`

Share this URL with testers!

## 📝 Quick Reference

- **Full Guide**: See `docs/CLOUDFLARE_DEPLOYMENT.md`
- **Troubleshooting**: See `docs/CLOUDFLARE_TROUBLESHOOTING.md`
- **Quick Start**: See `CLOUDFLARE_QUICK_START.md`

