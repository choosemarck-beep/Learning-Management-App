#!/bin/bash

# Secure Git Initialization Script
# This script initializes git, performs security checks, and prepares for first commit

set -e  # Exit on error

echo "🔒 Security-First Git Initialization"
echo "======================================"
echo ""

# Step 1: Initialize Git
if [ ! -d ".git" ]; then
    echo "📦 Initializing git repository..."
    git init
    echo "✅ Git repository initialized"
else
    echo "✅ Git repository already exists"
fi

# Step 2: Check for sensitive files
echo ""
echo "🔍 Checking for sensitive files..."
echo ""

# Check if .env files exist and are ignored
if [ -f ".env" ] || [ -f ".env.local" ]; then
    echo "⚠️  Found .env files - checking if they're ignored..."
    
    # First, check if git is initialized
    if [ ! -d ".git" ]; then
        echo "   Git not initialized yet - .env files will be ignored after git init"
    else
        # Check if files are already tracked
        if git ls-files .env .env.local 2>/dev/null | grep -q ".env"; then
            echo "❌ WARNING: .env files are already tracked by git!"
            echo "   Removing them from git tracking (files will remain on disk)..."
            git rm --cached .env .env.local 2>/dev/null || true
            echo "✅ .env files removed from git tracking"
        fi
        
        # Now check if they're ignored
        if git check-ignore .env .env.local 2>/dev/null | grep -q ".env"; then
            echo "✅ .env files are properly ignored"
        else
            echo "⚠️  .env files may not be ignored - checking .gitignore..."
            if grep -q "^\.env" .gitignore || grep -q "^\.env\*" .gitignore; then
                echo "✅ .gitignore has .env patterns - files should be ignored"
            else
                echo "❌ ERROR: .gitignore missing .env patterns!"
                exit 1
            fi
        fi
    fi
else
    echo "✅ No .env files found (or already ignored)"
fi

# Step 3: Security check - look for hardcoded secrets
echo ""
echo "🔍 Scanning for potential secrets in code..."
echo ""

# Check for common secret patterns (excluding safe patterns)
SECRETS_FOUND=0

# Check for hardcoded API keys
if grep -r "AIzaSy[A-Za-z0-9_-]\{35\}" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" . 2>/dev/null | grep -v node_modules | grep -v ".git" | grep -v "process.env" > /dev/null; then
    echo "❌ Found potential hardcoded Google API keys"
    SECRETS_FOUND=1
fi

# Check for hardcoded database URLs
if grep -r "postgresql://[^\"'\\s]\{20,\}" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" . 2>/dev/null | grep -v node_modules | grep -v ".git" | grep -v "process.env" | grep -v "your-" | grep -v "placeholder" > /dev/null; then
    echo "❌ Found potential hardcoded database URLs"
    SECRETS_FOUND=1
fi

# Check for hardcoded Resend API keys
if grep -r "re_[A-Za-z0-9_-]\{20,\}" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" . 2>/dev/null | grep -v node_modules | grep -v ".git" | grep -v "process.env" | grep -v "your-" | grep -v "placeholder" > /dev/null; then
    echo "❌ Found potential hardcoded Resend API keys"
    SECRETS_FOUND=1
fi

if [ $SECRETS_FOUND -eq 0 ]; then
    echo "✅ No hardcoded secrets found"
fi

# Step 4: Show what will be committed
echo ""
echo "📋 Files ready to be committed:"
echo ""

git add .
git status --short | head -20

TOTAL_FILES=$(git status --short | wc -l | tr -d ' ')
echo ""
echo "Total files to commit: $TOTAL_FILES"

# Step 5: Final security check
echo ""
echo "🔒 Final security check..."
echo ""

# Check staged files for secrets
STAGED_SECRETS=$(git diff --staged 2>/dev/null | grep -iE "(password|secret|api.*key|token|postgresql://|AIzaSy|re_[a-z0-9]{20}|sk-[a-z0-9]{48})" | grep -v "process.env" | grep -v "your-" | grep -v "placeholder" | grep -v "generate" | wc -l | tr -d ' ')

if [ "$STAGED_SECRETS" -gt 0 ]; then
    echo "⚠️  WARNING: Found $STAGED_SECRETS potential secret(s) in staged files"
    echo "   Review these carefully before committing:"
    git diff --staged | grep -iE "(password|secret|api.*key|token|postgresql://|AIzaSy|re_[a-z0-9]{20}|sk-[a-z0-9]{48})" | grep -v "process.env" | grep -v "your-" | grep -v "placeholder" | grep -v "generate" | head -5
    echo ""
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Aborted. Please review and fix security issues first."
        exit 1
    fi
else
    echo "✅ No secrets found in staged files"
fi

# Step 6: Summary
echo ""
echo "======================================"
echo "✅ Security check passed!"
echo ""
echo "📝 Next steps:"
echo "   1. Review staged files: git status"
echo "   2. Commit: git commit -m 'Initial commit - security audit passed'"
echo "   3. Add remote: git remote add origin <your-github-repo-url>"
echo "   4. Push: git push -u origin main"
echo ""
echo "🔒 Security status: SAFE TO COMMIT"
echo "======================================"

