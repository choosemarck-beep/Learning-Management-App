# Quick Test Setup - Employee Profile Page

## Step 1: Install Email Packages

```bash
npm install resend react-email @react-email/components @react-email/render
```

## Step 2: Run Database Migration

```bash
npm run db:migrate
```

When prompted, name the migration: `add_user_role_and_approval_fields`

## Step 3: Generate Prisma Client

```bash
npm run db:generate
```

## Step 4: Add Resend API Key

1. Sign up at [resend.com](https://resend.com) (free account)
2. Create an API key
3. Add to `.env` file:
   ```
   RESEND_API_KEY=re_your_api_key_here
   ```

## Step 5: Start Development Server

```bash
npm run dev
```

## Step 6: Test the Flow

### Quick Test Steps:

1. **Sign Up** → Go to `/signup` and create a new account
   - Should see: "Your enrollment is subject to approval..."
   - Check email for onboarding message

2. **Try to Login** → Go to `/login` with new account
   - Should see: "Your account is pending approval..."

3. **Approve User** (via Prisma Studio):
   ```bash
   npm run db:studio
   ```
   - Find your user
   - Change `status` from `PENDING` to `APPROVED`
   - Set `emailVerified` to `true`

4. **Login Again** → Should redirect to `/employee/profile`
   - Should see onboarding message
   - Click "Get Started" to dismiss it
   - Profile should display with stats

## What You Should See

### Employee Profile Page (`/employee/profile`)

**For New Users (onboardingCompleted = false):**
- ✅ Purple gradient welcome card at top
- ✅ "Welcome, [Your Name]!" message
- ✅ "Get Started" button
- ✅ Profile header below (avatar, name, email, role)
- ✅ Stats card (Level, XP, Rank, Streak)

**After Completing Onboarding:**
- ✅ No welcome card
- ✅ Profile header
- ✅ Stats card
- ✅ Progress bar

## Troubleshooting

**"Cannot find module 'resend'"**
→ Run: `npm install resend react-email @react-email/components @react-email/render`

**"User role not found"**
→ Make sure you ran the migration and regenerated Prisma client

**"Email not sending"**
→ Check RESEND_API_KEY in `.env` file

**"Cannot access /employee/profile"**
→ Check user role is EMPLOYEE or BRANCH_MANAGER, and status is APPROVED

---

For detailed testing guide, see `docs/TESTING_GUIDE.md`

