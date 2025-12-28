# Git Setup Guide - Step by Step

This guide will teach you how to set up Git and connect your project to GitHub, even if you've never used Git before.

## What is Git?

**Git** is like a time machine for your code. It:
- Saves snapshots of your code (called "commits")
- Lets you go back to previous versions if something breaks
- Helps multiple people work on the same project
- Tracks all changes you make

**GitHub** is like a cloud storage for your code. It:
- Stores your code online
- Makes it easy to share with others
- Works with services like Cloudflare Pages for deployment

---

## Part 1: Install Git (If Not Already Installed)

### Check if Git is Already Installed

Open Terminal and type:
```bash
git --version
```

**If you see a version number** (like `git version 2.39.0`):
✅ Git is already installed! Skip to Part 2.

**If you see "command not found"**:
❌ Git is not installed. Follow the steps below.

### Install Git on Mac

**Option 1: Using Homebrew (Recommended)**
```bash
# Install Homebrew first (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Then install Git
brew install git
```

**Option 2: Download from Website**
1. Go to: https://git-scm.com/download/mac
2. Download the installer
3. Run the installer
4. Follow the installation wizard

### Verify Installation

After installing, verify it works:
```bash
git --version
```

You should see: `git version 2.x.x` (or similar)

---

## Part 2: Configure Git (First Time Setup)

Before using Git, you need to tell it who you are.

### Set Your Name

```bash
git config --global user.name "Your Name"
```

**Example:**
```bash
git config --global user.name "Marck Baldorado"
```

### Set Your Email

```bash
git config --global user.email "your.email@example.com"
```

**Example:**
```bash
git config --global user.email "choosemarck@gmail.com"
```

**Important:** Use the same email as your GitHub account!

### Verify Configuration

Check that it's set correctly:
```bash
git config --global user.name
git config --global user.email
```

---

## Part 3: Create GitHub Account (If You Don't Have One)

1. Go to: https://github.com/signup
2. Choose a username (e.g., `choosemarck-beep`)
3. Enter your email
4. Create a password
5. Verify your email
6. Complete the setup

---

## Part 4: Set Up Your Project with Git

### Step 1: Navigate to Your Project

Open Terminal and go to your project folder:
```bash
cd "/Users/marck.baldorado/Documents/Learning Management"
```

Verify you're in the right place:
```bash
pwd
```

Should show: `/Users/marck.baldorado/Documents/Learning Management`

### Step 2: Initialize Git Repository

This tells Git to start tracking changes in this folder:
```bash
git init
```

**What this does:**
- Creates a hidden `.git` folder
- Tells Git this folder is a repository
- Prepares Git to track your files

**Expected output:**
```
Initialized empty Git repository in /Users/marck.baldorado/Documents/Learning Management/.git
```

### Step 3: Check What Files Will Be Tracked

See what Git sees:
```bash
git status
```

**You'll see:**
- **Untracked files**: Files Git sees but isn't tracking yet
- **Changes not staged**: Files that were modified
- **Ignored files**: Files in `.gitignore` (like `.env`)

### Step 4: Verify .env Files Are Ignored

**CRITICAL SECURITY STEP!** Make sure `.env` files are ignored:
```bash
git status --ignored | grep .env
```

**Should show:**
```
.env
.env.local
```

If `.env` files appear in the main list (not under "Ignored files"), they're being tracked! Fix it:
```bash
git rm --cached .env .env.local 2>/dev/null || true
```

### Step 5: Add Files to Git

Add all files (except those in `.gitignore`):
```bash
git add .
```

**What this does:**
- Stages all files for commit
- Respects `.gitignore` (won't add `.env` files)
- Prepares files to be saved in a commit

**Check what's staged:**
```bash
git status
```

Files should show in green under "Changes to be committed"

### Step 6: Make Your First Commit

Save a snapshot of your code:
```bash
git commit -m "Initial commit - Learning Management App"
```

**What this does:**
- Creates a snapshot of all your files
- Saves it with a message
- This is like saving a checkpoint in a game

**Expected output:**
```
[main (root-commit) abc1234] Initial commit - Learning Management App
 X files changed, Y insertions(+)
```

---

## Part 5: Connect to GitHub

### Step 1: Create Repository on GitHub

1. Go to: https://github.com/new
2. **Repository name**: `Learning-Management-App` (or your choice)
3. **Description**: (optional) "Learning Management Web App with Gamification"
4. **Visibility**: Choose **Public** (free) or **Private**
5. **IMPORTANT**: 
   - ❌ **Don't** check "Add a README file"
   - ❌ **Don't** add .gitignore (we already have one)
   - ❌ **Don't** add a license
6. Click **"Create repository"**

### Step 2: Copy Repository URL

After creating, GitHub will show you a page with commands. Look for the repository URL:
```
https://github.com/choosemarck-beep/Learning-Management-App.git
```

**Copy this URL!**

### Step 3: Connect Local Git to GitHub

In your Terminal, run:
```bash
git remote add origin https://github.com/choosemarck-beep/Learning-Management-App.git
```

**Replace the URL** with your actual repository URL!

**Verify it's connected:**
```bash
git remote -v
```

Should show:
```
origin  https://github.com/choosemarck-beep/Learning-Management-App.git (fetch)
origin  https://github.com/choosemarck-beep/Learning-Management-App.git (push)
```

### Step 4: Push to GitHub

Upload your code to GitHub:
```bash
git push -u origin main
```

**What this does:**
- Uploads all your commits to GitHub
- Sets up tracking so future pushes are easier
- Makes your code available online

**If asked for credentials:**
- **Username**: Your GitHub username
- **Password**: Use a **Personal Access Token** (not your GitHub password)

**How to create a Personal Access Token:**
1. Go to: https://github.com/settings/tokens
2. Click "Generate new token" → "Generate new token (classic)"
3. Give it a name: "Learning Management App"
4. Select scopes: Check `repo` (full control of private repositories)
5. Click "Generate token"
6. **Copy the token immediately** (you won't see it again!)
7. Use this token as your password when pushing

---

## Part 6: Verify Everything Worked

### Check GitHub

1. Go to your repository on GitHub:
   ```
   https://github.com/choosemarck-beep/Learning-Management-App
   ```
2. You should see all your files!
3. Check that `.env` files are **NOT** visible (they should be ignored)

### Check Local Git Status

```bash
git status
```

Should show:
```
On branch main
Your branch is up to date with 'origin/main'.
nothing to commit, working tree clean
```

---

## Common Git Commands You'll Use

### See What Changed
```bash
git status
```

### Add Files
```bash
git add .                    # Add all files
git add filename.ts          # Add specific file
```

### Commit Changes
```bash
git commit -m "Description of what you changed"
```

### Push to GitHub
```bash
git push
```

### Pull Latest Changes (if working with others)
```bash
git pull
```

### See History
```bash
git log
```

---

## Troubleshooting

### "fatal: not a git repository"
**Problem**: You're not in a git repository
**Solution**: Run `git init` first

### ".env files are being tracked"
**Problem**: .env files were added before .gitignore
**Solution**: 
```bash
git rm --cached .env .env.local
git commit -m "Remove .env files from tracking"
```

### "Permission denied" when pushing
**Problem**: Authentication failed
**Solution**: Use Personal Access Token instead of password

### "Updates were rejected"
**Problem**: GitHub has changes you don't have locally
**Solution**: 
```bash
git pull
# Resolve any conflicts
git push
```

---

## Quick Reference Checklist

- [ ] Git installed (`git --version` works)
- [ ] Git configured (name and email set)
- [ ] GitHub account created
- [ ] Project folder navigated to
- [ ] Git initialized (`git init`)
- [ ] .env files verified as ignored
- [ ] Files added (`git add .`)
- [ ] First commit made (`git commit`)
- [ ] GitHub repository created
- [ ] Remote added (`git remote add origin`)
- [ ] Code pushed (`git push -u origin main`)
- [ ] Verified on GitHub (files visible, .env NOT visible)

---

## Next Steps

Once your code is on GitHub, you can:
1. **Deploy to Cloudflare Pages** (see `DEPLOYMENT_CHECKLIST.md`)
2. **Share with team members**
3. **Track all changes**
4. **Go back to previous versions** if needed

---

## Need Help?

- **Git Documentation**: https://git-scm.com/doc
- **GitHub Guides**: https://guides.github.com
- **Visual Git Guide**: https://learngitbranching.js.org

