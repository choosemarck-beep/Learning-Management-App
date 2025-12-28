# Product Requirements Document: User Dashboard

## Overview

**Document Version**: 1.0  
**Last Updated**: [Current Date]  
**Status**: Draft  
**Owner**: Product Manager  
**Phase**: Phase 2 - Core Features

### Feature Summary
The user dashboard is the central hub where learners view their progress, access courses, see gamification stats, and navigate the app. It provides a personalized, engaging experience that motivates continued learning.

### Goals
1. Provide clear overview of user progress and achievements
2. Enable quick access to courses and learning content
3. Display gamification stats (XP, level, rank, streak)
4. Motivate users to continue learning
5. Create engaging, Duolingo-inspired experience

---

## User Personas

### Primary Persona: Active Learner
- **Name**: Jordan, 28, learning web development
- **Goals**: Track progress, find next lesson, see achievements
- **Pain Points**: Unclear progress, hard to find content
- **Needs**: Clear progress indicators, easy course access

### Secondary Persona: Casual Learner
- **Name**: Taylor, 35, learning sporadically
- **Goals**: Quick overview, resume where left off
- **Pain Points**: Forgetting where they left off
- **Needs**: Clear "continue learning" prompts, progress reminders

---

## User Stories

1. As a learner, I want to see my current level and XP so I know my progress
2. As a learner, I want to see my streak so I'm motivated to learn daily
3. As a learner, I want to see available courses so I can start learning
4. As a learner, I want to see my progress in each course so I know what's left
5. As a learner, I want to continue where I left off so I don't lose my place
6. As a learner, I want to see my rank so I can compare with others (future)

---

## Functional Requirements

### FR-001: User Stats Card
- **Description**: Display key user statistics prominently
- **Acceptance Criteria**:
  - Shows user's current level (e.g., "Level 5")
  - Shows total XP earned
  - Shows current rank (e.g., "Deckhand", "First Mate")
  - Shows current streak (e.g., "7 day streak")
  - Shows diamonds/currency balance
  - Stats update in real-time after completing tasks
  - Visual design is engaging and gamified (pirate theme)
- **Priority**: P0 (Must Have)

### FR-002: Course List/Grid
- **Description**: Display available courses user can access
- **Acceptance Criteria**:
  - Shows all published courses
  - Each course card displays: title, thumbnail, description, progress
  - Progress bar shows completion percentage
  - "Continue" button for in-progress courses
  - "Start" button for new courses
  - Courses are clickable and navigate to course detail page
  - Mobile-optimized grid/list layout
- **Priority**: P0 (Must Have)

### FR-003: Progress Indicators
- **Description**: Visual progress indicators throughout dashboard
- **Acceptance Criteria**:
  - Overall progress percentage visible
  - Per-course progress bars
  - Progress updates after task completion
  - Visual feedback (animations) on progress updates
- **Priority**: P0 (Must Have)

### FR-004: Navigation Components
- **Description**: Header and navigation for app navigation
- **Acceptance Criteria**:
  - Header with app logo/branding
  - User menu/avatar (access to profile, settings, logout)
  - Bottom navigation (mobile) or sidebar (future desktop)
  - Navigation items: Dashboard, Courses, Profile, Leaderboard (future)
  - Active page indicator
- **Priority**: P0 (Must Have)

### FR-005: Quick Actions
- **Description**: Quick access to common actions
- **Acceptance Criteria**:
  - "Continue Learning" button (jumps to last incomplete lesson)
  - "Start New Course" button (shows course selection)
  - Daily challenge/quest (future Phase 3)
- **Priority**: P1 (Should Have)

### FR-006: Recent Activity
- **Description**: Show recent learning activity
- **Acceptance Criteria**:
  - List of recently completed tasks/lessons
  - Timestamp for each activity
  - Link to course/lesson
  - Limited to last 5-10 activities
- **Priority**: P2 (Could Have)

### FR-007: Achievements/Badges Preview
- **Description**: Show recently earned badges
- **Acceptance Criteria**:
  - Display 3-5 most recent badges
  - Badge icons and names
  - Link to full badge collection (future)
- **Priority**: P1 (Should Have - Phase 3)

---

## Non-Functional Requirements

### NFR-001: Performance
- **Requirement**: Dashboard loads quickly
- **Details**:
  - Page load time < 2 seconds
  - Data fetching optimized (React Query caching)
  - Lazy load course images
- **Priority**: P0

### NFR-002: Mobile-First Design
- **Requirement**: Optimized for mobile viewports
- **Details**:
  - Responsive layout (320px-428px)
  - Touch-friendly buttons (minimum 44x44px)
  - Single column layout
  - Vertical scrolling
- **Priority**: P0

### NFR-003: Accessibility
- **Requirement**: WCAG AA compliance
- **Details**:
  - Proper heading hierarchy
  - Alt text for images
  - Keyboard navigation
  - Screen reader support
- **Priority**: P0

### NFR-004: Real-Time Updates
- **Requirement**: Stats update after actions
- **Details**:
  - XP updates immediately after task completion
  - Level up animations
  - Progress bars update smoothly
- **Priority**: P1

---

## Technical Requirements

### Data Requirements
- User data (level, XP, rank, streak, diamonds)
- Course list with progress
- Recent activity/achievements

### API Endpoints
- `GET /api/user/stats` - Get user statistics
- `GET /api/courses` - Get course list with user progress
- `GET /api/user/activity` - Get recent activity (optional)

### Components
- `DashboardPage` - Main dashboard page
- `UserStatsCard` - Stats display component
- `CourseCard` - Individual course card
- `CourseList` - Course list/grid component
- `ProgressBar` - Progress visualization
- `Navigation` - Navigation component

### State Management
- React Query for server state (courses, stats)
- Zustand for client state (UI state, filters)

---

## Success Criteria

### Phase 2 Success
- ✅ Dashboard loads in < 2 seconds
- ✅ All user stats display correctly
- ✅ Course list displays all published courses
- ✅ Progress indicators are accurate
- ✅ Navigation works on all pages
- ✅ Mobile layout is optimized

### User Acceptance
- ✅ Users can find and access courses easily
- ✅ Progress is clear and motivating
- ✅ Dashboard encourages daily use
- ✅ Zero critical bugs

---

## Dependencies

### Internal Dependencies
- Authentication system (Phase 1)
- Course data structure (Phase 2)
- Progress tracking system (Phase 2)
- Gamification system (XP, levels, ranks - Phase 2)
- Base UI components (Button, Card, ProgressBar)

### External Dependencies
- Database (user data, courses, progress)
- React Query for data fetching

---

## Out of Scope (Phase 2)

- Leaderboard on dashboard (Phase 3)
- Social features (Phase 6)
- Personalized recommendations (Phase 5)
- Advanced filtering/search (Phase 2 - P1)
- Course categories (Phase 2 - P2)

---

## Design Considerations

### Visual Design
- Pirate/nautical theme throughout
- Duolingo-inspired playful design
- Clear hierarchy and visual flow
- Engaging animations and micro-interactions
- Color-coded progress indicators

### Layout
- Stats card at top (most important)
- Course list below (main content)
- Navigation at bottom (mobile) or side (future)
- Single column, vertical scroll

### Gamification Elements
- Level badge prominently displayed
- XP progress bar
- Streak fire icon
- Diamond currency display
- Achievement badges preview

---

## Testing Requirements

### Manual Testing
- [ ] Dashboard loads with user data
- [ ] Stats display correctly
- [ ] Course list displays all courses
- [ ] Progress bars are accurate
- [ ] Navigation works
- [ ] Mobile layout is correct
- [ ] Stats update after task completion
- [ ] Empty states (no courses, no progress)

### Performance Testing
- [ ] Page load time < 2 seconds
- [ ] Smooth scrolling
- [ ] No layout shifts
- [ ] Images load efficiently

---

## Open Questions

1. Should we show leaderboard on dashboard in Phase 2? (Decision: No - Phase 3)
2. How many courses to show initially? (Decision: All published courses, paginate if > 20)
3. Should we show "recommended courses"? (Decision: No - Phase 5)

---

## Notes

- Dashboard is the first impression after login - must be engaging
- Focus on mobile-first design
- Gamification elements should be prominent but not overwhelming
- Consider A/B testing different layouts post-launch

---

**Approval**: [Pending]  
**Next Review**: [Set review date]

