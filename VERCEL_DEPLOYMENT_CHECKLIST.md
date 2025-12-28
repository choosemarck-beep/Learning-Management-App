# Vercel Deployment Checklist

Use this checklist to track your progress through the Vercel setup process.

## Pre-Deployment Setup

- [ ] **Vercel Account Created**
  - Go to https://vercel.com
  - Sign up/login with GitHub
  - Account verified

- [ ] **GitHub Repository Ready**
  - Code is pushed to GitHub
  - Repository is accessible
  - Main branch is up to date

- [ ] **Railway Database Ready**
  - Database is created on Railway
  - `DATABASE_URL` is copied from Railway dashboard
  - Database is accessible

- [ ] **Environment Variables Prepared**
  - `DATABASE_URL` - From Railway
  - `NEXTAUTH_SECRET` - Generated (use: `openssl rand -base64 32`)
  - `GEMINI_API_KEY` - From your `.env` file
  - `RESEND_API_KEY` - From your `.env` file (if using email)
  - `YOUTUBE_API_KEY` - From your `.env` file (if using)
  - `VIMEO_API_TOKEN` - From your `.env` file (if using)

## Vercel Project Setup

- [ ] **Repository Imported**
  - Clicked "Add New Project" in Vercel
  - Selected "Learning-Management-App" repository
  - Repository imported successfully

- [ ] **Project Settings Configured**
  - Framework Preset: Next.js ✅
  - Root Directory: `/` ✅
  - Build Command: `npm run build` ✅
  - Output Directory: `.next` ✅
  - Install Command: `npm install` ✅

- [ ] **Environment Variables Added**
  - `DATABASE_URL` added (Production, Preview, Development)
  - `NEXTAUTH_SECRET` added (Production, Preview, Development)
  - `NEXTAUTH_URL` set to `http://localhost:3000` temporarily
  - `GEMINI_API_KEY` added (Production, Preview, Development)
  - `RESEND_API_KEY` added (if using email)
  - `YOUTUBE_API_KEY` added (if using YouTube)
  - `VIMEO_API_TOKEN` added (if using Vimeo)

## Deployment

- [ ] **First Deployment Triggered**
  - Clicked "Deploy" button
  - Build started successfully
  - Build completed without errors
  - Deployment URL received: `https://________________.vercel.app`

- [ ] **NEXTAUTH_URL Updated**
  - Copied Vercel deployment URL
  - Updated `NEXTAUTH_URL` in Vercel environment variables
  - Changed from `http://localhost:3000` to `https://your-project.vercel.app`
  - Redeployed (automatic or manual)

## Testing

- [ ] **Homepage Loads**
  - Visited Vercel URL
  - Page loads without errors
  - No console errors

- [ ] **Authentication Works**
  - Sign up form loads
  - Can create new account
  - Can log in with created account
  - Session persists after login

- [ ] **Database Connection**
  - Data saves to Railway database
  - Can retrieve data from database
  - No database connection errors

- [ ] **API Routes Work**
  - API endpoints respond correctly
  - No API errors in logs
  - Data flows correctly

- [ ] **Quiz Functionality**
  - Quizzes load correctly
  - Questions display properly
  - Quiz submission works
  - Results are saved

## Post-Deployment

- [ ] **Database Migrations Run** (if needed)
  - Connected to Railway database
  - Ran `npx prisma migrate deploy`
  - Migrations applied successfully

- [ ] **Monitoring Setup**
  - Vercel dashboard accessible
  - Build logs reviewed
  - Error logs checked

- [ ] **Ready for Testing**
  - Application is fully functional
  - URL shared with testers
  - All features working

## Troubleshooting Notes

If you encounter issues, note them here:

- Issue 1: ________________
  - Solution: ________________

- Issue 2: ________________
  - Solution: ________________

## Your Vercel URLs

- **Production**: https://________________.vercel.app
- **Preview**: https://________________-git-main-________________.vercel.app
- **Deployment Dashboard**: https://vercel.com/your-username/learning-management-app

---

**Next Steps After Deployment:**
1. Share URL with testers
2. Monitor Vercel dashboard for errors
3. Set up custom domain (optional)
4. Configure analytics (optional)

