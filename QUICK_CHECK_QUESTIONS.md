# Quick Check: Are Questions in the Database?

## Step 1: Verify Questions Exist

Run this command to check if questions are in your database:

```bash
npm run verify-questions
```

This will show you:
- Which trainings have questions
- Which trainings are missing questions
- If there are any format errors

## Step 2: If Questions Don't Exist, Populate Them

If the verification shows no questions (or 0 questions), run:

```bash
npm run populate-questions
```

**Important**: Make sure you have `GEMINI_API_KEY` set in your `.env` file for this to work.

## Step 3: Check the Edit Quiz Form

1. Go to your trainer dashboard
2. Open a course
3. Click "Edit Quiz" on any training
4. The questions should appear in the modal

## Where Questions Are Displayed

Questions appear in the **Edit Quiz modal** when you:
1. Go to Course Editor (trainer dashboard)
2. Click "Edit Quiz" button on a training
3. The modal opens showing:
   - Quiz settings (title, passing score, etc.)
   - **Questions list** (this is where your 10 questions should appear)

If you see "No questions yet. Add your first question above." it means:
- Either the populate script hasn't run
- Or questions weren't saved correctly

## Troubleshooting

1. **Check browser console** (F12) when opening Edit Quiz - you should see:
   - `Loaded X questions from database` (if questions exist)
   - `Quiz exists but has no questions` (if empty)

2. **Check the verification script output** - it will tell you exactly what's in the database

3. **If questions exist but don't show**: Check for JavaScript errors in the browser console

