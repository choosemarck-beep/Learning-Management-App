#!/bin/bash

# Cloudflare Pages Deployment Script
# Run this script to prepare your code for Cloudflare deployment

echo "🚀 Preparing your app for Cloudflare Pages deployment..."
echo ""

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📦 Initializing git repository..."
    git init
    echo "✅ Git initialized"
else
    echo "✅ Git repository already exists"
fi

# Check if .gitignore exists
if [ ! -f ".gitignore" ]; then
    echo "⚠️  Warning: .gitignore not found"
else
    echo "✅ .gitignore found"
fi

# Generate NEXTAUTH_SECRET if not already set
if [ -z "$NEXTAUTH_SECRET" ]; then
    echo ""
    echo "🔐 Generated NEXTAUTH_SECRET for you:"
    echo "   $(openssl rand -base64 32)"
    echo ""
    echo "   ⚠️  Save this! You'll need it for Cloudflare environment variables."
    echo ""
fi

# Check if code is committed
if git diff --quiet && git diff --cached --quiet; then
    echo "✅ All changes are committed"
else
    echo "📝 Staging all files..."
    git add .
    
    echo "💾 Committing changes..."
    git commit -m "Ready for Cloudflare deployment - $(date +%Y-%m-%d)"
    echo "✅ Changes committed"
fi

# Check if remote is set
if git remote -v | grep -q "origin"; then
    echo "✅ GitHub remote is configured"
    echo ""
    echo "📤 Ready to push! Run:"
    echo "   git push -u origin main"
else
    echo ""
    echo "⚠️  GitHub remote not configured yet"
    echo ""
    echo "📋 Next steps:"
    echo "   1. Create a repository on GitHub: https://github.com/new"
    echo "   2. Then run:"
    echo "      git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git"
    echo "      git push -u origin main"
fi

echo ""
echo "✅ Preparation complete!"
echo ""
echo "📚 Next: Follow the steps in DEPLOYMENT_CHECKLIST.md"
echo "   Or go to: https://dash.cloudflare.com → Workers & Pages → Create application"

