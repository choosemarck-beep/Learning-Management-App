# Pre-Commit Security Checklist

## ✅ Run This Before Every Commit

### 1. Check for Sensitive Files
```bash
# Check if .env files are being tracked
git ls-files | grep -E "\.env$|\.env\.|secret|password|credential"

# Should return NOTHING - if it returns files, they shouldn't be committed!
```

### 2. Check Staged Files
```bash
# See what's about to be committed
git status

# Review changes
git diff --cached
```

### 3. Search for Hardcoded Secrets
```bash
# Search for common secret patterns in staged files
git diff --cached | grep -iE "password|secret|api.*key|token|postgresql://|AIzaSy|re_[a-z0-9]|sk-[a-z0-9]"

# Should only show:
# - Environment variable names (process.env.SECRET_NAME)
# - Placeholder values (your-secret-here)
# - Documentation examples (not real secrets)
```

### 4. Verify .gitignore is Working
```bash
# Check if sensitive files are ignored
git status --ignored | grep -E "\.env|secret|password|credential"

# Should show these files as ignored
```

## 🚨 Red Flags - DO NOT COMMIT IF YOU SEE:

- ❌ Actual API keys (AIzaSy..., re_..., sk-...)
- ❌ Database connection strings (postgresql://...)
- ❌ Real passwords or secrets
- ❌ `.env` files (even if empty)
- ❌ Private keys (*.pem, *.key files)
- ❌ Hardcoded credentials in code

## ✅ Safe to Commit:

- ✅ Environment variable names (`process.env.SECRET_NAME`)
- ✅ Placeholder values (`your-secret-here`)
- ✅ Documentation with examples (not real secrets)
- ✅ `.env.example` files (with placeholders only)
- ✅ Code that reads from `process.env`

## Quick Pre-Commit Command

Run this before committing:
```bash
# Check for secrets in staged files
git diff --cached | grep -iE "(password|secret|api.*key|token|postgresql://|AIzaSy|re_[a-z0-9]{20}|sk-[a-z0-9]{48})" | grep -v "process.env" | grep -v "your-" | grep -v "placeholder"

# If this returns anything, review it carefully before committing!
```

