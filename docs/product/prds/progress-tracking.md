# Product Requirements Document: Progress Tracking System

## Overview

**Document Version**: 1.0  
**Last Updated**: [Current Date]  
**Status**: Draft  
**Owner**: Product Manager  
**Phase**: Phase 2 - Core Features

### Feature Summary
The progress tracking system calculates and displays user progress at all levels (course, module, lesson, task) to help users understand their learning journey and stay motivated.

### Goals
1. Accurately track completion at all hierarchy levels
2. Provide clear visual progress indicators
3. Enable users to see their learning journey
4. Support "continue where you left off" functionality
5. Calculate progress efficiently and accurately

---

## User Personas

### Primary Persona: Progress-Focused Learner
- **Name**: Jordan, 28, wants to see clear progress
- **Goals**: Track completion, see what's left, resume easily
- **Pain Points**: Unclear progress, hard to resume
- **Needs**: Clear progress bars, completion percentages, resume functionality

---

## User Stories

1. As a learner, I want to see my overall course progress so I know how much is left
2. As a learner, I want to see progress in each module so I know which modules need work
3. As a learner, I want to see progress in each lesson so I can focus on incomplete lessons
4. As a learner, I want to continue where I left off so I don't lose my place
5. As a learner, I want to see my learning history so I can review what I've completed

---

## Functional Requirements

### FR-001: Course Progress Calculation
- **Description**: Calculate overall course completion percentage
- **Acceptance Criteria**:
  - Progress = (completed tasks / total tasks) * 100
  - Progress stored in `CourseProgress` model
  - Progress updates when any task in course is completed
  - Progress displayed on course card and course detail page
  - Progress bar visualization
  - "X% Complete" text display
- **Priority**: P0 (Must Have)

### FR-002: Module Progress Calculation
- **Description**: Calculate module completion percentage
- **Acceptance Criteria**:
  - Progress = (completed lessons / total lessons) * 100
  - Or: (completed tasks in module / total tasks in module) * 100
  - Progress calculated on-demand or cached
  - Progress displayed on module list
  - Progress bar visualization
- **Priority**: P0 (Must Have)

### FR-003: Lesson Progress Calculation
- **Description**: Calculate lesson completion percentage
- **Acceptance Criteria**:
  - Progress = (completed tasks / total tasks in lesson) * 100
  - Progress calculated on-demand
  - Progress displayed on lesson list
  - Progress bar visualization
  - Completion indicator (checkmark when 100%)
- **Priority**: P0 (Must Have)

### FR-004: Task Completion Tracking
- **Description**: Track individual task completion
- **Acceptance Criteria**:
  - Task marked complete when user submits/completes it
  - Completion stored in `TaskCompletion` model
  - One completion per user per task (unique constraint)
  - Completion timestamp recorded
  - Score stored for quiz tasks (optional)
  - Completion status displayed on task list
- **Priority**: P0 (Must Have)

### FR-005: Progress Visualization
- **Description**: Visual progress indicators throughout app
- **Acceptance Criteria**:
  - Progress bars at course, module, lesson levels
  - Progress percentages displayed
  - Completion checkmarks/icons
  - Color-coded progress (e.g., green for complete, blue for in-progress)
  - Smooth progress bar animations
  - Mobile-optimized display
- **Priority**: P0 (Must Have)

### FR-006: Continue Learning Feature
- **Description**: Help users resume where they left off
- **Acceptance Criteria**:
  - "Continue Learning" button on dashboard
  - Jumps to last incomplete task in most recent course
  - Or: Jumps to first incomplete lesson in most recent course
  - Shows course name and lesson/task name
  - Works across all courses
- **Priority**: P1 (Should Have)

### FR-007: Progress History
- **Description**: Show learning activity history
- **Acceptance Criteria**:
  - List of recently completed tasks/lessons
  - Timestamp for each completion
  - Link to course/lesson
  - Limited to last 10-20 activities
  - Displayed on dashboard or profile
- **Priority**: P2 (Could Have)

### FR-008: Completion Certificates (Future)
- **Description**: Generate certificates for course completion
- **Acceptance Criteria**:
  - Certificate generated when course is 100% complete
  - Downloadable PDF certificate
  - Certificate includes: course name, completion date, user name
  - Certificate design matches pirate theme
- **Priority**: P3 (Won't Have - Future Phase)

---

## Non-Functional Requirements

### NFR-001: Performance
- **Requirement**: Progress calculations must be fast
- **Details**:
  - Course progress calculation < 200ms
  - Module/lesson progress < 100ms
  - Progress updates immediately after task completion
  - Efficient database queries (use indexes)
- **Priority**: P0

### NFR-002: Accuracy
- **Requirement**: Progress must be 100% accurate
- **Details**:
  - No rounding errors
  - Consistent calculation logic
  - Handles edge cases (0 tasks, all complete)
- **Priority**: P0

### NFR-003: Real-Time Updates
- **Requirement**: Progress updates immediately
- **Details**:
  - Progress bars update after task completion
  - No page refresh required
  - Smooth animations
- **Priority**: P0

---

## Technical Requirements

### Progress Calculation Logic

#### Course Progress
```typescript
function calculateCourseProgress(courseId: string, userId: string): number {
  const totalTasks = getTotalTasksInCourse(courseId);
  const completedTasks = getCompletedTasksInCourse(courseId, userId);
  return (completedTasks / totalTasks) * 100;
}
```

#### Module Progress
```typescript
function calculateModuleProgress(moduleId: string, userId: string): number {
  const totalTasks = getTotalTasksInModule(moduleId);
  const completedTasks = getCompletedTasksInModule(moduleId, userId);
  return (completedTasks / totalTasks) * 100;
}
```

#### Lesson Progress
```typescript
function calculateLessonProgress(lessonId: string, userId: string): number {
  const totalTasks = getTotalTasksInLesson(lessonId);
  const completedTasks = getCompletedTasksInLesson(lessonId, userId);
  return (completedTasks / totalTasks) * 100;
}
```

### Database Schema
- `CourseProgress`: `userId`, `courseId`, `progress` (0-100), `isCompleted`
- `TaskCompletion`: `userId`, `taskId`, `completedAt`, `score` (optional)

### API Endpoints
- `GET /api/courses/[id]/progress` - Get course progress
- `GET /api/modules/[id]/progress` - Get module progress
- `GET /api/lessons/[id]/progress` - Get lesson progress
- `POST /api/tasks/[id]/complete` - Mark task complete (updates progress)

### Caching Strategy
- Cache course progress in `CourseProgress` table
- Calculate module/lesson progress on-demand (or cache if performance needed)
- Invalidate cache when task is completed

---

## Success Criteria

### Phase 2 Success
- ✅ Progress calculations are accurate (100% correct)
- ✅ Progress updates immediately after task completion
- ✅ Progress bars display correctly at all levels
- ✅ Performance is acceptable (< 200ms for calculations)
- ✅ "Continue Learning" works correctly

### User Acceptance
- ✅ Users can see their progress clearly
- ✅ Progress motivates continued learning
- ✅ Users can easily resume where they left off
- ✅ Progress tracking is reliable

---

## Dependencies

### Internal Dependencies
- Task completion system (Phase 2)
- Course structure (Phase 2)
- Database (task completions, progress tracking)

### External Dependencies
- Database performance (efficient queries)

---

## Out of Scope (Phase 2)

- Progress analytics/reports (Phase 5)
- Progress sharing (Phase 6)
- Learning path recommendations (Phase 5)
- Time-based progress (time spent learning) - Phase 2 (P2)

---

## Design Considerations

### Progress Visualization
- Clear progress bars
- Percentage display
- Completion indicators
- Color coding (incomplete vs. complete)
- Smooth animations

### User Experience
- Progress should be motivating, not overwhelming
- Clear indication of what's left to complete
- Easy to see overall progress at a glance
- "Continue Learning" should be prominent

---

## Testing Requirements

### Functional Testing
- [ ] Course progress calculates correctly
- [ ] Module progress calculates correctly
- [ ] Lesson progress calculates correctly
- [ ] Progress updates after task completion
- [ ] Progress bars display correctly
- [ ] Edge cases: 0 tasks, all complete, partial completion

### Performance Testing
- [ ] Progress calculations are fast (< 200ms)
- [ ] No performance degradation with many tasks
- [ ] Efficient database queries

### Accuracy Testing
- [ ] Progress percentages are correct
- [ ] No rounding errors
- [ ] Handles all completion scenarios

---

## Open Questions

1. Should we cache module/lesson progress? (Decision: Calculate on-demand initially, cache if needed)
2. How should we handle deleted tasks? (Decision: Exclude from total count)
3. Should progress be recalculated or stored? (Decision: Store course progress, calculate module/lesson on-demand)

---

## Notes

- Progress tracking is critical for user motivation
- Accuracy is more important than performance (but both matter)
- Consider caching strategies if performance becomes an issue
- Progress visualization should be clear and engaging

---

**Approval**: [Pending]  
**Next Review**: [Set review date]

