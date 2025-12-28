# Installation Guide - Step by Step

This guide will walk you through installing everything needed to test the new Employee Profile page and approval workflow.

---

## What We're Installing

We need to install **email packages** - these are tools that let our app send emails to users (like the welcome email when someone signs up).

**Why?** When a new user signs up, we want to send them an email saying "Welcome! Your account is pending approval." These packages help us do that.

---

## Step 1: Install Email Packages

### What This Does
This downloads and installs the email tools our app needs to send emails.

### How to Do It

1. **Open your terminal** (the command line tool)
   - On Mac: Press `Cmd + Space`, type "Terminal", press Enter
   - On Windows: Press `Win + R`, type "cmd", press Enter

2. **Navigate to your project folder**
   ```bash
   cd "/Users/marck.baldorado/Documents/Learning Management"
   ```
   (This tells the terminal where your project is)

3. **Run the install command**
   ```bash
   npm install resend react-email @react-email/components @react-email/render
   ```

### What Happens
- The terminal will download and install 4 packages:
  - `resend` - The email service we're using
  - `react-email` - Tool for creating email templates
  - `@react-email/components` - Pre-built email components
  - `@react-email/render` - Tool to convert email templates to HTML

- You'll see progress messages like "Installing..." and "Added X packages"
- This usually takes 30-60 seconds

### How to Know It Worked
You should see a message like:
```
added 15 packages, and audited 250 packages in 5s
```

If you see an error, don't worry - we'll troubleshoot it.

---

## Step 2: Update the Database

### What This Does
Our database (where we store user information) needs new fields to track:
- User roles (Employee, Admin, etc.)
- Approval status (Pending, Approved, Rejected)
- Whether onboarding is completed

This step adds those new fields to the database.

### How to Do It

1. **Make sure you're in the project folder** (same as Step 1)

2. **Run the migration command**
   ```bash
   npm run db:migrate
   ```

3. **When prompted, name the migration**
   ```
   add_user_role_and_approval_fields
   ```
   (Just type this and press Enter)

### What Happens
- Prisma (our database tool) will:
  1. Create a new migration file
  2. Add the new fields to the database
  3. Update the database structure

- You'll see messages like:
  ```
  Creating migration...
  Applying migration...
  Migration applied successfully
  ```

### How to Know It Worked
You should see:
```
✔ Migration applied successfully
```

If you see an error about database connection, check your `.env` file has the correct `DATABASE_URL`.

---

## Step 3: Generate Database Client

### What This Does
After we change the database structure, we need to update the code that talks to the database. This step regenerates that code so it knows about the new fields.

### How to Do It

1. **Run the generate command**
   ```bash
   npm run db:generate
   ```

### What Happens
- Prisma reads the updated database structure
- Generates new TypeScript code that knows about:
  - User roles
  - Approval status
  - Onboarding fields

- You'll see:
  ```
  Generating Prisma Client...
  ✔ Generated Prisma Client
  ```

### How to Know It Worked
You should see:
```
✔ Generated Prisma Client
```

---

## Step 4: Get Resend API Key

### What This Does
Resend is the email service we're using. We need an API key (like a password) to prove we're allowed to send emails through their service.

### How to Do It

1. **Go to Resend website**
   - Open your web browser
   - Go to: https://resend.com

2. **Sign up for a free account**
   - Click "Sign Up" or "Get Started"
   - You can sign up with:
     - Email and password
     - Google account
     - GitHub account (if you have one)
   - **It's free!** No credit card required

3. **Verify your email** (if needed)
   - Check your email inbox
   - Click the verification link

4. **Create an API key**
   - Once logged in, go to "API Keys" in the sidebar
   - Click "Create API Key"
   - Give it a name like "Learning Management App"
   - Click "Create"
   - **Copy the API key** - it will look like: `re_abc123xyz...`
   - ⚠️ **Important**: Copy it now! You won't be able to see it again

5. **Add it to your project**
   - Open your `.env` file in the project folder
   - Add this line:
     ```
     RESEND_API_KEY=re_your_actual_key_here
     ```
   - Replace `re_your_actual_key_here` with the key you copied
   - Save the file

### What Happens
- Resend gives you a free account with:
  - 3,000 emails per month (free!)
  - 100 emails per day
  - Perfect for testing and small apps

### How to Know It Worked
- You have an API key copied
- It's added to your `.env` file
- The key starts with `re_`

---

## Step 5: Start the Development Server

### What This Does
This starts your app so you can test it in your browser.

### How to Do It

1. **Run the dev server command**
   ```bash
   npm run dev
   ```

2. **Wait for it to start**
   - You'll see messages like:
     ```
     ▲ Next.js 14.2.0
     - Local:        http://localhost:3000
     ```
   - Wait until you see "Ready" message

3. **Open your browser**
   - Go to: http://localhost:3000
   - You should see your app!

### What Happens
- Next.js starts a local web server
- Your app runs on your computer
- You can test it in your browser
- Any code changes automatically refresh the page

### How to Know It Worked
- Terminal shows "Ready" message
- Browser shows your app at http://localhost:3000
- No error messages in the terminal

---

## Troubleshooting

### Problem: "npm: command not found"
**Solution**: Node.js isn't installed. Install it from https://nodejs.org (get the LTS version)

### Problem: "Cannot connect to database"
**Solution**: 
1. Check your `.env` file has `DATABASE_URL`
2. Make sure the database URL is correct
3. Check if Railway database is running

### Problem: "Module not found: resend"
**Solution**: 
1. Make sure you ran `npm install resend react-email @react-email/components @react-email/render`
2. Check you're in the correct project folder
3. Try deleting `node_modules` folder and `package-lock.json`, then run `npm install` again

### Problem: "Migration failed"
**Solution**:
1. Check database connection in `.env`
2. Make sure database is accessible
3. Try `npm run db:push` instead (for development only)

### Problem: "RESEND_API_KEY is not defined"
**Solution**:
1. Make sure `.env` file exists in project root
2. Check the key is spelled correctly: `RESEND_API_KEY=re_...`
3. Restart the dev server after adding the key

---

## Quick Command Reference

Here are all the commands in order:

```bash
# 1. Install email packages
npm install resend react-email @react-email/components @react-email/render

# 2. Run database migration
npm run db:migrate
# (When prompted, name it: add_user_role_and_approval_fields)

# 3. Generate Prisma client
npm run db:generate

# 4. Start development server
npm run dev
```

**Note**: Step 4 (Resend API key) is done in your browser, not the terminal.

---

## What Each Package Does (Simple Explanation)

**resend**
- The email service itself
- Like a post office that delivers your emails
- Handles the actual sending

**react-email**
- Tool for creating email templates
- Lets us write emails like we write web pages
- Makes emails look professional

**@react-email/components**
- Pre-built email parts
- Like LEGO blocks for emails
- Text, images, buttons, etc.

**@react-email/render**
- Converts email templates to HTML
- Turns our React code into email format
- Makes it ready to send

---

## Next Steps After Installation

Once everything is installed:

1. **Test signup** - Create a new account
2. **Check email** - See if onboarding email arrives
3. **Test login** - Try logging in (should be blocked)
4. **Approve user** - Update user in database to APPROVED
5. **Test profile** - Login and see the profile page

See `QUICK_TEST_SETUP.md` for testing steps!

---

**Need Help?** If you get stuck, check the error message and look for it in the Troubleshooting section above.

