# Analytics Setup Guide - Learning Management Web App

## Overview

This document provides a comprehensive guide for setting up Google Analytics 4 (GA4) and tracking user behavior, events, and conversions for the Learning Management Web App.

**Last Updated**: [Current Date]  
**Version**: 1.0  
**Owner**: Product Manager

---

## Google Analytics 4 Setup

### Step 1: Create GA4 Property

1. Go to [Google Analytics](https://analytics.google.com)
2. Create new property (if not exists)
3. Set up data stream for web
4. Add website URL
5. Copy Measurement ID (format: `G-XXXXXXXXXX`)

### Step 2: Install GA4 in Next.js

#### Install Package
```bash
npm install @next/third-parties
```

#### Add to `app/layout.tsx`
```typescript
import { GoogleAnalytics } from '@next/third-parties/google'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <GoogleAnalytics gaId="G-XXXXXXXXXX" />
      </body>
    </html>
  )
}
```

#### Or Use Script Tag
```typescript
// In app/layout.tsx
import Script from 'next/script'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-XXXXXXXXXX');
          `}
        </Script>
      </body>
    </html>
  )
}
```

### Step 3: Environment Variable

Add to `.env.local`:
```env
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

Use in code:
```typescript
const GA_ID = process.env.NEXT_PUBLIC_GA_ID
```

---

## Event Tracking Implementation

### Core Events to Track

#### 1. Authentication Events

```typescript
// Sign Up
gtag('event', 'sign_up', {
  method: 'email'
});

// Login
gtag('event', 'login', {
  method: 'email'
});
```

#### 2. Learning Events

```typescript
// Course Started
gtag('event', 'course_started', {
  course_id: 'course-123',
  course_name: 'Web Development Basics'
});

// Course Completed
gtag('event', 'course_completed', {
  course_id: 'course-123',
  course_name: 'Web Development Basics',
  duration: 3600 // seconds
});

// Task Completed
gtag('event', 'task_completed', {
  task_id: 'task-456',
  task_type: 'quiz',
  course_id: 'course-123',
  score: 85 // if quiz
});

// Lesson Completed
gtag('event', 'lesson_completed', {
  lesson_id: 'lesson-789',
  course_id: 'course-123'
});
```

#### 3. Gamification Events

```typescript
// XP Earned
gtag('event', 'xp_earned', {
  value: 50,
  source: 'task_completion',
  task_id: 'task-456'
});

// Level Up
gtag('event', 'level_up', {
  level: 5,
  total_xp: 2500
});

// Badge Unlocked
gtag('event', 'badge_unlocked', {
  badge_type: 'first_course',
  badge_name: 'First Course Complete'
});

// Streak Maintained
gtag('event', 'streak_maintained', {
  streak_days: 7
});

// Leaderboard Viewed
gtag('event', 'leaderboard_viewed', {
  leaderboard_type: 'global'
});

// Diamonds Earned
gtag('event', 'diamonds_earned', {
  value: 10,
  source: 'task_completion'
});

// Diamonds Spent
gtag('event', 'diamonds_spent', {
  value: 5,
  item: 'avatar_upgrade'
});
```

#### 4. Engagement Events

```typescript
// Dashboard Viewed
gtag('event', 'dashboard_viewed');

// Course List Viewed
gtag('event', 'course_list_viewed');

// Profile Viewed
gtag('event', 'profile_viewed');

// Settings Viewed
gtag('event', 'settings_viewed');
```

---

## Custom Event Helper Function

Create a utility function for consistent event tracking:

```typescript
// lib/analytics.ts
export const trackEvent = (
  eventName: string,
  parameters?: Record<string, any>
) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, parameters);
  }
};

// Usage
import { trackEvent } from '@/lib/analytics';

trackEvent('task_completed', {
  task_id: 'task-456',
  task_type: 'quiz',
  score: 85
});
```

---

## Conversion Tracking

### Key Conversions

#### 1. User Signup
```typescript
gtag('event', 'sign_up', {
  method: 'email'
});
```

#### 2. First Task Completion
```typescript
gtag('event', 'first_task_completed', {
  task_id: 'task-456',
  course_id: 'course-123'
});
```

#### 3. First Course Completion
```typescript
gtag('event', 'first_course_completed', {
  course_id: 'course-123',
  course_name: 'Web Development Basics'
});
```

#### 4. 7-Day Streak
```typescript
gtag('event', 'streak_milestone', {
  streak_days: 7
});
```

### Set Up Conversions in GA4
1. Go to GA4 Admin
2. Navigate to Events
3. Mark events as conversions:
   - `sign_up`
   - `first_task_completed`
   - `first_course_completed`

---

## Funnel Analysis

### Key Funnels to Track

#### 1. Onboarding Funnel
1. Page View (Home)
2. Sign Up
3. Dashboard Viewed
4. Course Started
5. First Task Completed

#### 2. Learning Funnel
1. Course Started
2. Lesson Started
3. Task Completed
4. Lesson Completed
5. Course Completed

#### 3. Engagement Funnel
1. Login
2. Dashboard Viewed
3. Course Accessed
4. Task Completed
5. Return Next Day

### Set Up Funnels in GA4
1. Go to Explore
2. Create Funnel Exploration
3. Add steps in sequence
4. Analyze drop-off points

---

## User Properties

Track user properties for better segmentation:

```typescript
// Set user properties
gtag('set', 'user_properties', {
  user_level: 5,
  user_rank: 'Sailor',
  user_streak: 7,
  total_xp: 2500
});
```

---

## Dashboard Configuration

### Recommended GA4 Reports

#### 1. User Engagement
- Active users (DAU, MAU)
- Session duration
- Pages per session
- Bounce rate

#### 2. Learning Metrics
- Course completions
- Task completions
- Progress tracking
- Time to completion

#### 3. Gamification Metrics
- XP earned
- Levels reached
- Badges unlocked
- Streaks maintained

#### 4. Conversion Metrics
- Signup rate
- First task completion
- First course completion
- 7-day retention

### Custom Dashboard
Create custom dashboard in GA4:
1. Go to Reports
2. Create custom report
3. Add key metrics and dimensions
4. Save for regular review

---

## Privacy & Compliance

### GDPR Compliance
- Anonymize IP addresses (GA4 default)
- Cookie consent (if required)
- Data retention settings
- User data deletion

### Cookie Consent (If Required)
```typescript
// Only load GA4 after consent
if (consentGiven) {
  // Initialize GA4
}
```

---

## Testing & Validation

### Test Events
1. Use GA4 DebugView
2. Enable debug mode:
```typescript
gtag('config', 'G-XXXXXXXXXX', {
  debug_mode: true
});
```
3. Verify events in real-time
4. Check event parameters

### Validation Checklist
- [ ] GA4 installed correctly
- [ ] Events fire on actions
- [ ] Event parameters are correct
- [ ] Conversions tracked
- [ ] Funnels set up
- [ ] Dashboard configured

---

## Monitoring & Alerts

### Set Up Alerts
1. Go to GA4 Admin
2. Create custom alerts for:
   - Significant drop in users
   - Error rate increase
   - Conversion rate changes

### Regular Review
- **Daily**: Check error events
- **Weekly**: Review key metrics
- **Monthly**: Analyze trends and funnels

---

## Notes

- Track events consistently across app
- Use descriptive event names
- Include relevant parameters
- Test events before launch
- Monitor events post-launch
- Iterate based on data

---

**Analytics Owner**: Product Manager  
**Last Updated**: [Current Date]  
**GA4 Property ID**: G-XXXXXXXXXX

