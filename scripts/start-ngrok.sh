#!/bin/bash

# Start ngrok tunnel to port 3000
echo "Starting ngrok tunnel..."
echo "If this is your first time, you may need to sign up at https://ngrok.com and get your authtoken"
echo "Then run: npx ngrok config add-authtoken YOUR_TOKEN"
echo ""
echo "Access the ngrok web interface at: http://localhost:4040"
echo ""

npx ngrok http 3000

