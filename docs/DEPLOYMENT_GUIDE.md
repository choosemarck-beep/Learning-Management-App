# Deployment Guide

Complete guide to deploying the Learning Management Web App to production.

## Prerequisites

- GitHub account
- Vercel account (free tier works)
- Railway account (free tier works)
- Node.js installed locally

## Step 1: GitHub Setup

### 1.1 Create Repository
1. Go to [GitHub](https://github.com) and create a new repository
2. Name it something like `learning-management-app`
3. Choose public or private
4. **Don't** initialize with README, .gitignore, or license (we already have these)

### 1.2 Initialize Git Locally
```bash
cd "/Users/marck.baldorado/Documents/Learning Management"
git init
git add .
git commit -m "Initial commit: Project setup with Next.js, Prisma, and design system"
```

### 1.3 Connect to GitHub
```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` and `YOUR_REPO_NAME` with your actual GitHub username and repository name.

## Step 2: Railway Database Setup

### 2.1 Create Railway Account
1. Go to [Railway](https://railway.app)
2. Sign up with GitHub (recommended) or email
3. Verify your email if needed

### 2.2 Create PostgreSQL Database
1. Click "New Project"
2. Select "Provision PostgreSQL"
3. Wait for database to be created (takes ~1 minute)
4. Click on the PostgreSQL service
5. Go to the "Variables" tab
6. Find `DATABASE_URL` - this is your connection string
7. **Copy this value** - you'll need it for Vercel

### 2.3 Test Database Connection (Optional)
You can test the connection locally:
1. Create `.env` file in project root
2. Add: `DATABASE_URL="your-railway-connection-string"`
3. Run: `npm run db:push` to push schema to database
4. Or run: `npm run db:migrate` to create migrations

## Step 3: Vercel Deployment

### 3.1 Connect GitHub Repository
1. Go to [Vercel](https://vercel.com)
2. Sign up/login with GitHub
3. Click "Add New Project"
4. Import your GitHub repository
5. Vercel will auto-detect Next.js

### 3.2 Configure Project Settings
- **Framework Preset**: Next.js (auto-detected)
- **Root Directory**: `./` (default)
- **Build Command**: `npm run build` (default)
- **Output Directory**: `.next` (default)
- **Install Command**: `npm install` (default)

### 3.3 Add Environment Variables
In Vercel project settings, go to "Environment Variables" and add:

```
DATABASE_URL=your-railway-connection-string-here
NEXTAUTH_SECRET=generate-a-random-secret-here
NEXTAUTH_URL=https://your-app-name.vercel.app
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX (optional, for analytics)
```

**How to generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```
Or use an online generator: https://generate-secret.vercel.app/32

**Important**: 
- `NEXTAUTH_URL` should be your Vercel app URL (you'll get this after first deploy)
- For first deploy, use `http://localhost:3000`, then update after deployment

### 3.4 Deploy
1. Click "Deploy"
2. Wait for build to complete (~2-3 minutes)
3. Your app will be live at `https://your-app-name.vercel.app`

### 3.5 Update NEXTAUTH_URL
After first deployment:
1. Go to Vercel project settings
2. Update `NEXTAUTH_URL` to your actual Vercel URL
3. Redeploy (or it will auto-redeploy on next push)

## Step 4: Run Database Migrations

After deployment, you need to run migrations on the production database:

### Option 1: From Local Machine
```bash
# Set Railway DATABASE_URL in your local .env
DATABASE_URL="your-railway-connection-string"

# Run migrations
npm run db:migrate
```

### Option 2: From Vercel (Recommended)
1. Go to Vercel project dashboard
2. Open "Deployments" tab
3. Click on latest deployment
4. Open "Functions" tab
5. You can run commands via Vercel CLI (if installed)

### Option 3: Railway CLI
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

## Step 5: Verify Deployment

1. **Check Vercel Deployment**
   - Visit your Vercel URL
   - App should load (even if database isn't connected yet)

2. **Check Database Connection**
   - Try to access a page that uses the database
   - Check Vercel logs for errors

3. **Test Authentication** (once implemented)
   - Try signing up
   - Try logging in

## Step 6: Continuous Deployment

Every time you push to GitHub:
1. Vercel automatically detects changes
2. Builds and deploys automatically
3. Updates your live site

**Important**: Remember to run migrations if you change the database schema!

## Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` is correct in Vercel
- Check Railway database is running
- Ensure database allows connections from Vercel IPs (Railway should handle this)

### Build Failures
- Check Vercel build logs
- Ensure all dependencies are in `package.json`
- Check for TypeScript errors: `npm run build` locally first

### Environment Variables Not Working
- Make sure variables are added to Vercel
- Redeploy after adding new variables
- Check variable names match exactly (case-sensitive)

### Migration Issues
- Run `npm run db:generate` before migrations
- Check Prisma schema is valid
- Verify DATABASE_URL is correct

## Next Steps

After successful deployment:
1. Set up Google Analytics (if using)
2. Configure custom domain (optional)
3. Set up error tracking (Sentry - future)
4. Monitor performance
5. Set up CI/CD workflows (optional)

## Useful Commands

```bash
# Local development
npm run dev

# Build locally to test
npm run build
npm run start

# Database operations
npm run db:generate    # Generate Prisma client
npm run db:migrate     # Create and run migrations
npm run db:push        # Push schema changes (dev)
npm run db:studio      # Open Prisma Studio (GUI)

# Production database migrations
DATABASE_URL="your-production-url" npm run db:migrate
```

## Support Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Railway Documentation](https://docs.railway.app)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma Migrations](https://www.prisma.io/docs/concepts/components/prisma-migrate)

---

**Note**: Remember that database migrations must be run manually from your local machine with the Railway DATABASE_URL set in your `.env` file, as mentioned in your project memory.

