# Reset Password for layoutninja@gmail.com

Your account exists and is APPROVED, but the password might be incorrect. Here's how to reset it:

## Quick Password Reset

### Option 1: Using the Reset Script (Recommended)

1. **Open Terminal** (if not already open)

2. **Navigate to project folder:**
   ```bash
   cd "/Users/marck.baldorado/Documents/Learning Management"
   ```

3. **Reset the password:**
   ```bash
   npm run reset-password layoutninja@gmail.com "NewPassword123!"
   ```
   
   **Important:** Replace `"NewPassword123!"` with your desired password. The password must:
   - Be at least 8 characters
   - Contain at least one uppercase letter (A-Z)
   - Contain at least one lowercase letter (a-z)
   - Contain at least one number (0-9)
   - Contain at least one special character (@$!%*?&)

4. **After reset, try logging in** with the new password

### Option 2: Manual Database Update

If the script doesn't work, you can manually update the password in the database using Prisma Studio:

1. **Open Prisma Studio:**
   ```bash
   npm run db:studio
   ```

2. **Find the user:**
   - Click on "User" model
   - Search for `layoutninja@gmail.com`
   - Click on the user record

3. **Update password:**
   - You'll need to hash the password first (this is complex, so use Option 1 instead)

## Account Status

✅ **Account Found:**
- Email: layoutninja@gmail.com
- Name: Marck
- Role: TRAINER
- Status: APPROVED ✅
- Password: Set ✅
- Email Verified: Yes ✅

## After Resetting Password

1. Try logging in with the new password
2. If it still doesn't work, check:
   - Are you using the exact email (case-sensitive)?
   - Are there any extra spaces in the email/password?
   - Try copying and pasting the email to avoid typos

## Need Help?

If password reset doesn't work, share:
1. The exact error message you see
2. Whether you can see the login page
3. Any console errors (F12 → Console tab)

