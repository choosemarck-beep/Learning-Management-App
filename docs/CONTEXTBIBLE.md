# The Context Bible - Learning Management System Web App

**Version**: 1.1  
**Last Updated**: December 2024  
**Purpose**: Comprehensive context document for AI agents and developers to understand the complete system architecture, design philosophy, business logic, and implementation details.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Design System & Theme](#design-system--theme)
4. [Database Schema & Data Models](#database-schema--data-models)
5. [Authentication & Authorization](#authentication--authorization)
6. [Gamification System](#gamification-system)
7. [Component Architecture](#component-architecture)
8. [API Structure](#api-structure)
9. [Deployment & Infrastructure](#deployment--infrastructure)
10. [Development Workflow](#development-workflow)
11. [Business Logic & Rules](#business-logic--rules)
12. [User Experience Philosophy](#user-experience-philosophy)
13. [Technical Decisions & Rationale](#technical-decisions--rationale)

---

## Project Overview

### What We're Building

A **mobile-first, gamified Learning Management System (LMS)** Progressive Web App (PWA) that transforms traditional learning into an engaging, Duolingo-inspired experience. The app uses a **Pixel Galaxy** theme with space/cosmic aesthetics to create a playful yet professional learning environment.

### Core Value Proposition

- **Gamified Learning**: Transform learning into a game with XP, levels, streaks, badges, and leaderboards
- **Mobile-First**: Optimized exclusively for mobile devices (320px-428px viewports)
- **Progressive Web App**: Installable, offline-capable (future), push notifications
- **Duolingo-Inspired UX**: Chunking, ease of use, positive framing, behavioral science principles
- **Professional Quality**: Industry-standard tech stack, clean code, scalable architecture

### Target Users

- **Primary**: Learners seeking structured, engaging learning experiences
- **Secondary**: Content creators/administrators managing courses
- **Tertiary**: Organizations tracking learning progress

### Project Status

- **Phase**: Foundation (Phase 1) - In Progress
- **Current Focus**: Authentication, base UI components, design system
- **Next Phase**: Core features (dashboard, courses, progress tracking)

---

## System Architecture

### Tech Stack

#### Frontend
- **Framework**: Next.js 14+ (App Router) with TypeScript
- **Styling**: CSS Modules (component-scoped, no inline styles except Framer Motion)
- **Animations**: Framer Motion (Duolingo-style playful interactions)
- **State Management**: 
  - Zustand (client state)
  - TanStack Query/React Query (server state)
- **Forms**: React Hook Form + Zod validation
- **Icons**: Lucide React (primary), custom SVG components
- **Font**: Nunito (Google Fonts)

#### Backend
- **API**: Next.js API Routes (serverless functions)
- **Database**: PostgreSQL (Railway)
- **ORM**: Prisma
- **Authentication**: NextAuth.js v5 (JWT strategy)
- **Password Hashing**: bcryptjs
- **File Uploads**: Vercel Blob or Cloudinary (future)

#### PWA & Notifications
- **PWA**: next-pwa package
- **Push Notifications**: Web Push API with service worker (future)
- **Offline**: Not required initially

#### Deployment & Infrastructure
- **Frontend/API**: Vercel (automatic deployments from GitHub)
- **Database**: Railway (PostgreSQL)
- **Version Control**: GitHub
- **CDN**: Vercel Edge Network (automatic)
- **Analytics**: Google Analytics 4 (GA4) - planned

#### Development Tools
- **Package Manager**: npm
- **Linting**: ESLint + Prettier
- **Type Checking**: TypeScript strict mode
- **Git Hooks**: Husky + lint-staged (planned)

### Project Structure

```
/app                    # Next.js App Router
  /(auth)              # Authentication routes (login, signup)
    /layout.tsx        # Auth layout with GalaxyBackground
    /login/            # Login page with IntroCarousel
    /signup/           # Signup page
  /(dashboard)        # Protected dashboard routes
    /layout.tsx        # Dashboard layout (Header, Navigation, Footer)
    /dashboard/        # Main dashboard page
  /api                 # API routes
    /auth/             # NextAuth.js routes
      /[...nextauth]/  # NextAuth handler
      /signup/         # User registration endpoint
  /globals.css         # Global styles, CSS variables, design system
  /layout.tsx          # Root layout (providers, fonts)
  /page.tsx            # Home page (landing)
  /providers.tsx       # React Query, NextAuth providers

/components            # React components
  /ui                  # Base UI components
    /assets/           # Gamified icon components
      - EnergyCrystal.tsx
      - StarCluster.tsx (Lucide Sparkles icon)
      - ProgressChart.tsx (Lucide TrendingUp)
      - CommunityIcon.tsx (Lucide Users)
      - RocketIcon.tsx (Lucide Rocket)
    - Badge.tsx
    - Button.tsx
    - Card.tsx
    - Input.tsx
    - Logo.tsx (LEARNING MANAGEMENT with progress bar)
    - ProgressBar.tsx
    - GalaxyBackground.tsx (animated stars & meteors)
  /features            # Feature-specific components
    - IntroCarousel.tsx (automatic looping carousel)
  /layout              # Layout components
    - Header.tsx
    - Footer.tsx
    - Navigation.tsx (mobile bottom nav)

/lib                   # Utilities and helpers
  /auth/               # Authentication utilities
    - config.ts        # NextAuth configuration
    - utils.ts         # Auth helper functions
    - index.ts         # Auth exports
  /prisma/             # Database client
    - client.ts        # Prisma client singleton
  /utils/              # Helper functions
    - cn.ts            # className utility (clsx wrapper)
  /constants/          # Constants and configs
    - colors.ts        # Color palette constants
    - gamification.ts  # Gamification rules (XP, levels, ranks)
    - theme.ts         # Theme constants (spacing, transitions)

/types                 # TypeScript types
  - index.ts           # Shared types
  - next-auth.d.ts     # NextAuth type extensions

/prisma                # Prisma schema and migrations
  /schema.prisma       # Database schema
  /migrations/         # Database migrations

/public                # Static assets
  - manifest.json      # PWA manifest

/docs                  # Documentation
  /product/            # Product documentation (PRDs, roadmap, backlog)
  /wireframes/         # Design wireframes
  /CONTEXTBIBLE.md     # This file

/styles                # Shared CSS files
  - design-system.css  # Design system utilities (optional)
```

### Routing Structure

- `/` - Home/landing page (Logo, CTA buttons)
- `/login` - Login page (IntroCarousel, login form)
- `/signup` - Signup page (4-step registration form)
- `/employee/profile` - Employee profile page (protected, BRANCH_MANAGER/EMPLOYEE only)
- `/admin/dashboard` - Admin dashboard (protected, ADMIN/SUPER_ADMIN only)
- `/admin/media` - Multimedia Management (carousel, splash screen, theme) (protected, ADMIN/SUPER_ADMIN only)
- `/super-admin/dashboard` - Super admin dashboard (protected, SUPER_ADMIN only)
- `/super-admin/media` - Multimedia Management (carousel, splash screen, theme) (protected, SUPER_ADMIN only)
- `/dashboard` - Legacy dashboard (redirects based on role)
- `/api/auth/[...nextauth]` - NextAuth.js handler
- `/api/auth/signup` - User registration endpoint
- `/api/admin/users/pending` - Get pending users (admin only)
- `/api/admin/users` - Get all users with filters (admin only)
- `/api/admin/users/[userId]/approve` - Approve user (admin only)
- `/api/admin/users/[userId]/reject` - Reject user (admin only)
- `/api/admin/carousel` - Carousel image management (admin only)
- `/api/admin/carousel/settings` - Carousel settings (mode, video) (admin only)
- `/api/admin/splash-screen` - Splash screen image management (admin only)
- `/api/splash-screen` - Public endpoint to fetch splash screen image

---

## Design System & Theme

### Theme: Pixel Galaxy

A space/cosmic-themed design system with galaxy-inspired colors, starry backgrounds, and celestial terminology.

### Color Palette

**Primary Colors (Purple/Blue Nebula Gradient)**
- `--color-primary-purple`: `#8B5CF6` (main purple)
- `--color-primary-indigo`: `#6366F1` (indigo)
- `--color-primary-dark`: `#4C1D95` (deep space purple)
- `--color-primary-deep`: `#5B21B6` (deep purple)

**Accent Colors (Star Energy)**
- `--color-accent-cyan`: `#06B6D4` (cyan)
- `--color-accent-teal`: `#0EA5E9` (teal)

**Star Gold (Achievements/Rewards)**
- `--color-star-gold`: `#FBBF24` (bright gold)
- `--color-star-gold-dark`: `#F59E0B` (dark gold)

**Energy Crystal (Gamification)**
- `--color-crystal-purple`: `#A78BFA` (light purple)
- `--color-crystal-bright`: `#C084FC` (bright purple)

**Background (Deep Space)**
- `--color-bg-dark`: `#0F172A` (deep space/void)
- `--color-bg-dark-secondary`: `#1E1B4B` (secondary dark)

**Text**
- `--color-text-primary`: `#FFFFFF` (white)
- `--color-text-secondary`: `#CBD5E1` (light gray)

**Status Colors**
- `--color-status-success`: `#10B981` (green)
- `--color-status-warning`: `#F59E0B` (amber)
- `--color-status-error`: `#EF4444` (red)

### Typography

**Font Family**: **Glacial Indifference** (Google Fonts)
- Weights: 400 (regular), 700 (bold)
- Applied globally via CSS variable: `var(--font-glacial)`
- **CRITICAL**: All components must use Glacial Indifference - no exceptions

**Font Size System** (Standardized CSS Variables - Use Consistently)
- **Heading 1 (h1)**: `var(--font-size-3xl)` (32px / 2rem) - Page titles, main headings
- **Heading 2 (h2)**: `var(--font-size-2xl)` (24px / 1.5rem) - Section titles
- **Heading 3 (h3)**: `var(--font-size-xl)` (20px / 1.25rem) - Subsection titles
- **Body**: `var(--font-size-base)` (16px / 1rem) - Paragraphs, descriptions, default text
- **Small**: `var(--font-size-sm)` (14px / 0.875rem) - Labels, helper text, captions
- **Tiny**: `var(--font-size-xs)` (12px / 0.75rem) - Fine print, timestamps

**Font Weight Hierarchy** (Standardized CSS Variables)
- **Regular (400)**: `var(--font-weight-regular)` - Body text, descriptions
- **Medium (500)**: `var(--font-weight-medium)` - Optional, for subtle emphasis
- **Semibold (600)**: `var(--font-weight-semibold)` - Buttons, links, labels
- **Bold (700)**: `var(--font-weight-bold)` - Headings, strong emphasis

**Typography Rules**
- **MANDATORY**: Always use CSS variables for font sizes (`var(--font-size-*)`) - never hardcode pixel values
- **MANDATORY**: Always use CSS variables for font weights (`var(--font-weight-*)`) - never hardcode weight values
- **Consistent Hierarchy**: Follow the standardized font size hierarchy across ALL components
- Generous line-height (1.3-1.4 for headings, 1.6-1.8 for body)
- Standard letter-spacing and word-spacing (no excessive spacing)
- Adequate padding to prevent text truncation
- Never cut off text at the bottom
- **Future Components**: All new components MUST use the standardized font size and weight variables

### Spacing System (8px Grid)

- `--spacing-xs`: 0.5rem (8px)
- `--spacing-sm`: 0.75rem (12px)
- `--spacing-md`: 1rem (16px)
- `--spacing-lg`: 1.5rem (24px)
- `--spacing-xl`: 2rem (32px)
- `--spacing-2xl`: 3rem (48px)

### Border Radius

- `--radius-sm`: 0.375rem (6px)
- `--radius-md`: 0.5rem (8px)
- `--radius-lg`: 0.75rem (12px)
- `--radius-xl`: 1rem (16px)
- `--radius-full`: 9999px (circular)

### Transitions

- `--transition-fast`: 150ms
- `--transition-normal`: 200ms
- `--transition-slow`: 300ms

### Touch Targets

- Minimum: `--touch-target-min`: 44px (WCAG AA compliance)

### Design Principles

1. **Mobile-Only Design**: All user-facing pages designed exclusively for 320px-428px viewports
2. **No Emojis**: Use Lucide React icons or custom SVG components
3. **No Inline Styles**: All styling in CSS Modules (except Framer Motion)
4. **Visual Harmony**: Consistent spacing, alignment, visual rhythm
5. **Professional Polish**: No text clipping, icon distortion, or layout breaks
6. **Chunking & Ease of Use**: Break complex tasks into small steps, reduce cognitive load
7. **Positive Framing**: Use encouraging, achievement-focused messaging
8. **Accessibility**: WCAG AA compliance, keyboard navigation, screen reader support

### Special Components

**GalaxyBackground**: Animated canvas background with:
- Moving stars (150 stars, twinkling, slow drift)
- Meteor showers (3 meteors with purple/indigo trails)
- Fixed position, z-index 0 (behind all content)

**Logo Component**: "LEARNING MANAGEMENT" text with:
- White text (two lines)
- Progress bar with 20 segments (purple gradient)
- Triangular arrow at end
- Configurable progress (default 66%)

**IntroCarousel**: Automatic looping carousel (4 seconds per slide) with:
- 4 introduction slides
- Gamified icons (Rocket, Sparkles, TrendingUp, Users)
- Dot indicators (clickable)
- Smooth Framer Motion animations

---

## Database Schema & Data Models

### Prisma Schema Overview

**User Model**
- `id`: String (cuid)
- `email`: String (unique)
- `name`: String
- `password`: String (hashed)
- `avatar`: String? (optional)
- `xp`: Int (default 0)
- `level`: Int (default 1)
- `rank`: String (default "Deckhand")
- `streak`: Int (default 0)
- `diamonds`: Int (default 0)
- Relations: CourseProgress[], TaskCompletion[], Badge[], Session[]

**Course Model**
- `id`: String (cuid)
- `title`: String
- `description`: String
- `thumbnail`: String? (optional)
- `totalXP`: Int (default 0)
- `isPublished`: Boolean (default false)
- Relations: Module[], CourseProgress[]

**Module Model**
- `id`: String (cuid)
- `courseId`: String (foreign key)
- `title`: String
- `description`: String
- `order`: Int
- `totalXP`: Int (default 0)
- Relations: Course, Lesson[]

**Lesson Model**
- `id`: String (cuid)
- `moduleId`: String (foreign key)
- `title`: String
- `description`: String
- `order`: Int
- `totalXP`: Int (default 0)
- Relations: Module, Task[]

**Task Model**
- `id`: String (cuid)
- `lessonId`: String (foreign key)
- `title`: String
- `type`: String ("quiz" | "exercise" | "reading" | "interactive")
- `content`: String (JSON, default "{}")
- `order`: Int
- `xpReward`: Int (default 10)
- Relations: Lesson, TaskCompletion[]

**CourseProgress Model**
- `id`: String (cuid)
- `userId`: String (foreign key)
- `courseId`: String (foreign key)
- `progress`: Float (0-100, default 0)
- `isCompleted`: Boolean (default false)
- Unique constraint: [userId, courseId]

**TaskCompletion Model**
- `id`: String (cuid)
- `userId`: String (foreign key)
- `taskId`: String (foreign key)
- `score`: Int? (optional, for quizzes)
- `completedAt`: DateTime (default now)
- Unique constraint: [userId, taskId]

**Badge Model**
- `id`: String (cuid)
- `userId`: String (foreign key)
- `type`: String
- `name`: String
- `description`: String
- `icon`: String
- `earnedAt`: DateTime (default now)

**Session Model** (NextAuth.js)
- `id`: String (cuid)
- `sessionToken`: String (unique)
- `userId`: String (foreign key)
- `expires`: DateTime

### Data Relationships

```
User
  ├── CourseProgress[] (many-to-many with Course)
  ├── TaskCompletion[] (many-to-many with Task)
  ├── Badge[] (one-to-many)
  └── Session[] (one-to-many, NextAuth)

Course
  ├── Module[] (one-to-many)
  └── CourseProgress[] (many-to-many with User)

Module
  ├── Course (many-to-one)
  └── Lesson[] (one-to-many)

Lesson
  ├── Module (many-to-one)
  └── Task[] (one-to-many)

Task
  ├── Lesson (many-to-one)
  └── TaskCompletion[] (many-to-many with User)
```

---

## Authentication & Authorization

### Authentication System

**Provider**: NextAuth.js v5 (JWT strategy)

**Authentication Flow**
1. User submits email/password on `/login`
2. Credentials validated via Zod schema
3. User fetched from database by email
4. Password verified with bcryptjs
5. JWT token created with user data
6. Session stored in JWT (no database session for JWT strategy)
7. Protected routes check session via middleware

**Signup Flow**
1. User submits 4-step form on `/signup` (Personal Info, Employee Basic Info, Employee Details, Account Setup)
2. Validation via Zod schema (email format, password min 8 chars with complexity requirements)
3. Password hashed with bcryptjs
4. Role auto-detected from selected position (EMPLOYEE or BRANCH_MANAGER)
5. User created in database with default values (xp: 0, level: 1, rank: "Deckhand", status: "PENDING")
6. Onboarding email sent (non-blocking)
7. User redirected to login with approval pending message

**Session Management**
- Strategy: JWT (stateless)
- Session data: `id`, `email`, `name`, `avatar`, `role`
- Expiration: Configured in NextAuth config
- Middleware: Protects routes based on role, redirects unauthenticated users

**Protected Routes**
- `/employee/profile` - Requires authentication, BRANCH_MANAGER/EMPLOYEE only
- `/admin/dashboard` - Requires authentication, ADMIN/SUPER_ADMIN only
- `/super-admin/dashboard` - Requires authentication, SUPER_ADMIN only
- `/dashboard` - Legacy route, redirects to role-based page
- Middleware redirects to `/login?callbackUrl=<path>` if not authenticated
- Authenticated users redirected away from `/login` and `/signup`

**User Approval Workflow**
- New users created with `status: "PENDING"` (see `app/api/auth/signup/route.ts:111`)
- Login blocked for non-approved users (see `lib/auth/config.ts:33`)
- Admin/Super Admin can approve users via `/admin/dashboard` or `/super-admin/dashboard`
- Approved users can login and access their role-based dashboard
- Rejected users see error message on login attempt

**Password Security**
- Hashing: bcryptjs
- Minimum length: 8 characters (enforced in Zod schema)
- Must contain: uppercase, lowercase, number, special character
- Stored as hash in database (never plain text)

---

## Gamification System

### XP System

**XP Rewards** (from `lib/constants/gamification.ts`)
- Task completion: 10 XP
- Lesson completion: 50 XP
- Module completion: 200 XP
- Course completion: 1000 XP

**Level System**
- XP per level: 1000 XP
- Max level: 100
- Level calculation: `Math.floor(xp / 1000) + 1`

### Rank System (Pixel Galaxy Theme)

Ranks based on level and XP:
- Level 1: "Stellar Cadet" (0 XP)
- Level 5: "Space Explorer" (5,000 XP)
- Level 10: "Nebula Navigator" (10,000 XP)
- Level 15: "Star Seeker" (15,000 XP)
- Level 20: "Galaxy Guardian" (20,000 XP)
- Level 25: "Stellar Master" (25,000 XP)
- Level 30: "Cosmic Commander" (30,000 XP)
- Level 40: "Galaxy Master" (40,000 XP)
- Level 50: "Universal Legend" (50,000 XP)

### Streak System

- Streak bonus multiplier: 1.5x XP
- Max streak days: 365
- Daily login required to maintain streak
- Streak resets if user misses a day

### Rewards (Energy Crystals/Diamonds)

- Crystals per XP: 0.1 (1 crystal per 10 XP)
- Daily reward crystals: 50
- Stored in `User.diamonds` field

### Badge System

**Badge Types**:
- `first_task` - Complete first task
- `first_lesson` - Complete first lesson
- `first_module` - Complete first module
- `first_course` - Complete first course
- `streak_7` - 7-day streak
- `streak_30` - 30-day streak
- `streak_100` - 100-day streak
- `perfect_week` - Complete all tasks in a week
- `top_10_leaderboard` - Reach top 10 on leaderboard
- `level_10` - Reach level 10
- `level_25` - Reach level 25
- `level_50` - Reach level 50

### Leaderboard

- Update interval: 1 hour (3,600,000 ms)
- Rankings based on total XP
- Global leaderboard (all users)
- Future: Squad/team leaderboards

---

## Component Architecture

### Component Organization

**Base UI Components** (`/components/ui`)
- Reusable, generic components
- Follow atomic design principles
- Props interfaces exported for TypeScript
- CSS Modules for styling

**Feature Components** (`/components/features`)
- Feature-specific, business logic components
- Examples: IntroCarousel, future course cards, progress widgets

**Layout Components** (`/components/layout`)
- Page structure components
- Header, Footer, Navigation
- Shared across multiple pages

### Component Patterns

**Styling Pattern**
- CSS Modules (`.module.css` files)
- CSS variables from `globals.css`
- No inline styles (except Framer Motion)
- Mobile-first (320px-428px)

**Component Structure**
```typescript
// Component.tsx
import React from "react";
import styles from "./Component.module.css";

export interface ComponentProps {
  // Props interface
}

export const Component: React.FC<ComponentProps> = ({ ... }) => {
  return (
    <div className={styles.container}>
      {/* Component content */}
    </div>
  );
};
```

**Naming Conventions**
- Components: PascalCase (`TaskCard.tsx`)
- Functions: camelCase (`calculateXP()`)
- Constants: UPPER_SNAKE_CASE (`MAX_STREAK_DAYS`)
- CSS classes: camelCase (`.container`, `.inputGroup`)

### Key Components

**Button Component**
- Variants: `primary`, `secondary`, `outline`, `ghost`
- Sizes: `sm`, `md`, `lg`
- States: `disabled`, `loading`
- Touch target: 44px minimum

**Input Component**
- Label, error, helper text support
- Validation via React Hook Form
- Accessible (ARIA labels, error announcements)

**Card Component**
- Header, Body, Footer sections
- Dark background with border
- Rounded corners

**Logo Component**
- "LEARNING MANAGEMENT" text (white)
- Progress bar with segments
- Configurable progress percentage

**GalaxyBackground Component**
- Canvas-based animation
- Stars and meteors
- Fixed position, behind content

**IntroCarousel Component**
- Automatic looping (4 seconds)
- Framer Motion animations
- Dot indicators
- React icon components

**Admin Components** (`/components/features/admin`)
- **PendingUsersList**: Displays list of pending users with approve/reject actions
- **UserCard**: Individual user card showing details (name, email, employee info, company, position)
- **UserFilters**: Filter and search users by status, role, and search term
- **ThemeManagement**: Theme customization component with:
  - Background type selection (Galaxy, Plain, Moving Gradient)
  - Color group pickers (Button, Text, Accent, Gold, Status) with React Portal dropdowns
  - Plain background color picker (appears inline when "Plain" is selected)
  - Live preview of all color changes
  - Color preservation when switching background types
  - Real-time background color application to body, html, and layout containers
- **ThemeManagement**: Theme customization component with:
  - Background type selection (Galaxy, Plain, Moving Gradient)
  - Color group pickers (Button, Text, Accent, Gold, Status) with React Portal dropdowns
  - Plain background color picker (appears inline when "Plain" is selected)
  - Live preview of all color changes
  - Color preservation when switching background types
  - Real-time background color application to body, html, and layout containers

---

## API Structure

### API Routes

**NextAuth.js Handler**
- Route: `/api/auth/[...nextauth]`
- Handles: Login, logout, session management
- Provider: Credentials (email/password)

**Signup Endpoint**
- Route: `/api/auth/signup`
- Method: POST
- Body: `{ email, name, password }`
- Response: `{ success: boolean, user?: User, error?: string }`
- Validates input, hashes password, creates user

### API Patterns

**Error Handling**
- Consistent error responses
- Validation errors returned to client
- Server errors logged, generic message to client

**Response Format**
```typescript
{
  success: boolean;
  data?: T;
  error?: string;
}
```

---

## Deployment & Infrastructure

### Deployment Architecture

**Frontend/API**: Vercel
- Automatic deployments from GitHub
- Serverless Next.js API routes
- Edge network CDN
- Environment variables in Vercel dashboard

**Database**: Railway
- PostgreSQL database
- Connection via `DATABASE_URL` environment variable
- Migrations run manually from local machine

**Version Control**: GitHub
- Main branch triggers Vercel deployment
- Feature branches for development

### Environment Variables

**Required**
- `DATABASE_URL`: PostgreSQL connection string (Railway)
- `NEXTAUTH_SECRET`: Random string for JWT signing
- `NEXTAUTH_URL`: App URL (http://localhost:3000 for dev)

**Optional (Future)**
- `BLOB_READ_WRITE_TOKEN`: Vercel Blob storage
- `NEXT_PUBLIC_GA_ID`: Google Analytics ID

### Database Migrations

**Important**: Migrations must be run manually from local machine
- Command: `npm run db:migrate`
- Requires `DATABASE_URL` in local `.env` file
- Railway database connection string used
- No automatic migration hooks on deploy

### Deployment Process

1. Push code to GitHub
2. Vercel automatically builds and deploys
3. Database migrations run manually (if needed)
4. Environment variables configured in Vercel dashboard

---

## Development Workflow

### Code Quality Standards

**TypeScript**
- Strict mode enabled
- No `any` types
- Proper type definitions for all components

**Component Structure**
- Atomic design principles
- Reusable, composable components
- Single Responsibility Principle

**Comments**
- Self-documenting code preferred
- Comments for complex logic only

### File Structure Rules

- Components: `Component.tsx` with `Component.module.css`
- Utilities: `lib/utils/functionName.ts`
- Constants: `lib/constants/category.ts`
- Types: `types/index.ts` or component-specific types

### CSS Guidelines

**CSS Modules**
- Component-scoped styles
- Import: `import styles from './Component.module.css'`
- Use CSS variables from `globals.css`
- No global CSS except `globals.css`

**No Inline Styles**
- Exception: Framer Motion animation props
- Exception: Dynamic values (e.g., `width: ${percentage}%`)
- All styling in CSS Modules

**Mobile Constraints**
- Maximum container width: 428px
- No desktop media queries for user-facing pages
- Single column layouts
- Mobile-optimized font sizes and spacing

### Git Workflow

- Feature branches for new features
- Commit messages: Clear, descriptive
- No rapid deployments (wait 2 minutes between pushes)

---

## Business Logic & Rules

### User Registration

1. Email must be unique
2. Password minimum 8 characters with uppercase, lowercase, number, and special character
3. Phone number: Philippines format (e.g., 09123456789 or +639123456789)
4. Default values: xp=0, level=1, rank="Deckhand", streak=0, diamonds=0, status="PENDING"
5. Password hashed with bcryptjs before storage
6. Multi-step form with chunking (4 steps: Personal Info, Employee Basic Info, Employee Details, Account Setup)
7. Form validation errors shown via toast notifications (not inline) to prevent layout shifts
8. Role auto-detected from selected position (EMPLOYEE or BRANCH_MANAGER)
9. User created with `status: "PENDING"` - requires admin approval before login

### User Approval Process

1. New user registers via `/signup`
2. User created with `status: "PENDING"`
3. User cannot login until approved (blocked in `lib/auth/config.ts`)
4. Admin/Super Admin accesses `/admin/dashboard` or `/super-admin/dashboard`
5. Admin views pending users list
6. Admin approves or rejects user
7. Approved users can login and access their role-based dashboard
8. Rejected users see error message on login attempt

### Course Access

- Courses must be published (`isPublished: true`) to be visible
- Users can access any published course
- Progress tracked per user per course

### Progress Calculation

**Course Progress**
- Calculated from completed tasks
- Formula: `(completedTasks / totalTasks) * 100`
- Stored in `CourseProgress.progress` (0-100)

**Task Completion**
- User can complete a task once
- Unique constraint: [userId, taskId]
- XP awarded on first completion
- Score optional (for quizzes)

### XP Award System

- XP awarded on task completion
- No duplicate XP for re-completing tasks
- Streak bonus: 1.5x multiplier (if streak active)
- Level up when XP threshold reached (1000 XP per level)

### Badge Unlocking

- Badges unlock automatically when criteria met
- One badge per type per user
- Badge earned timestamp stored
- Unlock animations (future)

---

## User Experience Philosophy

### Core Principles

1. **Chunking & Ease of Use** (CRITICAL PRIORITY)
   - Break complex tasks into small, manageable steps
   - Show one thing at a time when possible
   - Multi-step forms with progress indicators
   - Group related information
   - Minimize cognitive load
   - Reduce friction in every interaction

2. **Behavioral Science & Positive Framing**
   - Use positive framing in all messaging
   - Frame challenges as opportunities
   - Celebrate small wins and progress
   - Use loss aversion carefully (emphasize gains)
   - Implement social proof where appropriate
   - Clear calls-to-action with positive outcomes

3. **Mobile-First Design**
   - All user-facing pages: 320px-428px viewports only
   - No desktop breakpoints (except admin pages)
   - Touch targets: 44px minimum
   - Single column layouts
   - Vertical scrolling preferred

4. **Progressive Disclosure**
   - Show information gradually
   - Avoid overwhelming users
   - Hide complexity until needed

5. **Immediate Feedback**
   - Visual feedback for all actions
   - Loading states with personality
   - Error messages with positive framing
   - Success animations

### Terminology

- **Stakeholders**: Referred to as "Multipliers" throughout the project
- **Users**: Referred to as "Explorers" in UI
- **Community**: Referred to as "Squad"
- **Energy Crystals**: Gamification currency (also called "diamonds" in code)

### Messaging Examples

**Positive Framing**
- ✅ "You're making great progress!"
- ✅ "Continue your learning journey and unlock new achievements"
- ❌ "You haven't completed this yet"

**Achievement-Focused**
- ✅ "Earn energy crystals, level up, and unlock achievements"
- ✅ "Join a Community - Compete on leaderboards and celebrate wins"

---

## Technical Decisions & Rationale

### Why Next.js App Router?

- Modern React patterns
- Server components for performance
- Built-in routing and API routes
- Excellent TypeScript support
- Vercel optimization

### Why CSS Modules?

- Component-scoped styles (no conflicts)
- Type-safe class names
- Better performance (no runtime CSS-in-JS)
- Easier to maintain
- Aligns with mobile-first approach

### Why Prisma?

- Type-safe database queries
- Excellent TypeScript support
- Migration system
- Developer experience
- PostgreSQL support

### Why NextAuth.js v5?

- Industry standard
- JWT strategy (stateless, scalable)
- Built-in session management
- Easy to extend
- Good TypeScript support

### Why Framer Motion?

- Smooth animations
- Duolingo-style playful interactions
- Performance optimized
- React-friendly API
- Mobile-optimized

### Why Mobile-Only Design?

- Target audience primarily mobile users
- Simpler development (one viewport)
- Better performance
- Aligns with PWA strategy
- Duolingo-inspired (mobile-first)

### Why Pixel Galaxy Theme?

- Unique, memorable brand identity
- Space/cosmic theme aligns with "exploration" concept
- Allows for rich gamification visuals
- Professional yet playful
- Distinctive in LMS market

---

## Current Implementation Status

### Completed ✅

- Project setup (Next.js, TypeScript, Prisma)
- Design system foundation (colors, typography, CSS variables)
- Database schema design
- Base UI components (Button, Card, Input, Select, DatePicker, ProgressBar, Badge)
- Logo component with progress bar (animated)
- GalaxyBackground animated component
- IntroCarousel component
- Gamified icon components (EnergyCrystal, StarCluster, ProgressChart, CommunityIcon, RocketIcon)
- Login page with carousel
- Signup page (4-step form with chunking)
- Authentication system (NextAuth.js v5)
- Protected routes middleware (role-based routing)
- Home/landing page
- Employee profile page (`/employee/profile`)
- Admin dashboard (`/admin/dashboard`)
- Super admin dashboard (`/super-admin/dashboard`)
- User approval workflow (pending → approved/rejected)
- Admin user management APIs
- Admin components (PendingUsersList, UserCard, UserFilters)
- Theme Management system with live preview and color customization
- Multimedia Management (carousel, splash screen, theme)

### In Progress 🚧

- Course listing page
- Progress tracking system
- Admin account creation (super admin feature)

### Planned 📋

- Course detail pages
- Task completion system
- Gamification calculations (XP, levels, badges)
- Leaderboard system
- Badge unlock system
- Streak tracking
- PWA features
- Push notifications
- Admin portal

---

## Important Notes for Agents

### Critical Rules

1. **Never use inline styles** (except Framer Motion)
2. **Never use emojis** in UI components
3. **Mobile-only design** for user-facing pages (320px-428px)
4. **Chunking & ease of use** is CRITICAL PRIORITY
5. **Positive framing** in all messaging
6. **No rapid deployments** (wait 2 minutes between pushes)
7. **Typography**: Maximum 2-3 font sizes, proper line-height
8. **Spacing**: Use 8px grid system consistently
9. **Touch targets**: Minimum 44px
10. **User is not a developer** - always explain what you're doing

### Common Patterns

**Creating a New Component**
1. Create `Component.tsx` and `Component.module.css`
2. Use CSS variables from `globals.css`
3. Export TypeScript interface for props
4. Add to appropriate index.ts file
5. Follow mobile-first design rules

**Adding a New Route**
1. Create page in `/app` directory
2. Add layout if needed
3. Protect route in middleware if required
4. Follow chunking principles for complex pages

**Database Changes**
1. Update `prisma/schema.prisma`
2. Create migration: `npm run db:migrate`
3. Update Prisma client: `npm run db:generate`
4. Update TypeScript types if needed

---

## Security Architecture

### Environment Variables
- **Required Secrets**: `DATABASE_URL`, `NEXTAUTH_SECRET`, `RESEND_API_KEY`, `GEMINI_API_KEY`
- **Storage**: Environment variables in Vercel dashboard (production), `.env` file (development)
- **Protection**: `.gitignore` excludes `.env*` files, never commit secrets
- **Best Practice**: Use `.env.example` as template with placeholder values

### Input Validation
- **Client-Side**: React Hook Form + Zod validation
- **Server-Side**: Zod schemas on all API routes (MANDATORY)
- **Database**: Prisma ORM (type-safe, SQL injection protected)
- **Shared Schemas**: Reusable Zod schemas in `lib/validation/schemas.ts`
- **Validation Strategy**: Validate all inputs before database operations, maintain existing response formats

### Authentication Security
- **Password Hashing**: bcryptjs (10 rounds)
- **Session Management**: JWT tokens (stateless)
- **Route Protection**: Middleware checks authentication and roles
- **User Approval**: PENDING users cannot login until APPROVED
- **Password Requirements**: Minimum 8 characters with uppercase, lowercase, number, and special character
- **Rate Limiting**: Implemented on login/signup endpoints (5 attempts per 15 minutes for login, 3 per hour for signup)

### API Security
- **Validation**: All endpoints use Zod schemas
- **Authorization**: Role-based access control (RBAC)
- **Error Handling**: Generic error messages (no system details leaked)
- **Rate Limiting**: Implemented on authentication and sensitive endpoints
- **Input Sanitization**: User input sanitized before processing, especially for AI prompts

### Database Security
- **ORM**: Prisma (prevents SQL injection)
- **Type Safety**: TypeScript + Prisma types
- **Input Sanitization**: Zod validation before database operations
- **No Raw Queries**: All queries use Prisma's type-safe API
- **Foreign Keys**: Referential integrity maintained with cascading deletes

### Rate Limiting Configuration
- **Login Endpoint**: 5 attempts per 15 minutes per IP
- **Signup Endpoint**: 3 attempts per hour per IP
- **Password Change**: 5 attempts per hour per IP
- **Admin Actions**: 10 attempts per minute per IP
- **Implementation**: In-memory rate limiting (Map-based) for development, recommend external service for production

### Prompt Injection Prevention
- **Input Sanitization**: User queries sanitized before sending to Gemini AI
- **Character Escaping**: Special characters escaped in prompts
- **Length Limits**: Maximum 500 characters for search queries
- **Response Validation**: JSON responses validated before use
- **Fallback**: Basic text search fallback if AI processing fails

### XSS & CSRF Protection
- **XSS**: React's built-in escaping, no `dangerouslySetInnerHTML` without sanitization
- **CSRF**: NextAuth.js built-in CSRF protection, same-site cookies
- **File Uploads**: Validated and sanitized before storage

### Development Security
- **Dev Endpoints**: Protected by `NODE_ENV` checks (only available in development)
- **Error Messages**: Generic messages in production, detailed in development
- **Secrets**: Never committed to git, verified with `.gitignore`

---

## Resources & References

### Documentation Files

- `.cursorrules` - Complete project rules
- `README.md` - Quick start guide
- `docs/BUILD_ORDER.md` - Development phases
- `docs/CSS_MODULES_GUIDE.md` - Styling guide
- `docs/TEAM_ROLES.md` - Team structure
- `docs/product/` - Product documentation (PRDs, roadmap, backlog)

### External Resources

- Next.js Documentation: https://nextjs.org/docs
- Prisma Documentation: https://www.prisma.io/docs
- NextAuth.js Documentation: https://next-auth.js.org
- Framer Motion: https://www.framer.com/motion
- Lucide Icons: https://lucide.dev

---

**End of Context Bible**

This document should be referenced by all AI agents and developers working on the Learning Management System Web App. It provides comprehensive context about the system's architecture, design, business logic, and implementation details.

For updates or corrections, please update this document and increment the version number.

