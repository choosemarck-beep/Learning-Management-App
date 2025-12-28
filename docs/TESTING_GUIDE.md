# Testing Guide - Employee Profile & Approval Workflow

## Pre-Testing Setup

### 1. Install Required Packages
```bash
npm install resend react-email @react-email/components @react-email/render
```

### 2. Run Database Migration
```bash
npm run db:migrate
```
This will create the migration for:
- `role` field (enum: SUPER_ADMIN, ADMIN, BRANCH_MANAGER, EMPLOYEE)
- `status` field (enum: PENDING, APPROVED, REJECTED)
- `emailVerified`, `onboardingCompleted`, `approvedAt`, `approvedBy` fields

### 3. Generate Prisma Client
```bash
npm run db:generate
```

### 4. Set Up Environment Variables
Add to your `.env` file:
```env
RESEND_API_KEY=re_your_api_key_here
```

**To get Resend API key:**
1. Sign up at [resend.com](https://resend.com)
2. Create an API key
3. Copy and add to `.env`

### 5. Start Development Server
```bash
npm run dev
```

---

## Testing Checklist

### ✅ Test 1: New User Signup Flow

**Steps:**
1. Navigate to `/signup`
2. Fill in the signup form:
   - Name: "Test User"
   - Email: "test@example.com"
   - Password: "password123"
   - Confirm Password: "password123"
3. Click "Create Account"

**Expected Results:**
- ✅ Success message: "Your enrollment is subject to approval..."
- ✅ Redirected to login page
- ✅ User created in database with:
  - `role: EMPLOYEE` (default)
  - `status: PENDING`
  - `onboardingCompleted: false`
  - `emailVerified: false`
- ✅ Onboarding email sent (check email inbox)

**Check Database:**
```bash
npm run db:studio
```
Verify user record has correct status and role.

---

### ✅ Test 2: Login with Pending Account

**Steps:**
1. Navigate to `/login`
2. Enter credentials from Test 1
3. Click "Sign In"

**Expected Results:**
- ✅ Error message: "Your account is pending approval..."
- ✅ User cannot login
- ✅ Stays on login page

---

### ✅ Test 3: Approve User (Manual Database Update)

**Steps:**
1. Open Prisma Studio: `npm run db:studio`
2. Find the test user
3. Update user:
   - `status`: Change from `PENDING` to `APPROVED`
   - `approvedAt`: Set to current timestamp
   - `emailVerified`: Set to `true`

**Alternative (SQL):**
```sql
UPDATE "User" 
SET status = 'APPROVED', 
    "emailVerified" = true, 
    "approvedAt" = NOW()
WHERE email = 'test@example.com';
```

---

### ✅ Test 4: Login with Approved Account

**Steps:**
1. Navigate to `/login`
2. Enter approved user credentials
3. Click "Sign In"

**Expected Results:**
- ✅ Login successful
- ✅ Redirected to `/employee/profile` (for EMPLOYEE role)
- ✅ Session created with user role

---

### ✅ Test 5: Employee Profile Page - New User

**Steps:**
1. Login as approved EMPLOYEE user
2. Navigate to `/employee/profile`

**Expected Results:**
- ✅ Onboarding message displayed at top
- ✅ Welcome message: "Welcome, [Name]!"
- ✅ "Get Started" button visible
- ✅ Profile header shows:
  - Avatar placeholder (first letter of name)
  - Name
  - Email
  - Role badge: "Employee"
- ✅ Account status badge: "Account Approved"
- ✅ Stats card shows:
  - Level: 1
  - XP: 0
  - Rank: "Deckhand"
  - Streak: 0 days
- ✅ Progress bar shows 0% (no XP yet)

---

### ✅ Test 6: Complete Onboarding

**Steps:**
1. On profile page, click "Get Started" button
2. Wait for page refresh

**Expected Results:**
- ✅ Onboarding message disappears
- ✅ Button shows loading state
- ✅ API call to `/api/employee/onboarding/complete` succeeds
- ✅ `onboardingCompleted` set to `true` in database
- ✅ Page refreshes without onboarding message

**Check Database:**
Verify `onboardingCompleted: true` in user record.

---

### ✅ Test 7: Employee Profile Page - Returning User

**Steps:**
1. Logout and login again
2. Navigate to `/employee/profile`

**Expected Results:**
- ✅ No onboarding message (already completed)
- ✅ Profile header visible
- ✅ Stats card visible
- ✅ All information displays correctly

---

### ✅ Test 8: Role-Based Access Control

**Test 8a: Employee Access**
- ✅ Employee can access `/employee/profile`
- ✅ Employee redirected to `/employee/profile` after login

**Test 8b: Branch Manager Access**
1. Create user with `role: BRANCH_MANAGER` in database
2. Approve the user
3. Login as Branch Manager

**Expected Results:**
- ✅ Can access `/employee/profile`
- ✅ Profile shows "Branch Manager" role badge

**Test 8c: Admin Access**
1. Create user with `role: ADMIN` in database
2. Approve the user
3. Login as Admin

**Expected Results:**
- ✅ Cannot access `/employee/profile`
- ✅ Redirected to `/admin/dashboard` (when created)
- ✅ Or redirected away from profile page

**Test 8d: Super Admin Access**
1. Create user with `role: SUPER_ADMIN` in database
2. Approve the user
3. Login as Super Admin

**Expected Results:**
- ✅ Cannot access `/employee/profile`
- ✅ Redirected to `/super-admin/dashboard` (when created)
- ✅ Or redirected away from profile page

---

### ✅ Test 9: Middleware Redirects

**Test 9a: Unauthenticated Access**
1. Logout
2. Navigate to `/employee/profile`

**Expected Results:**
- ✅ Redirected to `/login`
- ✅ `callbackUrl` parameter set in URL

**Test 9b: Authenticated Redirect**
1. Login as approved user
2. Try to access `/login` or `/signup`

**Expected Results:**
- ✅ Redirected to role-based page:
  - EMPLOYEE → `/employee/profile`
  - BRANCH_MANAGER → `/employee/profile`
  - ADMIN → `/admin/dashboard`
  - SUPER_ADMIN → `/super-admin/dashboard`

---

### ✅ Test 10: Email Functionality

**Test 10a: Onboarding Email**
1. Sign up new user
2. Check email inbox

**Expected Results:**
- ✅ Email received from Resend
- ✅ Subject: "Welcome to Learning Management - Account Pending Approval"
- ✅ Email contains:
  - Learning Management branding
  - Welcome message with user's name
  - Instructions about approval
  - Pixel Galaxy theme styling

**Test 10b: Email Error Handling**
1. Temporarily set invalid `RESEND_API_KEY` in `.env`
2. Sign up new user

**Expected Results:**
- ✅ User still created successfully
- ✅ Error logged in console
- ✅ Signup doesn't fail (email is non-blocking)

---

## Testing Different User Roles

### Creating Test Users

**Via Prisma Studio:**
1. Run `npm run db:studio`
2. Create user manually with desired role

**Via SQL:**
```sql
-- Create Employee
INSERT INTO "User" (email, name, password, role, status, "emailVerified", "onboardingCompleted")
VALUES ('employee@test.com', 'Test Employee', '$2a$10$hashedpassword', 'EMPLOYEE', 'APPROVED', true, false);

-- Create Branch Manager
INSERT INTO "User" (email, name, password, role, status, "emailVerified", "onboardingCompleted")
VALUES ('manager@test.com', 'Test Manager', '$2a$10$hashedpassword', 'BRANCH_MANAGER', 'APPROVED', true, false);

-- Create Admin
INSERT INTO "User" (email, name, password, role, status, "emailVerified", "onboardingCompleted")
VALUES ('admin@test.com', 'Test Admin', '$2a$10$hashedpassword', 'ADMIN', 'APPROVED', true, false);

-- Create Super Admin
INSERT INTO "User" (email, name, password, role, status, "emailVerified", "onboardingCompleted")
VALUES ('superadmin@test.com', 'Test Super Admin', '$2a$10$hashedpassword', 'SUPER_ADMIN', 'APPROVED', true, false);
```

**Note:** You'll need to hash passwords with bcryptjs. Use a tool or create a test script.

---

## Common Issues & Solutions

### Issue: "Cannot find module 'resend'"
**Solution:** Run `npm install resend react-email @react-email/components @react-email/render`

### Issue: "User role not found in session"
**Solution:** 
1. Check `lib/auth/config.ts` includes role in JWT token
2. Check `types/next-auth.d.ts` includes role in session types
3. Logout and login again to refresh session

### Issue: "Migration fails"
**Solution:**
1. Check database connection in `.env`
2. Ensure Prisma schema is valid
3. Try `npm run db:push` for development (if migration fails)

### Issue: "Email not sending"
**Solution:**
1. Check `RESEND_API_KEY` is set in `.env`
2. Verify API key is valid in Resend dashboard
3. Check console for error messages
4. Email sending is non-blocking, so signup should still work

### Issue: "Cannot access profile page"
**Solution:**
1. Check user role is BRANCH_MANAGER or EMPLOYEE
2. Check user status is APPROVED
3. Check middleware is not blocking access
4. Verify session includes role

---

## Mobile Testing

Test on these viewport sizes:
- **320px** (iPhone SE)
- **375px** (iPhone 12/13)
- **390px** (iPhone 14)
- **428px** (iPhone 14 Pro Max)

**Check:**
- ✅ All content fits without horizontal scrolling
- ✅ Buttons are at least 44px tall (touch-friendly)
- ✅ Text is readable and not clipped
- ✅ Onboarding message is fully visible
- ✅ Profile header displays correctly
- ✅ Stats grid is readable

---

## API Testing

### Test Profile API
```bash
# Get profile (requires authentication)
curl -X GET http://localhost:3000/api/employee/profile \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

### Test Onboarding Completion
```bash
# Complete onboarding (requires authentication)
curl -X POST http://localhost:3000/api/employee/onboarding/complete \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

---

## Success Criteria

All tests should pass:
- ✅ New users cannot login until approved
- ✅ Onboarding email sent after signup
- ✅ Profile page displays onboarding message for new users
- ✅ Profile page shows user stats and information
- ✅ Role-based access control works correctly
- ✅ Middleware redirects work based on role
- ✅ Mobile-optimized design (320px-428px)
- ✅ On-brand styling with Pixel Galaxy theme
- ✅ No emojis in UI (icons only)
- ✅ All text is readable and not clipped

---

## Next Steps After Testing

1. **Create Admin Dashboard** (for approving users)
2. **Create Super Admin Dashboard** (for managing admins)
3. **Add password reset functionality**
4. **Add email verification flow**
5. **Implement course management features**

---

**Happy Testing!** 🚀

