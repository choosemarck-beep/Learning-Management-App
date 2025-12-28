# User Stories: Dashboard

## Overview

User stories for the user dashboard, the central hub for learners.

**Epic**: User Dashboard  
**Phase**: Phase 2 - Core Features  
**Status**: Draft

---

## Story 1: View User Stats

**As a** learner  
**I want to** see my current level, XP, rank, and streak  
**So that** I know my progress and am motivated to continue

### Acceptance Criteria
- [ ] Stats card displays: level, total XP, rank, streak, diamonds
- [ ] Stats are prominently displayed at top of dashboard
- [ ] Stats update in real-time after completing tasks
- [ ] Visual design is engaging (pirate theme)
- [ ] Stats are accurate and current

### Story Points: 3
### Priority: P0 (Must Have)
### Dependencies: Gamification system (XP, levels, ranks, streaks)

---

## Story 2: Browse Courses

**As a** learner  
**I want to** see all available courses  
**So that** I can choose what to learn

### Acceptance Criteria
- [ ] Course list/grid displays all published courses
- [ ] Each course card shows: title, thumbnail, description, progress
- [ ] Progress bar shows completion percentage
- [ ] Courses are clickable and navigate to course detail
- [ ] Mobile-optimized layout (single column)
- [ ] Courses load quickly (< 2 seconds)

### Story Points: 5
### Priority: P0 (Must Have)
### Dependencies: Course data, course listing API

---

## Story 3: Continue Learning

**As a** learner  
**I want to** continue where I left off  
**So that** I can easily resume my learning

### Acceptance Criteria
- [ ] "Continue Learning" button/feature on dashboard
- [ ] Jumps to last incomplete task in most recent course
- [ ] Shows course name and lesson/task name
- [ ] Works across all courses
- [ ] If no incomplete tasks, shows "Start New Course"

### Story Points: 3
### Priority: P1 (Should Have)
### Dependencies: Progress tracking, course navigation

---

## Story 4: View Course Progress

**As a** learner  
**I want to** see my progress in each course  
**So that** I know how much I've completed and what's left

### Acceptance Criteria
- [ ] Each course card shows progress bar
- [ ] Progress percentage is displayed (e.g., "60% Complete")
- [ ] Progress updates after task completion
- [ ] Completed courses show 100% and checkmark
- [ ] In-progress courses show current percentage

### Story Points: 2
### Priority: P0 (Must Have)
### Dependencies: Progress tracking system

---

## Story 5: Start New Course

**As a** learner  
**I want to** start a new course  
**So that** I can begin learning new content

### Acceptance Criteria
- [ ] "Start" button on new courses (0% progress)
- [ ] Clicking "Start" navigates to course detail page
- [ ] Course is marked as "in progress" after starting
- [ ] User can start multiple courses

### Story Points: 2
### Priority: P0 (Must Have)
### Dependencies: Course navigation, progress tracking

---

## Story 6: Navigate Dashboard

**As a** learner  
**I want to** navigate the app from the dashboard  
**So that** I can access all features easily

### Acceptance Criteria
- [ ] Header with app logo/branding
- [ ] User menu/avatar (access to profile, settings, logout)
- [ ] Bottom navigation (mobile) with key sections
- [ ] Navigation items: Dashboard, Courses, Profile, Leaderboard (future)
- [ ] Active page indicator
- [ ] Navigation works on all pages

### Story Points: 5
### Priority: P0 (Must Have)
### Dependencies: Navigation component, routing

---

## Story 7: View Recent Activity

**As a** learner  
**I want to** see my recent learning activity  
**So that** I can review what I've completed

### Acceptance Criteria
- [ ] Recent activity section on dashboard
- [ ] Shows last 5-10 completed tasks/lessons
- [ ] Each activity shows: task/lesson name, course name, timestamp
- [ ] Activities are clickable and link to course/lesson
- [ ] Activities are sorted by most recent first

### Story Points: 3
### Priority: P2 (Could Have)
### Dependencies: Task completion tracking, activity API

---

## Story 8: View Achievements Preview

**As a** learner  
**I want to** see my recent achievements  
**So that** I feel accomplished and motivated

### Acceptance Criteria
- [ ] Achievements/badges section on dashboard
- [ ] Shows 3-5 most recent badges earned
- [ ] Badge icons and names displayed
- [ ] Link to full badge collection (future)
- [ ] Badges update when new ones are earned

### Story Points: 3
### Priority: P1 (Should Have - Phase 3)
### Dependencies: Badge system

---

## Epic Summary

**Total Story Points**: 26  
**Must Have (P0)**: 17 points  
**Should Have (P1)**: 6 points  
**Could Have (P2)**: 3 points

**Estimated Effort**: 2-3 weeks (Phase 2)

---

## Notes

- Dashboard is the first impression after login - must be engaging
- Focus on mobile-first design
- Gamification elements should be prominent
- Recent activity and achievements can be added in Phase 3

