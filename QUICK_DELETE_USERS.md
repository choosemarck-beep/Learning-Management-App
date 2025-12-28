# Quick Guide: Delete All Users

## ⚡ Easiest Method: Use Browser API (Recommended)

**No terminal needed!**

1. **Make sure your dev server is running** (`npm run dev`)

2. **Open your browser** and go to:
   ```
   http://localhost:3001/api/dev/delete-all-users
   ```

3. **You'll see a JSON response** showing how many users were deleted

**OR** use the browser console (F12) and run:
```javascript
fetch('/api/dev/delete-all-users', { method: 'POST' })
  .then(r => r.json())
  .then(result => console.log(result));
```

---

## Alternative: Fix the Script Command

If you want to use the script, you need to be in the project directory first:

1. **Navigate to project folder:**
   ```bash
   cd "/Users/marck.baldorado/Documents/Learning Management"
   ```

2. **Then run the script:**
   ```bash
   npx tsx scripts/delete-all-users.ts
   ```

---

## Recommendation

**Just use the browser method** - it's the easiest! No need to navigate directories or install anything.

