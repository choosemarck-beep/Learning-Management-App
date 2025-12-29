# Error Database

This document tracks common errors encountered during development and their solutions. This helps prevent repeating the same fixes and allows us to reference proven solutions.

## Error Categories

### 1. TypeScript/Compilation Errors

#### Error: "Expected a semicolon" or "Unexpected token"
**Symptoms:**
- Build fails with syntax errors
- Missing try-catch block structure
- Unmatched braces or parentheses

**Common Causes:**
- Missing `try` block before `catch` block
- Incorrect function structure
- Missing closing braces

**Solution:**
- Ensure every `catch` block has a matching `try` block
- Wrap the entire function body that needs error handling in a try-catch
- Check for proper indentation and brace matching
- Use TypeScript compiler to identify exact syntax issues

**Example Fix:**
```typescript
// ❌ WRONG - catch without matching try for main body
export default async function Page() {
  const user = await getCurrentUser();
  // ... code ...
  return <Component />;
} catch (error) { // ERROR: No matching try
  // ...
}

// ✅ CORRECT - wrap main body in try-catch
export default async function Page() {
  try {
    const user = await getCurrentUser();
    // ... code ...
    return <Component />;
  } catch (error) {
    // ...
  }
}
```

**Files Fixed:**
- `app/(dashboard)/employee/trainer/dashboard/page.tsx` - Added try-catch wrapper around main function body

---

#### Error: "Duplicate response variable declarations"
**Symptoms:**
- Build fails with "the name `response` is defined multiple times"
- Multiple `const response = NextResponse.json(...)` declarations in same scope

**Common Causes:**
- Refactoring left duplicate code
- Copy-paste errors
- Multiple response declarations in try-catch blocks

**Solution:**
- Remove duplicate `response` variable declarations
- Keep only one response declaration per code path
- Ensure response is declared once and reused

**Example Fix:**
```typescript
// ❌ WRONG - duplicate declarations
const response = NextResponse.json({ success: true });
// ... code ...
const response = NextResponse.json({ success: true }); // ERROR: duplicate

// ✅ CORRECT - single declaration
const response = NextResponse.json({ success: true });
// ... code ...
// Reuse the same response variable
```

**Files Fixed:**
- `app/api/admin/users/[userId]/approve/route.ts`
- `app/api/admin/users/[userId]/reject/route.ts`
- `app/api/admin/users/[userId]/reset-password/route.ts`

---

#### Error: Type comparison appears unintentional
**Symptoms:**
- TypeScript error: "This comparison appears to be unintentional because the types 'X' and 'Y' have no overlap"

**Common Causes:**
- Comparing incompatible types in conditionals
- Type narrowing issues

**Solution:**
- Fix type definitions to match actual usage
- Use proper type guards
- Ensure types are compatible before comparison

**Files Fixed:**
- `middleware.ts` - Fixed route type comparisons

---

### 2. Runtime Errors

#### Error: "ERR_TOO_MANY_REDIRECTS"
**Symptoms:**
- Browser shows "redirected you too many times"
- Infinite redirect loop
- Page never loads

**Common Causes:**
- Page component redirects to `/login` when `getCurrentUser()` fails
- Middleware sees session and redirects back to dashboard
- Circular redirect between routes

**Solution:**
- **DO NOT redirect to `/login` in page components** - let middleware handle authentication
- Show error UI instead of redirecting when errors occur
- Use `window.location.href` for hard redirects after login (not `router.push`)
- Fetch session after login to get role and redirect directly to role-based dashboard
- Only allow Next.js `redirect()` for role mismatches (which middleware should handle)

**Example Fix:**
```typescript
// ❌ WRONG - causes redirect loop
if (!user) {
  redirect("/login"); // Middleware will redirect back if session exists
}

// ✅ CORRECT - show error UI
if (!user) {
  return <ErrorUI message="Session not found" />;
}

// ✅ CORRECT - for login redirect
const session = await fetch("/api/auth/session").then(r => r.json());
const redirectUrl = getRoleBasedUrl(session.user.role);
window.location.href = redirectUrl; // Hard redirect, bypasses router
```

**Files Fixed:**
- `app/(auth)/login/page.tsx` - Fetch session and redirect directly to role-based dashboard
- `app/(dashboard)/employee/trainer/dashboard/page.tsx` - Show error UI instead of redirecting

---

#### Error: "500 Internal Server Error" on API routes
**Symptoms:**
- API routes return 500 errors
- Console shows "Failed to fetch" or "Internal Server Error"
- No specific error message

**Common Causes:**
- Unhandled exceptions in `getCurrentUser()`
- Unhandled Prisma database errors
- Missing error handling in try-catch blocks

**Solution:**
- Wrap `getCurrentUser()` in try-catch with specific error handling
- Wrap all Prisma queries in try-catch blocks
- Return proper error responses with status codes
- Add `export const dynamic = 'force-dynamic'` to API routes

**Example Fix:**
```typescript
// ✅ CORRECT - comprehensive error handling
export async function GET(request: NextRequest) {
  try {
    let user;
    try {
      user = await getCurrentUser();
    } catch (authError) {
      console.error("Error getting current user:", authError);
      return NextResponse.json(
        { success: false, error: "Authentication error" },
        { status: 401 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    let data;
    try {
      data = await prisma.model.findMany();
    } catch (dbError) {
      console.error("Database error:", dbError);
      return NextResponse.json(
        { success: false, error: "Failed to fetch data" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
```

**Files Fixed:**
- All admin API routes in `app/api/admin/**`
- Added error handling pattern to 18+ API routes

---

#### Error: "Module build failed: Unexpected token"
**Symptoms:**
- Build fails with "Unexpected token 'div'. Expected jsx identifier"
- Syntax error in JSX/TSX files

**Common Causes:**
- Missing closing tags
- Incorrect ternary operator syntax
- JSX structure issues

**Solution:**
- Check for matching opening/closing tags
- Verify ternary operator syntax: `condition ? <Component1 /> : <Component2 />`
- Ensure proper JSX structure

**Files Fixed:**
- `components/features/courses/TrainingVideoPageClient.tsx` - Fixed ternary operator structure

---

### 3. Database Errors

#### Error: "Prisma Client not generated"
**Symptoms:**
- "Prisma Client not generated" error
- "Unknown argument" errors in Prisma queries
- Build succeeds but runtime errors occur

**Solution:**
- Run `npx prisma generate` after schema changes
- Ensure build command includes `prisma generate`
- Check that `prisma/schema.prisma` is valid

**Prevention:**
- Always run `npx prisma generate` after modifying `prisma/schema.prisma`
- Include `prisma generate` in build command: `"build": "prisma generate && next build"`

---

#### Error: Database connection errors (P1001)
**Symptoms:**
- Error code: `P1001`
- "Can't reach database server"
- Works locally but fails on Vercel

**Solution:**
- Verify `DATABASE_URL` in Vercel environment variables
- Ensure database is not paused (Railway)
- Add `?sslmode=require` to DATABASE_URL for Railway databases
- Check Railway database logs for connection issues

---

### 4. Authentication Errors

#### Error: "Invalid credentials" when credentials are correct
**Symptoms:**
- Login fails even with correct email/password
- "The email or password you entered is incorrect" message

**Common Causes:**
- Email case sensitivity issues
- Password whitespace issues
- User status not APPROVED

**Solution:**
- Normalize email to lowercase: `email.toLowerCase().trim()`
- Trim password: `password.trim()`
- Check user status before allowing login
- Add logging to debug authentication flow

**Files Fixed:**
- `lib/auth/config.ts` - Added email normalization and password trimming
- `app/(auth)/login/page.tsx` - Added client-side normalization

---

### 5. Component Errors

#### Error: "onKeyDown is not defined"
**Symptoms:**
- Runtime error: "onKeyDown is not defined"
- Component crashes when using prop in handler

**Common Causes:**
- Using prop in function without destructuring it from props
- Prop not included in component's TypeScript interface

**Solution:**
- Always destructure all used props from component props
- Include all used props in TypeScript interface
- If prop is used in handler, it must be destructured: `{ prop1, prop2, onKeyDown, ...rest }`

**Example Fix:**
```typescript
// ❌ WRONG
function Component({ prop1, prop2 }: Props) {
  const handleKeyDown = (e: KeyboardEvent) => {
    onKeyDown(e); // ERROR: onKeyDown not defined
  };
}

// ✅ CORRECT
function Component({ prop1, prop2, onKeyDown }: Props) {
  const handleKeyDown = (e: KeyboardEvent) => {
    onKeyDown(e); // Works: onKeyDown is destructured
  };
}
```

---

## Error Prevention Rules

1. **Always wrap `getCurrentUser()` in try-catch** in API routes
2. **Always wrap Prisma queries in try-catch** blocks
3. **Never redirect to `/login` in page components** - let middleware handle it
4. **Show error UI instead of throwing errors** that cause redirects
5. **Use `export const dynamic = 'force-dynamic'`** for pages using dynamic functions
6. **Always destructure all used props** from component props
7. **Run `npx prisma generate`** after schema changes
8. **Check for duplicate variable declarations** after refactoring
9. **Ensure every `catch` has a matching `try`** block
10. **Normalize email and trim password** in authentication

## Error Logging Best Practices

- Use structured logging: `console.error("[ComponentName] Error:", { details })`
- Include context: user ID, role, operation being performed
- Log before redirecting to help debug issues
- Don't expose sensitive data in logs
- Use consistent error message format

## Revision History

- **2024-01-XX**: Created error database
- **2024-01-XX**: Added redirect loop error and solution
- **2024-01-XX**: Added duplicate response variable error
- **2024-01-XX**: Added syntax error (missing try block) error

