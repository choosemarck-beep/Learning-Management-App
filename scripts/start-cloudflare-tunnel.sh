#!/bin/bash

# Start Cloudflare Tunnel to port 3000
# This creates a public HTTPS URL that tunnels to your local server

cd "$(dirname "$0")/.."

echo "Starting Cloudflare Tunnel..."
echo "This will create a public URL that tunnels to http://localhost:3000"
echo ""
echo "After the tunnel starts, you'll see a URL like:"
echo "  https://xxxx-xxxx-xxxx.trycloudflare.com"
echo ""
echo "Copy that URL and update NEXTAUTH_URL in your .env file"
echo ""

./cloudflared tunnel --url http://localhost:3000

