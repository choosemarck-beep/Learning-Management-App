# Cloudinary Setup Guide - Step by Step

This guide will help you set up Cloudinary for image storage. **You don't need to be a developer** - just follow these steps carefully.

---

## Step 1: Create a Cloudinary Account (5 minutes)

1. **Go to Cloudinary website**:
   - Open your web browser
   - Go to: https://cloudinary.com/users/register/free
   - Or search "Cloudinary sign up" in Google

2. **Sign up for free account**:
   - Enter your email address
   - Create a password
   - Click "Create Account"
   - **No credit card required!** ✅

3. **Verify your email**:
   - Check your email inbox
   - Click the verification link from Cloudinary
   - You'll be redirected to your dashboard

---

## Step 2: Get Your API Credentials (2 minutes)

Once you're logged into Cloudinary:

1. **Find the Dashboard**:
   - You should see your dashboard automatically
   - If not, click "Dashboard" in the top menu

2. **Copy Your Credentials**:
   - Look for a section called "Account Details" or "Dashboard"
   - You'll see three important values:
     - **Cloud Name** (e.g., `dxyz123abc`)
     - **API Key** (e.g., `123456789012345`)
     - **API Secret** (e.g., `abcdefghijklmnopqrstuvwxyz123456`)
   
   **Important**: The API Secret might be hidden - click "Reveal" to show it

3. **Save these three values**:
   - Write them down in a safe place (you'll need them in Step 3)
   - Or keep the Cloudinary dashboard open in another tab

---

## Step 3: Add Credentials to Vercel (5 minutes)

Now we need to add these credentials to your Vercel project so the app can use Cloudinary.

1. **Go to Vercel Dashboard**:
   - Open: https://vercel.com/dashboard
   - Log in if needed

2. **Find Your Project**:
   - Click on your project: "learning-management-app" (or whatever you named it)
   - You should see the project overview

3. **Go to Settings**:
   - Click "Settings" in the top menu
   - Click "Environment Variables" in the left sidebar

4. **Add Three Environment Variables**:
   
   Click "Add New" for each one:
   
   **Variable 1:**
   - **Key**: `CLOUDINARY_CLOUD_NAME`
   - **Value**: (paste your Cloud Name from Step 2)
   - **Environment**: Select all (Production, Preview, Development)
   - Click "Save"
   
   **Variable 2:**
   - **Key**: `CLOUDINARY_API_KEY`
   - **Value**: (paste your API Key from Step 2)
   - **Environment**: Select all (Production, Preview, Development)
   - Click "Save"
   
   **Variable 3:**
   - **Key**: `CLOUDINARY_API_SECRET`
   - **Value**: (paste your API Secret from Step 2)
   - **Environment**: Select all (Production, Preview, Development)
   - Click "Save"

5. **Redeploy Your App**:
   - After adding all three variables, go to "Deployments" tab
   - Click the three dots (⋯) on the latest deployment
   - Click "Redeploy"
   - This makes the new environment variables available to your app

---

## Step 4: Install Cloudinary Package (You'll need to do this)

**What this means**: We need to add the Cloudinary code library to your project.

### Option A: If you have Terminal/Command Line access:

1. **Open Terminal** (Mac) or Command Prompt (Windows):
   - **Mac**: Press `Cmd + Space`, type "Terminal", press Enter
   - **Windows**: Press `Win + R`, type "cmd", press Enter

2. **Navigate to your project folder**:
   ```bash
   cd "/Users/marck.baldorado/Documents/Learning Management"
   ```
   (Press Enter)

3. **Install Cloudinary**:
   ```bash
   npm install cloudinary
   ```
   (Press Enter and wait for it to finish - you'll see "added 1 package" when done)

4. **Done!** ✅

### Option B: If you don't have Terminal access:

**Don't worry!** I can add it to `package.json` and you can run `npm install` later, or it will install automatically when you push to GitHub and Vercel builds.

---

## Step 5: Test It Works (2 minutes)

After Vercel redeploys (Step 3):

1. **Go to your app**: https://learning-management-app-sigma.vercel.app
2. **Try uploading an image**:
   - Log in as Admin
   - Go to Media Management
   - Try uploading a carousel image
   - If it works, you'll see the image appear! ✅

---

## Troubleshooting

### "Cloudinary configuration is missing" error:

- **Check**: Did you add all three environment variables in Vercel?
- **Check**: Did you redeploy after adding them?
- **Solution**: Go back to Step 3 and make sure all three variables are added, then redeploy

### Images still showing 404 errors:

- **Wait**: It might take 1-2 minutes for Vercel to redeploy
- **Check**: Are the environment variables set for "Production" environment?
- **Solution**: Make sure you selected "Production" when adding variables

### Can't find API Secret:

- **Look for**: A "Reveal" or "Show" button next to the API Secret
- **Alternative**: You can regenerate it (but you'll need to update Vercel again)

---

## What Happens Next?

Once everything is set up:
- ✅ All new image uploads will go to Cloudinary
- ✅ Images will load from Cloudinary's CDN (fast!)
- ✅ Images will persist even after Vercel deployments
- ✅ You get 25GB free storage + 25GB bandwidth/month

**Old images** (the ones showing 404 errors) will still show errors until you re-upload them. But all **new uploads** will work perfectly!

---

## Need Help?

If you get stuck at any step:
1. Take a screenshot of what you see
2. Tell me which step you're on
3. I'll help you figure it out!

---

**Estimated Total Time**: 15-20 minutes
**Difficulty**: Easy (no coding required, just copying and pasting)

