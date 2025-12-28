# Fix .env Files Being Tracked by Git

If your `.env` files are being tracked by git, follow these steps to fix it:

## Quick Fix

Run these commands in your terminal:

```bash
cd "/Users/marck.baldorado/Documents/Learning Management"

# Remove .env files from git tracking (files stay on your computer)
git rm --cached .env .env.local 2>/dev/null || true

# Verify they're now ignored
git status | grep .env

# Should show nothing (or show them as untracked, which is fine)
```

## Detailed Steps

### Step 1: Check if .env files are tracked
```bash
git ls-files | grep "\.env"
```

If this shows `.env` or `.env.local`, they're being tracked.

### Step 2: Remove from git tracking
```bash
# Remove from git (but keep files on disk)
git rm --cached .env
git rm --cached .env.local
```

### Step 3: Verify .gitignore
```bash
# Check .gitignore has .env patterns
cat .gitignore | grep -E "\.env"
```

Should show:
```
.env*.local
.env
.env.*
!.env.example
```

### Step 4: Verify they're now ignored
```bash
git status
```

`.env` files should NOT appear in the output.

### Step 5: Commit the removal
```bash
git add .gitignore
git commit -m "Remove .env files from tracking and update .gitignore"
```

## Why This Happens

If `.env` files were added to git BEFORE `.gitignore` was set up, git will continue tracking them even after adding them to `.gitignore`. The `git rm --cached` command removes them from git's tracking while keeping the actual files on your computer.

## Prevention

Always ensure `.gitignore` is set up BEFORE:
- Initializing git (`git init`)
- Adding files (`git add .`)
- Making your first commit

## Verify It's Fixed

After running the fix, verify:

```bash
# Should return nothing
git ls-files | grep "\.env"

# Should show .env as ignored
git status --ignored | grep .env
```

