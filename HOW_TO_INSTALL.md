# How to Install - Simple Step-by-Step Guide

This guide will teach you how to install everything needed, explained in simple terms.

---

## Understanding What We're Installing

Think of your app like a house that needs new tools to work properly:

1. **Email Packages** = Tools to send emails (like a mailbox)
2. **Database Update** = Adding new rooms to store new information
3. **API Key** = A password to use the email service

Let's install them one by one!

---

## Step 1: Install Email Packages

### What This Does
Your app needs special tools to send emails. We're installing those tools now.

### The Command
Open your terminal and run:

```bash
npm install react-email @react-email/components @react-email/render
```

**Note**: I see `resend` is already in your package.json, so we only need the React Email packages!

### Step-by-Step Instructions

1. **Open Terminal**
   - **Mac**: Press `Cmd + Space`, type "Terminal", press Enter
   - **Windows**: Press `Win + R`, type "cmd", press Enter

2. **Go to Your Project Folder**
   ```bash
   cd "/Users/marck.baldorado/Documents/Learning Management"
   ```
   (This tells the computer where your project is)

3. **Run the Install Command**
   ```bash
   npm install react-email @react-email/components @react-email/render
   ```

4. **Wait for It to Finish**
   - You'll see messages scrolling by
   - Wait until you see something like: "added X packages"
   - This usually takes 30-60 seconds

### What You Should See
```
+ react-email@X.X.X
+ @react-email/components@X.X.X
+ @react-email/render@X.X.X
added 12 packages in 5s
```

### If You See an Error
- **"npm: command not found"** → You need to install Node.js first (go to nodejs.org)
- **"Cannot find package"** → Check your internet connection
- **Permission errors** → Try adding `sudo` before the command (Mac/Linux only)

---

## Step 2: Update Your Database

### What This Does
Your database (where user information is stored) needs new "columns" to track:
- What role each user has (Employee, Admin, etc.)
- Whether they're approved or still waiting
- If they've seen the welcome message

This step adds those new columns.

### The Command
```bash
npm run db:migrate
```

### Step-by-Step Instructions

1. **Make sure you're in the project folder** (same terminal from Step 1)

2. **Run the migration command**
   ```bash
   npm run db:migrate
   ```

3. **When it asks for a migration name, type:**
   ```
   add_user_role_and_approval_fields
   ```
   Then press Enter

### What You Should See
```
✔ Created migration: add_user_role_and_approval_fields
✔ Applied migration successfully
```

### If You See an Error
- **"Cannot connect to database"** → Check your `.env` file has `DATABASE_URL`
- **"Migration already exists"** → That's okay, it means it's already done
- **"Prisma schema is invalid"** → Check `prisma/schema.prisma` file

---

## Step 3: Update Database Code

### What This Does
After we change the database structure, we need to update the code that talks to the database. This regenerates that code.

### The Command
```bash
npm run db:generate
```

### Step-by-Step Instructions

1. **Run the generate command**
   ```bash
   npm run db:generate
   ```

2. **Wait for it to finish** (usually 5-10 seconds)

### What You Should See
```
✔ Generated Prisma Client
```

---

## Step 4: Get Resend API Key

### What This Does
Resend is the email service we're using. We need an API key (like a password) to send emails through them.

### Step-by-Step Instructions

1. **Go to Resend Website**
   - Open your web browser
   - Go to: **https://resend.com**

2. **Sign Up for Free Account**
   - Click "Sign Up" or "Get Started"
   - You can use:
     - Email and password
     - Google account
     - GitHub account
   - **It's completely free!** No credit card needed

3. **Verify Your Email** (if asked)
   - Check your email inbox
   - Click the verification link

4. **Create an API Key**
   - Once logged in, look for "API Keys" in the left sidebar
   - Click "Create API Key"
   - Give it a name: "Learning Management App"
   - Click "Create"
   - **IMPORTANT**: Copy the key immediately! It looks like: `re_abc123xyz...`
   - ⚠️ You won't be able to see it again after you close this window

5. **Add Key to Your Project**
   - Open your project folder in a text editor
   - Find the `.env` file (it might be hidden - show hidden files)
   - Open `.env` file
   - Add this line at the bottom:
     ```
     RESEND_API_KEY=re_paste_your_key_here
     ```
   - Replace `re_paste_your_key_here` with the actual key you copied
   - Save the file

### What You Should See
In your `.env` file:
```
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
RESEND_API_KEY=re_abc123xyz...  ← This new line
```

---

## Step 5: Start Your App

### What This Does
This starts your app so you can test it in your browser.

### The Command
```bash
npm run dev
```

### Step-by-Step Instructions

1. **Run the dev server command**
   ```bash
   npm run dev
   ```

2. **Wait for it to start**
   - You'll see messages scrolling
   - Wait until you see:
     ```
     ▲ Next.js 14.2.0
     - Local:        http://localhost:3000
     ✓ Ready in 2.5s
     ```

3. **Open Your Browser**
   - Go to: **http://localhost:3000**
   - You should see your app!

### What You Should See
- Terminal shows "Ready" message
- Browser shows your app
- No red error messages

---

## Quick Reference - All Commands in Order

Copy and paste these one at a time:

```bash
# 1. Install email packages
npm install react-email @react-email/components @react-email/render

# 2. Update database (when prompted, name it: add_user_role_and_approval_fields)
npm run db:migrate

# 3. Update database code
npm run db:generate

# 4. Start the app
npm run dev
```

**Note**: Step 4 (Resend API key) is done in your browser, not the terminal.

---

## Visual Guide: What Each Step Does

```
┌─────────────────────────────────────┐
│  Step 1: Install Email Packages    │
│  ↓                                  │
│  Downloads tools to send emails     │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  Step 2: Update Database            │
│  ↓                                  │
│  Adds new fields to store:          │
│  - User roles                       │
│  - Approval status                   │
│  - Onboarding status                │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  Step 3: Update Database Code       │
│  ↓                                  │
│  Makes code aware of new fields     │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  Step 4: Get Resend API Key         │
│  ↓                                  │
│  Get password to send emails        │
│  (Done in browser at resend.com)    │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  Step 5: Start App                  │
│  ↓                                  │
│  Run your app and test it!           │
└─────────────────────────────────────┘
```

---

## Common Questions

### Q: What if I make a mistake?
**A**: Don't worry! Most commands can be run again safely. If something goes wrong, just try the command again.

### Q: How long does this take?
**A**: 
- Step 1: 30-60 seconds
- Step 2: 10-30 seconds
- Step 3: 5-10 seconds
- Step 4: 2-5 minutes (browser work)
- Step 5: 10-20 seconds

**Total: About 5-10 minutes**

### Q: Do I need to pay for anything?
**A**: No! Everything is free:
- Resend: Free tier (3,000 emails/month)
- All packages: Free and open source
- Database: Already set up (Railway free tier)

### Q: What if the terminal shows errors?
**A**: 
- Read the error message carefully
- Check the Troubleshooting section below
- Most errors are fixable - don't panic!

---

## Troubleshooting

### Error: "npm: command not found"
**Problem**: Node.js isn't installed  
**Solution**: 
1. Go to https://nodejs.org
2. Download the LTS version (Long Term Support)
3. Install it
4. Restart your terminal
5. Try again

### Error: "Cannot connect to database"
**Problem**: Database connection issue  
**Solution**:
1. Check your `.env` file has `DATABASE_URL`
2. Make sure the URL is correct
3. Check if Railway database is running

### Error: "Module not found: react-email"
**Problem**: Packages didn't install correctly  
**Solution**:
1. Make sure you're in the project folder
2. Try running the install command again
3. Check your internet connection

### Error: "Migration failed"
**Problem**: Database migration issue  
**Solution**:
1. Check database connection
2. Try `npm run db:push` instead (for development)
3. Make sure Prisma schema is valid

### Error: "RESEND_API_KEY is not defined"
**Problem**: API key not set  
**Solution**:
1. Check `.env` file exists
2. Make sure the key is spelled correctly
3. Restart the dev server after adding the key

---

## Success Checklist

After completing all steps, you should have:

- [ ] Email packages installed (no errors in terminal)
- [ ] Database migration completed (see "Migration applied")
- [ ] Prisma client generated (see "Generated Prisma Client")
- [ ] Resend API key in `.env` file
- [ ] Dev server running (see "Ready" message)
- [ ] App opens in browser at http://localhost:3000

---

## Next Steps

Once everything is installed:

1. **Test Signup** - Create a new account
2. **Check Email** - See if welcome email arrives
3. **Test Login** - Try logging in (should be blocked until approved)
4. **Approve User** - Update user in database
5. **Test Profile** - Login and see the profile page

See `QUICK_TEST_SETUP.md` for testing instructions!

---

**Remember**: Take it one step at a time. If you get stuck, read the error message and check the troubleshooting section. You've got this! 🚀

