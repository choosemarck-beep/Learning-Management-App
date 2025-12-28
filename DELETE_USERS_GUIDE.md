# How to Delete All Users from Database

## Option 1: Using Prisma Studio (Easiest - Visual Interface)

### Step-by-Step:

1. **Open a new terminal window** (keep your dev server running)

2. **Navigate to your project folder:**
   ```bash
   cd "/Users/marck.baldorado/Documents/Learning Management"
   ```

3. **Start Prisma Studio:**
   ```bash
   npm run db:studio
   ```

4. **Wait for it to open** - It will automatically open in your browser (usually `http://localhost:5555`)

5. **In Prisma Studio:**
   - Click on **"User"** in the left sidebar
   - You'll see all users listed
   - **Select all users** (check the box at the top, or select them individually)
   - Click the **"Delete"** button (usually at the top or bottom)
   - Confirm the deletion

6. **Done!** All users are deleted.

7. **Close Prisma Studio** - Press `Ctrl+C` in the terminal

---

## Option 2: Using a Script (Faster for Multiple Users)

### Step-by-Step:

1. **Open a new terminal window**

2. **Navigate to your project folder:**
   ```bash
   cd "/Users/marck.baldorado/Documents/Learning Management"
   ```

3. **Run the delete script:**
   ```bash
   npx tsx scripts/delete-all-users.ts
   ```

   **Note:** If `tsx` is not installed, install it first:
   ```bash
   npm install -D tsx
   ```

4. **The script will:**
   - Show how many users exist
   - Delete all users
   - Confirm completion

---

## Option 3: Using Prisma CLI (Quick Command)

### Step-by-Step:

1. **Open a new terminal window**

2. **Navigate to your project folder:**
   ```bash
   cd "/Users/marck.baldorado/Documents/Learning Management"
   ```

3. **Run Prisma Studio in command mode:**
   ```bash
   npx prisma studio
   ```
   Then follow Option 1 steps above.

---

## After Deleting Users

Once all users are deleted:

1. **You can now sign up again** with the same email addresses
2. **Go to:** `http://localhost:3001/signup`
3. **Create a new account** with any email you used before

---

## Safety Notes

- ⚠️ **This will delete ALL users** - Make sure you want to do this!
- ⚠️ **Related data will also be deleted** (due to cascade deletes):
  - Course progress
  - Task completions
  - Badges
  - Sessions
- ✅ **This is safe for development/testing** - You can always create new users

---

## Quick Reference

**Prisma Studio (Recommended):**
```bash
npm run db:studio
```

**Delete Script:**
```bash
npx tsx scripts/delete-all-users.ts
```

