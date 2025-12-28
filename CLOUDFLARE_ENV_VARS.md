# Cloudflare Pages Environment Variables

Copy and paste these into Cloudflare Pages → Settings → Environment variables

## Required Environment Variables

```
DATABASE_URL=your-railway-postgresql-connection-string
NEXTAUTH_SECRET=generate-new-secret-here
NEXTAUTH_URL=https://your-project-name.pages.dev
GEMINI_API_KEY=your-gemini-api-key
RESEND_API_KEY=your-resend-api-key
```

## How to Get Each Value

### DATABASE_URL
1. Go to Railway dashboard: https://railway.app
2. Click on your PostgreSQL database
3. Click "Connect" or "Variables" tab
4. Copy the `DATABASE_URL` connection string
5. Paste it here (starts with `postgresql://`)

### NEXTAUTH_SECRET
Generate a new secret using:
```bash
openssl rand -base64 32
```
Or visit: https://generate-secret.vercel.app/32

⚠️ **IMPORTANT**: Generate a NEW secret for production - don't reuse development secrets!

### NEXTAUTH_URL
- **For first deploy**: Use `http://localhost:3000` temporarily
- **After deployment**: Update to `https://your-project-name.pages.dev` (your actual Cloudflare Pages URL)

### GEMINI_API_KEY
1. Check your local `.env` file
2. Copy the value of `GEMINI_API_KEY=`
3. Paste it here (without the `GEMINI_API_KEY=` part)

### RESEND_API_KEY
1. Check your local `.env` file
2. Copy the value of `RESEND_API_KEY=`
3. Paste it here (without the `RESEND_API_KEY=` part)

## Important Notes

⚠️ **Add these BEFORE clicking "Deploy"** - otherwise your app won't work!

⚠️ **After first deployment**, update `NEXTAUTH_URL` to your actual Cloudflare Pages URL

⚠️ **Keep these values secret** - don't share them publicly

