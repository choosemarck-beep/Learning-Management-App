# Fix "Internal Server Error" on Signup

## The Problem

You're seeing "Internal server error" because the database doesn't have the new fields yet (`role`, `status`, etc.). When the signup tries to create a user with these fields, it fails.

## Quick Fix (3 Steps)

### Step 1: Check Your Server Console

**First, let's see the actual error:**

1. **Find your terminal** where `npm run dev` is running
2. **Look for red error messages** - they'll tell us exactly what's wrong
3. **Scroll up** to see if there are any database-related errors

**Common errors you might see:**
- `Unknown arg 'role' in data.role`
- `Column "role" does not exist`
- `Migration needed`

---

### Step 2: Run Database Migration

**This adds the new fields to your database:**

1. **Open a new terminal window** (keep your dev server running, or stop it with `Ctrl+C`)

2. **Navigate to your project folder:**
   ```bash
   cd "/Users/marck.baldorado/Documents/Learning Management"
   ```

3. **Run the migration:**
   ```bash
   npm run db:migrate
   ```

4. **When it asks for a migration name, type:**
   ```
   add_user_role_and_approval_fields
   ```
   Then press Enter

5. **Wait for it to finish** - you should see:
   ```
   ✔ Created migration: add_user_role_and_approval_fields
   ✔ Applied migration successfully
   ```

---

### Step 3: Update Database Code

**This updates the code that talks to your database:**

1. **Run this command:**
   ```bash
   npm run db:generate
   ```

2. **Wait for it to finish** - you should see:
   ```
   ✔ Generated Prisma Client
   ```

---

### Step 4: Restart Your Server

**If you stopped your dev server:**

1. **Start it again:**
   ```bash
   npm run dev
   ```

2. **If it's still running**, the changes should auto-reload

---

## Test Again

1. **Go to your signup page:** `http://localhost:3001/signup`
2. **Fill in the form** and click "Create Account"
3. **It should work now!** ✅

---

## If It Still Doesn't Work

### Check the Server Console Again

After running the migration, try signing up again and check your server console for errors. The improved error logging will now show you the exact problem.

### Common Issues:

**Issue 1: "Migration failed"**
- **Solution:** Check your `.env` file has `DATABASE_URL` set correctly
- Make sure your database is running (if using local PostgreSQL)

**Issue 2: "Cannot find module 'resend'"**
- **Solution:** Run: `npm install resend react-email @react-email/components @react-email/render`

**Issue 3: "Prisma Client not generated"**
- **Solution:** Make sure you ran `npm run db:generate` after the migration

---

## What Changed?

I improved the error messages so you'll see the actual error instead of just "Internal server error". This will help us diagnose any future issues faster.

---

## Need Help?

If you're still getting errors after following these steps:

1. **Copy the exact error message** from your server console
2. **Share it with me** and I'll help you fix it!

