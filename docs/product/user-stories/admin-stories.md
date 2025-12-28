# User Stories: Admin Portal

## Overview

User stories for admin and super admin features (post-launch).

**Epic**: Admin Portal  
**Phase**: Post-Launch (Future Phase)  
**Status**: Draft

---

## Story 1: Admin Login

**As an** administrator  
**I want to** log in to the admin portal  
**So that** I can manage content and users

### Acceptance Criteria
- [ ] Admin login page at `/admin/login`
- [ ] Login with email and password
- [ ] Role-based access (admin or super admin)
- [ ] Unauthorized users cannot access admin routes
- [ ] Session management for admins
- [ ] Logout functionality

### Story Points: 3
### Priority: P0 (Must Have)
### Dependencies: Authentication system, role-based access

---

## Story 2: Create Course

**As an** admin  
**I want to** create new courses  
**So that** I can add learning content

### Acceptance Criteria
- [ ] Course creation form
- [ ] Fields: title, description, thumbnail
- [ ] Form validation
- [ ] Course saved to database
- [ ] Course appears in course list (unpublished)
- [ ] Success message after creation

### Story Points: 5
### Priority: P0 (Must Have)
### Dependencies: Course model, admin UI

---

## Story 3: Edit Course

**As an** admin  
**I want to** edit existing courses  
**So that** I can update course information

### Acceptance Criteria
- [ ] Course edit page
- [ ] Pre-populated form with existing data
- [ ] Can update: title, description, thumbnail
- [ ] Changes saved to database
- [ ] Success message after update

### Story Points: 3
### Priority: P0 (Must Have)
### Dependencies: Course model, admin UI

---

## Story 4: Publish/Unpublish Course

**As an** admin  
**I want to** publish or unpublish courses  
**So that** I can control course availability

### Acceptance Criteria
- [ ] Publish/unpublish toggle on course
- [ ] Published courses visible to users
- [ ] Unpublished courses hidden from users
- [ ] Status clearly indicated
- [ ] Confirmation dialog for unpublish

### Story Points: 2
### Priority: P0 (Must Have)
### Dependencies: Course model, publish status

---

## Story 5: Manage Modules and Lessons

**As an** admin  
**I want to** create and edit modules and lessons  
**So that** I can structure course content

### Acceptance Criteria
- [ ] Create/edit/delete modules within course
- [ ] Create/edit/delete lessons within module
- [ ] Drag-and-drop reordering (optional)
- [ ] Content saved correctly
- [ ] Hierarchy maintained

### Story Points: 8
### Priority: P0 (Must Have)
### Dependencies: Module/lesson models, admin UI

---

## Story 6: Manage Tasks

**As an** admin  
**I want to** create and edit tasks  
**So that** I can add learning activities

### Acceptance Criteria
- [ ] Create/edit/delete tasks within lesson
- [ ] Task type selection (reading, quiz, exercise)
- [ ] Task content editor (supports text, JSON)
- [ ] XP reward configuration
- [ ] Task preview functionality
- [ ] Content saved correctly

### Story Points: 8
### Priority: P0 (Must Have)
### Dependencies: Task model, content editor

---

## Story 7: View Users (Super Admin)

**As a** super admin  
**I want to** view all users  
**So that** I can manage user accounts

### Acceptance Criteria
- [ ] User list page
- [ ] Search and filter functionality
- [ ] Pagination for large lists
- [ ] User details: name, email, role, stats
- [ ] Click to view user detail page

### Story Points: 5
### Priority: P1 (Should Have)
### Dependencies: User model, admin UI

---

## Story 8: Edit Users (Super Admin)

**As a** super admin  
**I want to** edit user information  
**So that** I can handle support issues

### Acceptance Criteria
- [ ] User edit page
- [ ] Can update: name, email, role
- [ ] Role assignment (user, admin, super admin)
- [ ] Changes saved to database
- [ ] Confirmation for role changes

### Story Points: 5
### Priority: P1 (Should Have)
### Dependencies: User model, role management

---

## Story 9: View Analytics (Super Admin)

**As a** super admin  
**I want to** view app analytics  
**So that** I can understand usage and make decisions

### Acceptance Criteria
- [ ] Analytics dashboard
- [ ] User metrics (DAU, MAU, new users)
- [ ] Course metrics (completions, progress)
- [ ] Gamification metrics (XP, levels, streaks)
- [ ] Charts and visualizations
- [ ] Date range filters

### Story Points: 8
### Priority: P1 (Should Have)
### Dependencies: Analytics data, charting library

---

## Story 10: Delete Course

**As an** admin  
**I want to** delete courses  
**So that** I can remove outdated content

### Acceptance Criteria
- [ ] Delete button on course
- [ ] Confirmation dialog
- [ ] Course and all related content deleted
- [ ] Warning about data loss
- [ ] Success message after deletion

### Story Points: 3
### Priority: P1 (Should Have)
### Dependencies: Course deletion, cascade delete

---

## Epic Summary

**Total Story Points**: 50  
**Must Have (P0)**: 29 points  
**Should Have (P1)**: 21 points

**Estimated Effort**: 4-5 weeks (Post-Launch)

---

## Notes

- Admin portal is post-launch priority
- Focus on essential features first (course/content management)
- Security is critical - ensure proper access control
- Desktop layout is acceptable for admin portal

