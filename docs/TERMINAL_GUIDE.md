# Terminal Guide for Non-Developers

## What is a Terminal?

A **terminal** (also called "command line" or "console") is a text-based way to interact with your computer. Instead of clicking buttons, you type commands and press Enter.

Think of it like texting your computer - you send it commands, and it responds with text.

## How to Open Terminal

### On Mac:
1. Press `Command (⌘) + Space` (this opens Spotlight search)
2. Type "Terminal"
3. Press `Enter`
4. A black or white window will open - that's your terminal!

### On Windows:
1. Press `Windows Key + R`
2. Type "cmd" and press Enter
3. A black window will open - that's your terminal!

### Alternative (Easier):
- **Mac**: Right-click on your project folder in Finder, select "New Terminal at Folder"
- **Windows**: Right-click on your project folder, select "Open in Terminal" or "Open PowerShell here"

## Understanding the Terminal

When you open a terminal, you'll see something like:
```
marck.baldorado@A0800152-H000 ~ %
```

This is called a **prompt**. It's waiting for you to type a command.

The `~` means you're in your home folder. We need to go to your project folder.

## Basic Commands

### 1. See Where You Are
**Mac/Linux:**
```bash
pwd
```
This shows your current location (folder path).

**Windows:**
```bash
cd
```
This also shows your current location.

### 2. Change to Your Project Folder
```bash
cd "/Users/marck.baldorado/Documents/Learning Management"
```

**What this does:**
- `cd` = "change directory" (go to a folder)
- The path in quotes is your project folder location
- Press Enter after typing

**Important:** Use quotes `"..."` if your folder name has spaces!

### 3. Verify You're in the Right Place
After running `cd`, run `pwd` again. You should see:
```
/Users/marck.baldorado/Documents/Learning Management
```

If you see this, you're in the right place! ✅

## Running the Database Seed

### Step-by-Step Instructions

1. **Open Terminal** (see "How to Open Terminal" above)

2. **Navigate to Your Project**
   ```bash
   cd "/Users/marck.baldorado/Documents/Learning Management"
   ```
   Press Enter.

3. **Verify Location**
   ```bash
   pwd
   ```
   Press Enter. You should see your project path.

4. **Run the Seed Command**
   ```bash
   npm run db:seed
   ```
   Press Enter.

5. **Wait for Completion**
   You'll see messages like:
   ```
   🌱 Starting seed...
   ✅ Created 38 companies
   ✅ Created 12 positions
   🎉 Seed completed successfully!
   ```

6. **If You See Errors**
   - Don't panic! Copy the error message
   - Share it with your developer or AI assistant
   - Common issues are explained below

## Common Issues & Solutions

### Issue 1: "command not found: npm"
**Problem:** Node.js/npm is not installed or not in your PATH.

**Solution:**
1. Make sure Node.js is installed
2. Try: `which npm` (Mac) or `where npm` (Windows)
3. If nothing shows, you need to install Node.js first

### Issue 2: "Cannot find module"
**Problem:** Dependencies aren't installed.

**Solution:**
```bash
npm install
```
Wait for it to finish, then try `npm run db:seed` again.

### Issue 3: "Error: EPERM" or Permission Denied
**Problem:** You don't have permission to run the command.

**Solution:**
- Make sure you're the owner of the project folder
- On Mac, you might need to use `sudo` (but ask a developer first)
- Check folder permissions

### Issue 4: "Database connection error"
**Problem:** Can't connect to the database.

**Solution:**
1. Check that your `.env` file exists in the project folder
2. Make sure it has `DATABASE_URL=...` with your database connection string
3. Verify the database is running and accessible

### Issue 5: "Prisma Client not generated"
**Problem:** Prisma client is out of sync.

**Solution:**
```bash
npx prisma generate
```
Then try `npm run db:seed` again.

## What Each Command Does (Simple Explanation)

- **`pwd`**: "Print Working Directory" - Shows where you are
- **`cd`**: "Change Directory" - Moves you to a different folder
- **`npm run db:seed`**: Runs a script that adds default data (companies, positions) to your database
- **`npx prisma generate`**: Updates the database tools to match your database structure
- **`npx prisma db push`**: Updates your database structure to match your code

## Tips for Success

1. **Always navigate to your project folder first** before running commands
2. **Copy and paste commands** instead of typing them (fewer typos)
3. **Read the output** - it usually tells you what's happening
4. **Don't close the terminal** while commands are running (wait for the prompt to return)
5. **If something goes wrong**, the error message usually tells you what to do

## Quick Reference

```bash
# 1. Open Terminal (see instructions above)

# 2. Go to your project
cd "/Users/marck.baldorado/Documents/Learning Management"

# 3. Check you're in the right place
pwd

# 4. Run the seed
npm run db:seed

# 5. If you see errors about Prisma, run this first:
npx prisma generate

# 6. Then try the seed again
npm run db:seed
```

## Need Help?

If you're stuck:
1. Copy the exact error message you see
2. Note which step you were on
3. Share both with your developer or AI assistant
4. They can help you fix it!

Remember: Everyone starts somewhere. Don't be afraid to ask questions! 🚀

