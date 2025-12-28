# Success Metrics & KPIs - Learning Management Web App

## Overview

This document defines the key performance indicators (KPIs) and success metrics for the Learning Management Web App. These metrics guide product decisions, measure success, and identify areas for improvement.

**Last Updated**: [Current Date]  
**Version**: 1.0  
**Owner**: Product Manager

## Metric Categories

1. **User Engagement** - How actively users interact with the app
2. **Learning Outcomes** - How effectively users learn and progress
3. **Gamification** - How well gamification drives engagement
4. **Technical Performance** - App reliability and performance
5. **Business Metrics** - Growth, acquisition, and cost efficiency

---

## 1. User Engagement Metrics

### Daily Active Users (DAU)
- **Definition**: Number of unique users who log in and interact with the app in a 24-hour period
- **Target**: 
  - Month 1: 50 DAU
  - Month 3: 200 DAU
  - Month 6: 500 DAU
- **Measurement**: Database query counting unique user sessions per day
- **GA4 Event**: `daily_active_user` (automatic via GA4)
- **Why It Matters**: Indicates daily habit formation and app stickiness

### Monthly Active Users (MAU)
- **Definition**: Number of unique users who interact with the app in a 30-day period
- **Target**:
  - Month 1: 150 MAU
  - Month 3: 600 MAU
  - Month 6: 2,000 MAU
- **Measurement**: Database query counting unique users per month
- **GA4 Event**: `monthly_active_user` (automatic via GA4)
- **Why It Matters**: Shows overall user base growth

### DAU/MAU Ratio
- **Definition**: Daily Active Users divided by Monthly Active Users (engagement rate)
- **Target**: > 30% (indicates strong daily engagement)
- **Measurement**: DAU / MAU * 100
- **Why It Matters**: Higher ratio = more engaged, habitual users

### Session Duration
- **Definition**: Average time users spend in the app per session
- **Target**: 
  - Average: > 10 minutes
  - Median: > 8 minutes
- **Measurement**: GA4 session duration (automatic)
- **GA4 Metric**: `averageSessionDuration`
- **Why It Matters**: Longer sessions indicate deeper engagement

### Sessions Per User
- **Definition**: Average number of sessions per user per week
- **Target**: > 5 sessions per week
- **Measurement**: Database query or GA4
- **GA4 Metric**: `sessionsPerUser`
- **Why It Matters**: Frequency indicates habit formation

### Page Views Per Session
- **Definition**: Average number of pages viewed per session
- **Target**: > 4 pages per session
- **Measurement**: GA4 automatic tracking
- **GA4 Metric**: `screenPageViewsPerSession`
- **Why It Matters**: Indicates exploration and content consumption

### Bounce Rate
- **Definition**: Percentage of single-page sessions (user leaves immediately)
- **Target**: < 40%
- **Measurement**: GA4 automatic tracking
- **GA4 Metric**: `bounceRate`
- **Why It Matters**: Lower bounce rate = better first impression

---

## 2. Learning Outcomes Metrics

### Course Completion Rate
- **Definition**: Percentage of users who complete a course after starting
- **Target**: 
  - Overall: > 60%
  - First course: > 70% (onboarding success)
- **Measurement**: Database query: `(completed courses / started courses) * 100`
- **GA4 Event**: `course_completed` (custom event)
- **Why It Matters**: Primary indicator of learning success

### Task Completion Rate
- **Definition**: Percentage of tasks completed vs. attempted
- **Target**: > 80%
- **Measurement**: Database query: `(completed tasks / attempted tasks) * 100`
- **GA4 Event**: `task_completed` (custom event)
- **Why It Matters**: Shows user persistence and content engagement

### Progress Velocity
- **Definition**: Average percentage of course progress per week
- **Target**: > 10% progress per week per active user
- **Measurement**: Database query calculating progress delta over time
- **Why It Matters**: Indicates steady learning momentum

### Time to First Completion
- **Definition**: Average time from signup to first course/task completion
- **Target**: < 24 hours
- **Measurement**: Database query: `AVG(completion_time - signup_time)`
- **GA4 Event**: Track `first_completion` with timestamp
- **Why It Matters**: Faster first completion = better onboarding

### Return Rate (7-Day)
- **Definition**: Percentage of users who return within 7 days of first visit
- **Target**: > 40%
- **Measurement**: Database query or GA4 cohort analysis
- **GA4 Report**: Cohort Analysis (7-day retention)
- **Why It Matters**: Indicates initial value delivery and habit formation

### Return Rate (30-Day)
- **Definition**: Percentage of users who return within 30 days
- **Target**: > 25%
- **Measurement**: Database query or GA4 cohort analysis
- **GA4 Report**: Cohort Analysis (30-day retention)
- **Why It Matters**: Long-term retention indicates product-market fit

### Learning Path Completion
- **Definition**: Percentage of users who complete full learning paths (multiple courses)
- **Target**: > 30% of users who complete first course
- **Measurement**: Database query tracking sequential course completion
- **Why It Matters**: Shows progression and skill building

---

## 3. Gamification Metrics

### XP Earned Per User
- **Definition**: Average total XP earned per user
- **Target**: 
  - Week 1: > 100 XP
  - Month 1: > 500 XP
  - Month 3: > 2,000 XP
- **Measurement**: Database query: `AVG(total_xp)`
- **GA4 Event**: `xp_earned` (custom event with value)
- **Why It Matters**: Indicates engagement and progress

### Streak Maintenance
- **Definition**: Percentage of users maintaining 3+ day streak
- **Target**: > 50% of active users
- **Measurement**: Database query: `COUNT(users with streak >= 3) / COUNT(active_users)`
- **GA4 Event**: `streak_maintained` (custom event)
- **Why It Matters**: Streaks drive daily engagement

### Average Streak Length
- **Definition**: Average consecutive days users maintain login streak
- **Target**: > 5 days
- **Measurement**: Database query: `AVG(streak)`
- **Why It Matters**: Longer streaks = stronger habits

### Badges Unlocked
- **Definition**: Average number of badges earned per user
- **Target**: > 3 badges per active user
- **Measurement**: Database query: `AVG(badge_count)`
- **GA4 Event**: `badge_unlocked` (custom event)
- **Why It Matters**: Achievements motivate continued engagement

### Leaderboard Participation
- **Definition**: Percentage of users who view leaderboard
- **Target**: > 60% of active users
- **Measurement**: GA4 event: `leaderboard_viewed`
- **Why It Matters**: Social comparison drives engagement

### Diamonds Earned/Spent
- **Definition**: Average diamonds earned and spent per user
- **Target**: 
  - Earned: > 50 diamonds per week
  - Spent: > 30 diamonds per week (shows engagement with rewards)
- **Measurement**: Database query tracking diamond transactions
- **GA4 Events**: `diamonds_earned`, `diamonds_spent` (custom events)
- **Why It Matters**: Currency system engagement

---

## 4. Technical Performance Metrics

### Page Load Time
- **Definition**: Time to first contentful paint (TTFCP)
- **Target**: < 1.5 seconds (mobile)
- **Measurement**: Lighthouse, Web Vitals, GA4
- **GA4 Metric**: `firstContentfulPaint`
- **Why It Matters**: Fast loading = better UX, lower bounce rate

### Time to Interactive (TTI)
- **Definition**: Time until page is fully interactive
- **Target**: < 3 seconds
- **Measurement**: Lighthouse, Web Vitals
- **Why It Matters**: Users can interact quickly

### Largest Contentful Paint (LCP)
- **Definition**: Time to render largest content element
- **Target**: < 2.5 seconds
- **Measurement**: Lighthouse, Web Vitals, GA4
- **GA4 Metric**: `largestContentfulPaint`
- **Why It Matters**: Core Web Vital - affects SEO and UX

### First Input Delay (FID)
- **Definition**: Time from first user interaction to browser response
- **Target**: < 100 milliseconds
- **Measurement**: Lighthouse, Web Vitals, GA4
- **GA4 Metric**: `firstInputDelay`
- **Why It Matters**: Responsiveness affects perceived performance

### Cumulative Layout Shift (CLS)
- **Definition**: Visual stability score (layout shifts)
- **Target**: < 0.1
- **Measurement**: Lighthouse, Web Vitals, GA4
- **GA4 Metric**: `cumulativeLayoutShift`
- **Why It Matters**: Prevents frustrating layout jumps

### Error Rate
- **Definition**: Percentage of requests that result in errors
- **Target**: < 0.1% (1 error per 1000 requests)
- **Measurement**: Vercel logs, error tracking, GA4
- **GA4 Event**: `exception` (automatic)
- **Why It Matters**: Reliability is critical for user trust

### Uptime
- **Definition**: Percentage of time app is available
- **Target**: > 99.9% (less than 43 minutes downtime per month)
- **Measurement**: Uptime monitoring service (e.g., UptimeRobot)
- **Why It Matters**: Availability directly impacts user experience

### API Response Time
- **Definition**: Average API endpoint response time
- **Target**: < 200ms (p95 < 500ms)
- **Measurement**: Vercel analytics, custom logging
- **Why It Matters**: Fast APIs = responsive app

### Lighthouse Score
- **Definition**: Overall performance score (0-100)
- **Target**: > 90 (all categories)
- **Measurement**: Lighthouse CI, manual testing
- **Why It Matters**: Comprehensive performance indicator

---

## 5. Business Metrics

### User Acquisition Cost (CAC)
- **Definition**: Cost to acquire one new user
- **Target**: < $5 per user (if paid marketing)
- **Measurement**: Marketing spend / new users acquired
- **Why It Matters**: Sustainable growth requires low CAC

### User Acquisition Rate
- **Definition**: Number of new users per week/month
- **Target**: 
  - Month 1: 50 new users/week
  - Month 3: 200 new users/week
- **Measurement**: Database query: `COUNT(new_users) WHERE signup_date = week`
- **GA4 Metric**: `newUsers`
- **Why It Matters**: Growth indicator

### Conversion Rate (Signup)
- **Definition**: Percentage of visitors who sign up
- **Target**: > 5% (if marketing site exists)
- **Measurement**: GA4: `(signups / sessions) * 100`
- **GA4 Event**: `sign_up` (custom event)
- **Why It Matters**: Landing page effectiveness

### Cost Per User (CPU)
- **Definition**: Total infrastructure cost per active user per month
- **Target**: < $0.50 per MAU (using free tiers initially)
- **Measurement**: (Vercel + Railway costs) / MAU
- **Why It Matters**: Unit economics for scalability

### Churn Rate
- **Definition**: Percentage of users who stop using the app
- **Target**: < 10% monthly churn
- **Measurement**: Users inactive for 30+ days / total users
- **Why It Matters**: Retention is key to growth

### Net Promoter Score (NPS)
- **Definition**: Likelihood users would recommend the app (0-10 scale)
- **Target**: > 50 (if measured)
- **Measurement**: User survey
- **Why It Matters**: User satisfaction and word-of-mouth

---

## Measurement Methods

### Google Analytics 4 (GA4)

#### Automatic Events
- `page_view` - Page views
- `session_start` - Session tracking
- `user_engagement` - Engagement time
- `first_visit` - New users
- Core Web Vitals (LCP, FID, CLS)

#### Custom Events to Implement
```javascript
// User Actions
gtag('event', 'sign_up', { method: 'email' });
gtag('event', 'login', { method: 'email' });
gtag('event', 'course_started', { course_id: 'xxx', course_name: '...' });
gtag('event', 'course_completed', { course_id: 'xxx', course_name: '...', duration: 3600 });
gtag('event', 'task_completed', { task_id: 'xxx', task_type: 'quiz', score: 85 });
gtag('event', 'xp_earned', { value: 50, source: 'task_completion' });
gtag('event', 'level_up', { level: 5 });
gtag('event', 'badge_unlocked', { badge_type: 'first_course', badge_name: '...' });
gtag('event', 'streak_maintained', { streak_days: 7 });
gtag('event', 'leaderboard_viewed', { leaderboard_type: 'global' });
gtag('event', 'diamonds_earned', { value: 10, source: 'task_completion' });
gtag('event', 'diamonds_spent', { value: 5, item: 'avatar_upgrade' });
```

### Database Queries

#### Example: Course Completion Rate
```sql
SELECT 
  COUNT(DISTINCT CASE WHEN progress = 100 THEN user_id END) * 100.0 / 
  COUNT(DISTINCT user_id) AS completion_rate
FROM course_progresses
WHERE course_id = 'xxx';
```

#### Example: DAU
```sql
SELECT COUNT(DISTINCT user_id) AS dau
FROM sessions
WHERE DATE(created_at) = CURRENT_DATE;
```

### Custom Dashboards

Create dashboards in:
- **GA4**: User engagement, conversion funnels
- **Vercel Analytics**: Performance metrics
- **Custom Admin Dashboard**: Business metrics, user progress

---

## Target Benchmarks by Phase

### Phase 1 (Foundation) - Week 2
- ✅ Zero critical bugs
- ✅ Authentication success rate: 100%
- ✅ Page load time: < 2 seconds

### Phase 2 (Core Features) - Week 4
- ✅ Course completion rate: > 50%
- ✅ Task completion rate: > 70%
- ✅ 7-day return rate: > 30%

### Phase 3 (Gamification) - Week 6
- ✅ DAU/MAU ratio: > 25%
- ✅ Average streak: > 3 days
- ✅ 50% increase in session duration

### Phase 4 (Launch) - Week 8
- ✅ Lighthouse score: > 90
- ✅ Uptime: > 99.9%
- ✅ Error rate: < 0.1%
- ✅ 7-day return rate: > 40%

---

## Reporting Schedule

### Daily
- Error rate monitoring
- Uptime alerts
- Critical metric anomalies

### Weekly
- User engagement metrics (DAU, MAU, sessions)
- Learning outcomes (completion rates)
- Gamification metrics (XP, streaks, badges)
- Technical performance (load times, errors)

### Monthly
- Comprehensive metrics report
- Trend analysis
- Cohort analysis
- Business metrics review
- Goal vs. actual comparison

### Quarterly
- Strategic review
- Metric target adjustments
- New metric identification
- Dashboard optimization

---

## Success Criteria Summary

### MVP Launch Success (Phase 4)
- ✅ 100+ MAU within first month
- ✅ 40%+ 7-day return rate
- ✅ 60%+ course completion rate
- ✅ Lighthouse score > 90
- ✅ 99.9% uptime
- ✅ < 0.1% error rate

### 3-Month Success
- ✅ 600+ MAU
- ✅ 25%+ 30-day return rate
- ✅ 50%+ users maintain 3+ day streak
- ✅ Average session duration > 10 minutes

### 6-Month Success
- ✅ 2,000+ MAU
- ✅ 30%+ DAU/MAU ratio
- ✅ 70%+ course completion rate
- ✅ Sustainable unit economics

---

## Notes

- Metrics should be reviewed and adjusted based on actual performance
- Focus on actionable metrics that drive product decisions
- Balance leading indicators (engagement) with lagging indicators (retention)
- Use metrics to identify problems early and iterate quickly

---

**Next Review Date**: [Set weekly review date]  
**Metrics Owner**: Product Manager  
**Data Analyst**: [If applicable]

