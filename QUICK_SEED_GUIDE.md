# Quick Guide: Running Database Seed

## What is "Seeding"?
**Seeding** means adding default data to your database. Think of it like planting seeds in a garden - you're adding the initial data (companies, positions) that your app needs to work.

## Step-by-Step Instructions

### Step 1: Open Terminal
**On Mac:**
1. Press `Command (⌘) + Space` (opens search)
2. Type "Terminal"
3. Press `Enter`

**Or easier:**
- Right-click on your project folder in Finder
- Select "New Terminal at Folder"

### Step 2: Check You're in the Right Folder
Type this and press Enter:
```bash
pwd
```

You should see:
```
/Users/marck.baldorado/Documents/Learning Management
```

**If you see something different:**
Type this and press Enter:
```bash
cd "/Users/marck.baldorado/Documents/Learning Management"
```

Then run `pwd` again to verify.

### Step 3: Install Dependencies (IMPORTANT - Do This First!)
Type this and press Enter:
```bash
npm install
```

**What this does:** Downloads all the tools your project needs (like `ts-node` which runs the seed script).

**Wait for it to finish** - you'll see lots of text scrolling. When it's done, you'll see your prompt again (the `%` or `$`).

**IMPORTANT:** You MUST run this step before trying to seed! If you skip this, the seed command won't work because `ts-node` won't be installed.

### Step 4: Make Sure Prisma Client is Generated
Type this and press Enter:
```bash
npx prisma generate
```

**What this does:** Updates the database tools to match your database structure.

**You should see:** "✔ Generated Prisma Client"

### Step 5: Run the Seed Command
Type this and press Enter:
```bash
npm run db:seed
```

**What this does:** Runs the seed script that adds companies and positions to your database.

**You should see:**
```
🌱 Starting seed...
✅ Created 38 companies
✅ Created 12 positions
🎉 Seed completed successfully!
```

## If You Get Errors

### Error: "command not found: npm"
**Problem:** Node.js isn't installed or not in your PATH.

**Solution:** 
1. Install Node.js from https://nodejs.org/
2. Restart your terminal
3. Try again

### Error: "Cannot find module 'ts-node'"
**Problem:** Dependencies aren't installed.

**Solution:**
```bash
npm install
```
Then try `npm run db:seed` again.

### Error: "SyntaxError: Expected property name or '}' in JSON"
**Problem:** The seed script configuration had a syntax error (this has been fixed).

**Solution:**
1. Make sure you've run `npm install` to get the latest `package.json` changes
2. Try `npm run db:seed` again
3. If it still fails, share the error message

### Error: "Prisma Client not generated"
**Problem:** Prisma client is out of sync.

**Solution:**
```bash
npx prisma generate
```
Then try `npm run db:seed` again.

### Error: "Database connection error"
**Problem:** Can't connect to the database.

**Solution:**
1. Check that you have a `.env` file in your project folder
2. Make sure it has `DATABASE_URL=...` with your database connection string
3. Verify your database is running (if using Railway, check the dashboard)

### Error: "EPERM" or Permission Denied
**Problem:** You don't have permission.

**Solution:**
- Make sure you're the owner of the project folder
- Try running the command again
- If on Mac, you might need to check folder permissions

## Complete Command Sequence

Copy and paste these commands one at a time, pressing Enter after each:

```bash
# 1. Check location
pwd

# 2. Go to project (if needed)
cd "/Users/marck.baldorado/Documents/Learning Management"

# 3. Install dependencies (if first time or after package.json changes)
npm install

# 4. Generate Prisma client
npx prisma generate

# 5. Run the seed
npm run db:seed
```

## What Success Looks Like

When everything works, you'll see:
```
🌱 Starting seed...
✅ Created 38 companies
✅ Created 12 positions
🎉 Seed completed successfully!
```

After this, your signup form should work! 🎉

## Still Having Issues?

1. **Copy the exact error message** you see
2. **Note which step** you were on (Step 1, 2, 3, etc.)
3. **Share both** with your developer or AI assistant
4. They can help you fix it!

## Remember

- **One command at a time** - wait for each to finish before running the next
- **Read the output** - it usually tells you what's happening
- **Don't panic** - errors are normal, and we can fix them together!

