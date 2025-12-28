# Learning Management Web App

A mobile-first, gamified learning management web app with a pirate/nautical theme, inspired by Duolingo's engaging user experience.

## 🎯 Project Overview

- **Type**: Progressive Web App (PWA)
- **Platform**: Web (Mobile-first)
- **Theme**: Pirate/Nautical with gamification
- **UX Standard**: Duolingo-inspired customer experience

## 🚀 Tech Stack

### Frontend
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: CSS Modules (scoped, component-level styles)
- **Animations**: Framer Motion
- **State Management**: Zustand + React Query
- **Forms**: React Hook Form + Zod
- **Icons**: Lucide React

### Backend
- **API**: Next.js API Routes
- **Database**: PostgreSQL (Railway)
- **ORM**: Prisma
- **Authentication**: NextAuth.js v5

### Deployment
- **Frontend/API**: Vercel
- **Database**: Railway
- **Version Control**: GitHub

## 📁 Project Structure

```
/app                    # Next.js App Router
  /(auth)              # Authentication routes
  /(dashboard)        # Protected dashboard routes
  /api                 # API routes
/components            # React components
  /ui                  # Base UI components
  /features            # Feature-specific components
  /layout              # Layout components
/lib                   # Utilities and helpers
  /prisma              # Prisma client
  /utils               # Helper functions
  /hooks               # Custom React hooks
  /constants           # Constants and configs
/types                 # TypeScript types
/prisma                # Prisma schema and migrations
/public                # Static assets
/docs                  # Documentation
  /wireframes          # Wireframe documentation
```

## 🎨 Design System

### Colors (Pirate/Nautical Theme)
- **Primary**: Teal/Blue ocean gradients
- **Accent**: Gold for treasure/coins
- **Background**: Dark blue ocean depths
- **Text**: White and light gray
- All colors available as CSS variables in `globals.css`

### Typography
- **Font**: Nunito (Duolingo-style rounded, friendly sans-serif)
- **Mobile-first**: Responsive scaling

### Styling Approach
- **CSS Modules**: Component-scoped styles
- **CSS Variables**: Design system values
- See [CSS Modules Guide](./docs/CSS_MODULES_GUIDE.md) for usage

### UI/UX Principles
- Mobile-first design (375px+)
- Touch targets: Minimum 44x44px
- WCAG AA accessibility compliance
- Playful micro-interactions
- Immediate visual feedback

## 🎮 Gamification Features

- **XP System**: Points for completing tasks, lessons, modules
- **Levels**: User progression with pirate-themed ranks
- **Streaks**: Daily login tracking
- **Leaderboards**: Global and crew rankings
- **Badges**: Unlockable achievements
- **Rewards**: Diamond currency system
- **Progress Visualization**: Bars, percentages, journey maps

## 🛠️ Getting Started

### Prerequisites
- Node.js 18+ 
- npm or pnpm
- PostgreSQL database (Railway)

### Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd "Learning Management"
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
```

Edit `.env` with your values:
- `DATABASE_URL`: PostgreSQL connection string from Railway
- `NEXTAUTH_SECRET`: Generate a random string
- `NEXTAUTH_URL`: Your app URL (http://localhost:3000 for dev)

4. **Set up the database**
```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate
```

5. **Run the development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📚 Documentation

- [Team Roles](./docs/TEAM_ROLES.md) - Complete team structure
- [Build Order](./docs/BUILD_ORDER.md) - Development phases
- [Wireframes](./docs/wireframes/) - Design documentation
- [CSS Modules Guide](./docs/CSS_MODULES_GUIDE.md) - Styling guide
- [Project Rules](./.cursorrules) - Comprehensive project rules

## 🔗 Deployment Setup

### GitHub
1. Create a new repository on GitHub
2. Initialize git: `git init`
3. Add remote: `git remote add origin <repo-url>`
4. Commit and push: `git add . && git commit -m "Initial commit" && git push -u origin main`

### Vercel
1. Connect your GitHub repository to Vercel
2. Vercel will auto-detect Next.js
3. Add environment variables in Vercel dashboard
4. Deploy automatically on push to main

### Railway
1. Create Railway account
2. Create new PostgreSQL database
3. Copy `DATABASE_URL` connection string
4. Add to Vercel environment variables
5. Run migrations: `npm run db:migrate` (with Railway DATABASE_URL)

## 🎯 Development Phases

1. **Foundation** - Project setup, design system, authentication
2. **Core Features** - Dashboard, courses, progress tracking
3. **Gamification** - Rewards, leaderboards, badges, streaks
4. **Polish & Deploy** - PWA, notifications, analytics, optimization

See [BUILD_ORDER.md](./docs/BUILD_ORDER.md) for detailed breakdown.

## 📝 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:generate` - Generate Prisma client
- `npm run db:migrate` - Run database migrations
- `npm run db:push` - Push schema changes to database
- `npm run db:studio` - Open Prisma Studio

## 🤝 Contributing

This project uses AI agents with specific roles:
- **Frontend Agent**: React/Next.js components, UI/UX
- **Backend Agent**: API routes, database, business logic
- **Design Agent**: Wireframes, design system
- **DevOps Agent**: Deployment, infrastructure

See [.cursorrules](./.cursorrules) for complete project rules and guidelines.

## 📄 License

[Add your license here]

---

**Ahoy Mate! 🏴‍☠️** Welcome to the crew!

