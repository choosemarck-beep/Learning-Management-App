#!/bin/bash

# Navigate to project directory
cd "/Users/marck.baldorado/Documents/Learning Management"

# Stage the file
git add "app/(dashboard)/employee/profile/page.tsx"

# Commit the changes
git commit -m "Fix TypeScript error: Remove unreachable role checks in profile page"

# Push to GitHub
git push origin main

echo "✅ Changes pushed successfully!"

