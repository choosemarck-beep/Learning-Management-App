# Quick Start Guide

Get your Learning Management Web App up and running in minutes!

## 🚀 Installation Steps

### 1. Install Dependencies
```bash
cd "/Users/marck.baldorado/Documents/Learning Management"
npm install
```

This will install all required packages including:
- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Prisma
- And all other dependencies

### 2. Set Up Environment Variables
```bash
# Copy the example environment file
cp .env.example .env
```

Then edit `.env` and add:
```env
# For now, you can use a placeholder - we'll set up Railway database later
DATABASE_URL="postgresql://placeholder"

# Generate a secret (run: openssl rand -base64 32)
NEXTAUTH_SECRET="your-generated-secret-here"

# Local development URL
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Generate Prisma Client
```bash
npm run db:generate
```

This generates the Prisma client based on your schema.

### 4. Start Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

You should see: "Ahoy Mate! 🏴‍☠️ Welcome to your Learning Management Web App"

## 📝 Next Steps

### Set Up Database (When Ready)
1. Create Railway account and PostgreSQL database
2. Copy `DATABASE_URL` from Railway
3. Update `.env` with real `DATABASE_URL`
4. Run migrations: `npm run db:migrate`

### Start Building Features
1. Review [BUILD_ORDER.md](./BUILD_ORDER.md) for development phases
2. Check [wireframes](./wireframes/) for design references
3. Start with base UI components
4. Build authentication
5. Create dashboard

## 🛠️ Available Commands

```bash
# Development
npm run dev          # Start dev server (port 3000)
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Database
npm run db:generate  # Generate Prisma client
npm run db:migrate   # Run migrations
npm run db:push      # Push schema (dev only)
npm run db:studio    # Open Prisma Studio (database GUI)
```

## 📚 Documentation

- **[README.md](../README.md)** - Project overview
- **[.cursorrules](../.cursorrules)** - Complete project rules
- **[BUILD_ORDER.md](./BUILD_ORDER.md)** - Development phases
- **[TEAM_ROLES.md](./TEAM_ROLES.md)** - Team structure
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Deployment instructions

## 🎨 Design System

Colors, typography, and theme constants are already set up:
- Check `lib/constants/colors.ts` for color palette
- Check `lib/constants/theme.ts` for spacing, transitions
- Check `lib/constants/gamification.ts` for game mechanics
- Check `tailwind.config.ts` for Tailwind configuration

## ✅ Verification Checklist

- [ ] Dependencies installed (`npm install`)
- [ ] `.env` file created with placeholders
- [ ] Prisma client generated (`npm run db:generate`)
- [ ] Dev server runs (`npm run dev`)
- [ ] App loads at http://localhost:3000
- [ ] No console errors

## 🐛 Troubleshooting

### Port 3000 already in use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
# Or use a different port
PORT=3001 npm run dev
```

### Prisma errors
```bash
# Regenerate Prisma client
npm run db:generate

# If schema changed, run migrations
npm run db:migrate
```

### TypeScript errors
```bash
# Check TypeScript config
npx tsc --noEmit
```

### Module not found errors
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

## 🎯 What's Next?

1. **Set up database** - Follow [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) Step 2
2. **Create wireframes** - Start with dashboard and authentication flows
3. **Build base components** - Button, Card, Input components
4. **Implement authentication** - NextAuth.js setup
5. **Build dashboard** - User stats, course list, navigation

Happy coding! 🏴‍☠️

