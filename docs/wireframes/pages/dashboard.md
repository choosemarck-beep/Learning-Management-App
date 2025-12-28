# Dashboard Page Wireframe

## Layout Structure

```
┌─────────────────────────────────┐
│  Header (Profile + Notifications)│
├─────────────────────────────────┤
│  User Stats Card                 │
│  - Level, Rank, XP, Streak      │
├─────────────────────────────────┤
│  Daily Challenge Card            │
│  - Today's quest                 │
├─────────────────────────────────┤
│  My Courses Section              │
│  ┌──────┐ ┌──────┐ ┌──────┐    │
│  │Course│ │Course│ │Course│    │
│  │ Card │ │ Card │ │ Card │    │
│  └──────┘ └──────┘ └──────┘    │
├─────────────────────────────────┤
│  Leaderboard Preview             │
│  - Top 3 users                   │
├─────────────────────────────────┤
│  Bottom Navigation               │
│  [Home] [Courses] [Leaderboard] │
└─────────────────────────────────┘
```

## Components Needed
- UserStatsCard
- DailyChallengeCard
- CourseCard
- LeaderboardPreview
- BottomNavigation

## Mobile First
- Single column layout
- Cards stack vertically
- Bottom navigation for easy thumb access
- Swipeable course cards

