#!/bin/bash

# Cloudflare Tunnel Startup Script
# This script will download cloudflared if needed and start the tunnel

echo "🚀 Starting Cloudflare Tunnel..."
echo ""

# Check if cloudflared exists locally
if [ -f "./cloudflared" ]; then
    echo "✅ Found local cloudflared binary"
    ./cloudflared tunnel --url http://localhost:3000
else
    echo "📦 Downloading cloudflared via npx..."
    npx -y cloudflared tunnel --url http://localhost:3000
fi

