#!/bin/bash

# Vercel Environment Variables Setup Helper
# This script helps you prepare environment variables for Vercel

echo "=========================================="
echo "Vercel Environment Variables Setup Helper"
echo "=========================================="
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  Warning: .env file not found"
    echo "   You may need to create one or get values from Railway/other sources"
    echo ""
fi

echo "Required Environment Variables for Vercel:"
echo "=========================================="
echo ""

# DATABASE_URL
echo "1. DATABASE_URL"
echo "   - Get this from Railway dashboard"
echo "   - Go to Railway → Your PostgreSQL database → Variables tab"
echo "   - Copy the DATABASE_URL value"
echo ""

# NEXTAUTH_SECRET
echo "2. NEXTAUTH_SECRET"
if command -v openssl &> /dev/null; then
    SECRET=$(openssl rand -base64 32)
    echo "   Generated secret: $SECRET"
    echo "   (Copy this value)"
else
    echo "   Generate with: openssl rand -base64 32"
    echo "   Or use: https://generate-secret.vercel.app/32"
fi
echo ""

# NEXTAUTH_URL
echo "3. NEXTAUTH_URL"
echo "   - For first deploy: http://localhost:3000"
echo "   - After deploy: https://your-project.vercel.app"
echo "   (Update after first successful deployment)"
echo ""

# GEMINI_API_KEY
if [ -f .env ] && grep -q "GEMINI_API_KEY" .env; then
    GEMINI_KEY=$(grep "GEMINI_API_KEY" .env | cut -d '=' -f2 | tr -d '"' | tr -d "'")
    if [ ! -z "$GEMINI_KEY" ]; then
        echo "4. GEMINI_API_KEY"
        echo "   Found in .env: ${GEMINI_KEY:0:20}..."
        echo ""
    fi
else
    echo "4. GEMINI_API_KEY"
    echo "   - Get from your .env file or Google AI Studio"
    echo ""
fi

# RESEND_API_KEY
if [ -f .env ] && grep -q "RESEND_API_KEY" .env; then
    RESEND_KEY=$(grep "RESEND_API_KEY" .env | cut -d '=' -f2 | tr -d '"' | tr -d "'")
    if [ ! -z "$RESEND_KEY" ]; then
        echo "5. RESEND_API_KEY"
        echo "   Found in .env: ${RESEND_KEY:0:20}..."
        echo ""
    fi
else
    echo "5. RESEND_API_KEY (optional - if using email)"
    echo "   - Get from your .env file or Resend dashboard"
    echo ""
fi

# YOUTUBE_API_KEY
if [ -f .env ] && grep -q "YOUTUBE_API_KEY" .env; then
    YOUTUBE_KEY=$(grep "YOUTUBE_API_KEY" .env | cut -d '=' -f2 | tr -d '"' | tr -d "'")
    if [ ! -z "$YOUTUBE_KEY" ]; then
        echo "6. YOUTUBE_API_KEY (optional)"
        echo "   Found in .env: ${YOUTUBE_KEY:0:20}..."
        echo ""
    fi
fi

# VIMEO_API_TOKEN
if [ -f .env ] && grep -q "VIMEO_API_TOKEN" .env; then
    VIMEO_TOKEN=$(grep "VIMEO_API_TOKEN" .env | cut -d '=' -f2 | tr -d '"' | tr -d "'")
    if [ ! -z "$VIMEO_TOKEN" ]; then
        echo "7. VIMEO_API_TOKEN (optional)"
        echo "   Found in .env: ${VIMEO_TOKEN:0:20}..."
        echo ""
    fi
fi

echo "=========================================="
echo "Next Steps:"
echo "1. Copy the values above"
echo "2. Go to Vercel dashboard → Your Project → Settings → Environment Variables"
echo "3. Add each variable for Production, Preview, and Development"
echo "4. Deploy your project"
echo "=========================================="

