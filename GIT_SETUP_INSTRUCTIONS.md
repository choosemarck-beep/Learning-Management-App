# Git Setup Instructions - Security First

## Quick Setup (Run in Your Terminal)

I've created a secure initialization script for you. Run this in your terminal:

```bash
cd "/Users/marck.baldorado/Documents/Learning Management"
./init-git-secure.sh
```

This script will:
1. ✅ Initialize git repository
2. ✅ Verify .env files are ignored
3. ✅ Scan for hardcoded secrets
4. ✅ Show what will be committed
5. ✅ Perform final security check

## Manual Setup (If You Prefer)

### Step 1: Initialize Git
```bash
cd "/Users/marck.baldorado/Documents/Learning Management"
git init
```

### Step 2: Verify .env is Ignored
```bash
# Check if .env is ignored
git status --ignored | grep .env

# Should show .env as ignored
```

### Step 3: Add Files
```bash
git add .
```

### Step 4: Security Check
```bash
# Check for secrets in staged files
git diff --staged | grep -iE "(password|secret|api.*key|token|postgresql://|AIzaSy|re_[a-z0-9]{20}|sk-[a-z0-9]{48})" | grep -v "process.env" | grep -v "your-" | grep -v "placeholder"

# Should return NOTHING - if it returns anything, review it!
```

### Step 5: Review What Will Be Committed
```bash
git status
```

### Step 6: Commit
```bash
git commit -m "Initial commit - security audit passed"
```

## What's Safe to Commit

✅ **Safe:**
- All source code files
- Configuration files (without secrets)
- Documentation files
- `.gitignore` file
- `package.json` and `package-lock.json`
- TypeScript configs
- All component and API files

❌ **NOT Safe (Should be ignored):**
- `.env` files
- `.env.local` files
- Any files with actual secrets
- Log files
- OS files (`.DS_Store`)

## After Committing

### Step 1: Create GitHub Repository
1. Go to: https://github.com/new
2. Create a new repository (don't initialize with README)
3. Copy the repository URL

### Step 2: Add Remote and Push
```bash
# Add your GitHub repository
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Push to GitHub
git push -u origin main
```

## Security Checklist

Before pushing to GitHub, verify:
- [ ] No `.env` files are committed
- [ ] No hardcoded API keys
- [ ] No hardcoded database URLs
- [ ] No real passwords or secrets
- [ ] Documentation only has placeholders

## Need Help?

- **Security Audit**: See `SECURITY_AUDIT.md`
- **Pre-Commit Check**: See `PRE_COMMIT_SECURITY_CHECK.md`
- **Summary**: See `SECURITY_SUMMARY.md`

