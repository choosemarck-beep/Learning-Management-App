# Product Requirements Document: Gamification System

## Overview

**Document Version**: 1.0  
**Last Updated**: [Current Date]  
**Status**: Draft  
**Owner**: Product Manager  
**Phase**: Phase 3 - Gamification

### Feature Summary
The gamification system adds engaging game-like elements to motivate learning, including XP points, levels, ranks, streaks, leaderboards, badges, and a diamond currency system. Inspired by Duolingo's successful engagement model.

### Goals
1. Increase user engagement and daily usage
2. Motivate users to complete courses and tasks
3. Create sense of achievement and progression
4. Foster healthy competition through leaderboards
5. Reward consistent learning with streaks
6. Build habit formation through daily engagement

---

## User Personas

### Primary Persona: Competitive Learner
- **Name**: Alex, 24, motivated by competition
- **Goals**: Climb leaderboard, earn badges, maintain streaks
- **Pain Points**: Losing streaks, falling behind on leaderboard
- **Needs**: Clear rankings, achievement feedback, streak protection

### Secondary Persona: Achievement Seeker
- **Name**: Sam, 29, collects achievements
- **Goals**: Unlock all badges, reach max level
- **Pain Points**: Missing achievements, unclear requirements
- **Needs**: Clear achievement requirements, progress tracking

---

## User Stories

1. As a learner, I want to earn XP for completing tasks so I feel rewarded
2. As a learner, I want to level up so I see my progress
3. As a learner, I want to see my rank so I know my status
4. As a learner, I want to maintain a streak so I'm motivated to learn daily
5. As a learner, I want to see leaderboards so I can compete with others
6. As a learner, I want to earn badges so I feel accomplished
7. As a learner, I want to earn diamonds so I can unlock rewards

---

## Functional Requirements

### FR-001: XP System
- **Description**: Users earn XP for completing learning activities
- **Acceptance Criteria**:
  - XP earned for: task completion (10-50 XP), lesson completion (bonus), course completion (bonus)
  - XP displayed prominently (dashboard, profile)
  - XP updates immediately after task completion
  - XP animation on earning (celebration effect)
  - Total XP tracked and stored
- **Priority**: P0 (Must Have)

### FR-002: Level System
- **Description**: Users level up based on total XP
- **Acceptance Criteria**:
  - Level calculated from total XP (e.g., Level = sqrt(XP / 100))
  - Level displayed on dashboard and profile
  - Level up animation and celebration
  - Level up notification
  - Level requirements visible (XP needed for next level)
- **Priority**: P0 (Must Have)

### FR-003: Rank System
- **Description**: Pirate-themed ranks based on level
- **Acceptance Criteria**:
  - Ranks: Deckhand → Cabin Boy → Sailor → First Mate → Captain → Admiral
  - Rank displayed on dashboard and profile
  - Rank badge/icon
  - Rank progression visible
  - Next rank requirements shown
- **Priority**: P0 (Must Have)

### FR-004: Streak System
- **Description**: Track consecutive days of learning
- **Acceptance Criteria**:
  - Streak increments on daily login + task completion
  - Streak displayed on dashboard (fire icon, number of days)
  - Streak resets if user misses a day
  - Streak bonus XP (e.g., +10% XP for 7+ day streak)
  - Streak loss warning (grace period - P1)
  - Streak freeze (diamonds to protect streak - P2)
- **Priority**: P0 (Must Have)

### FR-005: Leaderboards
- **Description**: Rankings of users by XP, level, or streak
- **Acceptance Criteria**:
  - Global leaderboard (all users)
  - Shows top 100 users
  - Displays: rank, username, avatar, XP/level, rank badge
  - User's position highlighted
  - Real-time or periodic updates (every 5 minutes)
  - Pagination for viewing more users
  - Crew/team leaderboard (P1 - future)
- **Priority**: P0 (Must Have)

### FR-006: Badge System
- **Description**: Achievement badges for milestones
- **Acceptance Criteria**:
  - Badge types: First Task, First Course, 7-Day Streak, Level 10, etc.
  - Badges unlock automatically when criteria met
  - Badge unlock animation and notification
  - Badge collection page (view all badges)
  - Badge requirements visible
  - Badge icons and descriptions
  - Progress toward next badge shown
- **Priority**: P0 (Must Have)

### FR-007: Diamond Currency System
- **Description**: Virtual currency earned and spent
- **Acceptance Criteria**:
  - Diamonds earned for: task completion (1-5 diamonds), achievements, daily login
  - Diamonds displayed on dashboard
  - Diamonds can be spent on: avatar upgrades, streak freezes, themes (future)
  - Diamond transaction history (P1)
  - Diamond earning animation
- **Priority**: P0 (Must Have)

### FR-008: Rewards and Animations
- **Description**: Engaging visual feedback for achievements
- **Acceptance Criteria**:
  - XP earned animation (diamonds/gems falling)
  - Level up celebration animation
  - Badge unlock animation (treasure chest opening)
  - Streak milestone celebration
  - Smooth, playful animations (Framer Motion)
  - Performance optimized (60fps)
- **Priority**: P0 (Must Have)

---

## Non-Functional Requirements

### NFR-001: Performance
- **Requirement**: Gamification calculations must be fast
- **Details**:
  - XP calculation < 100ms
  - Level calculation < 50ms
  - Leaderboard query < 500ms (with pagination)
  - Animations run at 60fps
- **Priority**: P0

### NFR-002: Real-Time Updates
- **Requirement**: Stats update immediately after actions
- **Details**:
  - XP updates instantly
  - Level up triggers immediately
  - Leaderboard updates within 5 minutes
  - Badge unlocks immediately
- **Priority**: P0

### NFR-003: Mobile Optimization
- **Requirement**: Gamification works well on mobile
- **Details**:
  - Animations perform well on mobile devices
  - Leaderboard is scrollable and readable
  - Touch-friendly badge/achievement displays
- **Priority**: P0

### NFR-004: Data Integrity
- **Requirement**: Gamification data must be accurate
- **Details**:
  - XP calculations are correct
  - Levels calculated accurately
  - Streaks tracked correctly
  - Leaderboard rankings are fair
- **Priority**: P0

---

## Technical Requirements

### Gamification Calculations

#### XP Formula
```
Task Completion: 10-50 XP (based on difficulty)
Lesson Completion Bonus: +20 XP
Module Completion Bonus: +50 XP
Course Completion Bonus: +200 XP
Streak Bonus: +10% XP for 7+ day streak
```

#### Level Formula
```
Level = floor(sqrt(totalXP / 100)) + 1
XP for Next Level = (nextLevel^2 * 100) - totalXP
```

#### Rank Mapping
```
Deckhand: Level 1-5
Cabin Boy: Level 6-10
Sailor: Level 11-20
First Mate: Level 21-30
Captain: Level 31-50
Admiral: Level 51+
```

### Database Schema
- User model: `xp`, `level`, `rank`, `streak`, `diamonds`
- Badge model: `userId`, `type`, `name`, `earnedAt`
- Leaderboard: Calculated from user data (no separate table initially)

### API Endpoints
- `GET /api/user/stats` - Get user gamification stats
- `GET /api/leaderboard` - Get leaderboard (global, crew)
- `GET /api/user/badges` - Get user badges
- `POST /api/tasks/[id]/complete` - Complete task (triggers XP, badge checks)
- `POST /api/user/streak` - Update streak (daily)

---

## Success Criteria

### Phase 3 Success
- ✅ Users earn XP for all completed tasks
- ✅ Levels calculate correctly
- ✅ Leaderboards display accurate rankings
- ✅ Badges unlock when criteria met
- ✅ Streaks track daily activity correctly
- ✅ Animations perform smoothly on mobile

### Engagement Metrics
- ✅ 50% increase in daily active users
- ✅ 70% of users maintain 3+ day streak
- ✅ Average session duration increases by 30%
- ✅ 80% of users earn at least 3 badges

---

## Dependencies

### Internal Dependencies
- Task completion system (Phase 2)
- User authentication (Phase 1)
- Progress tracking (Phase 2)
- Database (user data, badges)

### External Dependencies
- Framer Motion (animations)
- Database performance (leaderboard queries)

---

## Out of Scope (Phase 3)

- Social features (sharing achievements) - Phase 6
- Team/crew creation - Phase 6
- Advanced leaderboard filters - Phase 3 (P2)
- Seasonal events - Phase 5
- Daily challenges/quests - Phase 3 (P1)

---

## Design Considerations

### Visual Design
- Pirate/nautical theme throughout
- Colorful, engaging UI
- Celebration animations
- Progress indicators
- Rank badges/icons

### User Experience
- Immediate feedback on actions
- Clear progress indicators
- Motivating but not overwhelming
- Balance competition with personal progress

### Animation Guidelines
- Smooth, playful animations
- Performance optimized
- Not distracting from learning
- Celebratory but brief

---

## Testing Requirements

### Functional Testing
- [ ] XP earned correctly for all task types
- [ ] Level calculation is accurate
- [ ] Ranks assigned correctly
- [ ] Streaks increment/decrement correctly
- [ ] Leaderboard rankings are accurate
- [ ] Badges unlock when criteria met
- [ ] Diamonds earned and spent correctly

### Performance Testing
- [ ] Leaderboard loads in < 500ms
- [ ] Animations run at 60fps
- [ ] No performance degradation with many users

### Edge Cases
- [ ] Multiple task completions in quick succession
- [ ] Level up during task completion
- [ ] Streak reset at midnight
- [ ] Leaderboard ties (same XP)

---

## Open Questions

1. Should we have streak freezes? (Decision: P2 - future feature)
2. How often should leaderboard update? (Decision: Every 5 minutes)
3. Should we limit XP per day? (Decision: No - encourage learning)

---

## Notes

- Gamification should enhance learning, not distract from it
- Balance competition with personal progress
- Ensure fairness in leaderboard rankings
- Monitor engagement metrics to validate gamification effectiveness

---

**Approval**: [Pending]  
**Next Review**: [Set review date]

