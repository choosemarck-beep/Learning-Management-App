# Git Quick Start - Copy & Paste Commands

Follow these commands **IN ORDER** in your Terminal.

## Step 1: Navigate to Project

```bash
cd "/Users/marck.baldorado/Documents/Learning Management"
```

## Step 2: Check if Git is Installed

```bash
git --version
```

**If you see a version number**: ✅ Continue to Step 3
**If you see "command not found"**: Install Git first (see `GIT_SETUP_GUIDE.md`)

## Step 3: Configure Git (First Time Only)

```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

**Replace with your actual name and email!**

## Step 4: Initialize Git

```bash
git init
```

## Step 5: Remove .env Files from Tracking (If Needed)

```bash
git rm --cached .env .env.local 2>/dev/null || true
```

## Step 6: Add All Files

```bash
git add .
```

## Step 7: Check What Will Be Committed

```bash
git status
```

**Verify:**
- ✅ `.env` files are NOT in the list (they should be ignored)
- ✅ All your code files ARE in the list

## Step 8: Make First Commit

```bash
git commit -m "Initial commit - Learning Management App"
```

## Step 9: Create GitHub Repository

1. Go to: https://github.com/new
2. Repository name: `Learning-Management-App`
3. **Don't** check "Add README"
4. **Don't** add .gitignore
5. Click "Create repository"
6. **Copy the repository URL** (looks like: `https://github.com/yourusername/Learning-Management-App.git`)

## Step 10: Connect to GitHub

```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
```

**Replace with your actual repository URL!**

## Step 11: Push to GitHub

```bash
git push -u origin main
```

**If asked for password**: Use a Personal Access Token (see `GIT_SETUP_GUIDE.md` for how to create one)

## Step 12: Verify

1. Go to your GitHub repository
2. Check that all files are there
3. Verify `.env` files are **NOT** visible

---

## ✅ Done!

Your code is now on GitHub and ready for Cloudflare deployment!

