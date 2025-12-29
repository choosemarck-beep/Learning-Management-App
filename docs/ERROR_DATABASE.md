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

#### Error: "Server Components render error" - Generic error message in production
**Symptoms:**
- Dashboard shows "Dashboard Error" with generic message
- Error message: "An error occurred in the Server Components render. The specific message is omitted in production builds to avoid leaking sensitive details."
- Console shows error boundary catching errors but actual error is hidden
- Error digest property exists but doesn't reveal the actual issue

**Common Causes:**
- Server component throwing an error during render
- Null/undefined access in server component
- Data serialization issues (passing non-serializable data to client components)
- Missing error handling for async operations
- Variables used before being defined or validated

**Solution:**
- Add comprehensive error logging that works in production (logs to Vercel console)
- Add defensive checks before accessing variables (null checks, array checks)
- Validate all data before passing to client components
- Use error digest to track errors even when message is hidden
- Add final validation checks before render
- Ensure all variables are properly scoped and defined

**Example Fix:**
```typescript
// ❌ WRONG - no validation, error hidden in production
return (
  <Component
    data={userData.avatar} // Might be null/undefined
    items={items} // Might not be array
  />
);

// ✅ CORRECT - validate before render, log errors
try {
  // Validate all data
  if (!user || !userData) {
    throw new Error("User data is missing");
  }
  
  if (!Array.isArray(items)) {
    throw new Error("Items must be an array");
  }
  
  // Log before render for debugging
  console.log("[Component] Final render check:", {
    hasUser: !!user,
    hasUserData: !!userData,
    itemsLength: items.length,
  });
  
  return (
    <Component
      data={userData.avatar || null} // Safe null handling
      items={items} // Guaranteed to be array
    />
  );
} catch (error) {
  // Enhanced logging that works in production
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorDigest = error && typeof error === 'object' && 'digest' in error 
    ? String((error as any).digest) 
    : undefined;
  
  console.error("[Component] CRITICAL ERROR:", {
    message: errorMessage,
    digest: errorDigest,
    timestamp: new Date().toISOString(),
  });
  
  // Show user-friendly error with digest for tracking
  return <ErrorUI message={userFriendlyMessage} digest={errorDigest} />;
}
```

**Files Fixed:**
- `app/(dashboard)/employee/trainer/dashboard/page.tsx` - Added validation checks, enhanced error logging, safe variable access, explicit field selection in Prisma queries

**Additional Notes:**
- **500 Internal Server Error with digest**: When you see a 500 error with a digest (e.g., `653041714`), check Vercel function logs for the actual error
- **Prisma Query Issues**: Always explicitly `select` or `include` fields you need - don't rely on default selections
- **Database Error Handling**: Catch database errors with detailed logging including userId, timestamp, and full error details
- **Graceful Degradation**: For non-critical data (like preferences), use empty defaults instead of throwing errors to prevent 500s

**Prevention:**
- Always validate data before accessing properties
- Use optional chaining (`?.`) and nullish coalescing (`??`) for safe access
- Add final validation checks before render
- Log data structure before passing to client components
- Use error digest for tracking errors in production
- **CRITICAL**: Ensure all data passed to client components is serializable (no functions, Date objects, circular references)
- Convert all values to primitives (String, Number, Boolean) before passing to client components
- Validate that required string properties (like `user.name`, `user.email`) exist and are strings before use
- Use explicit type conversion: `String(value)` instead of relying on implicit conversion

---

#### Error: Logout redirects to localhost instead of production URL
**Symptoms:**
- After logout, user is redirected to `http://localhost:3000/` instead of production URL
- Happens regardless of account type
- Issue persists in production (Vercel)

**Common Causes:**
- NextAuth `signOut` page config set to `"/"` instead of `"/login"`
- `callbackUrl` not using absolute URL with current origin
- NextAuth using `NEXTAUTH_URL` environment variable which might be set to localhost

**Solution:**
- Update NextAuth config: `signOut: "/login"` instead of `signOut: "/"`
- Always use `window.location.origin` for `callbackUrl` in logout handlers
- Ensure `callbackUrl` is an absolute URL: `${window.location.origin}/login`
- Add proper window check before accessing `window.location.origin`

**Example Fix:**
```typescript
// ❌ WRONG - NextAuth config
pages: {
  signIn: "/login",
  signOut: "/", // This can cause redirect issues
}

// ✅ CORRECT - NextAuth config
pages: {
  signIn: "/login",
  signOut: "/login", // Redirect to login after logout
}

// ❌ WRONG - Logout handler
const handleLogout = async () => {
  await signOut({ callbackUrl: "/login" }); // Relative URL
};

// ✅ CORRECT - Logout handler
const handleLogout = async () => {
  if (typeof window !== "undefined") {
    const loginUrl = `${window.location.origin}/login`; // Absolute URL
    await signOut({ callbackUrl: loginUrl });
  } else {
    await signOut({ callbackUrl: "/login" }); // Fallback
  }
};
```

**Files Fixed:**
- `lib/auth/config.ts` - Updated `signOut` page to `/login`
- `components/layout/UserMenu.tsx` - Updated logout handler to use absolute URL
- `components/features/admin/UserProfileDropdown.tsx` - Updated logout handler to use absolute URL

**Prevention:**
- Always use `window.location.origin` for absolute URLs in client-side code
- Update NextAuth page configs to use explicit routes instead of root `/`
- Test logout functionality in both development and production environments

---

#### Error: Server Components render errors across multiple dashboard pages
**Symptoms:**
- Multiple dashboard pages showing "Server Components render error"
- 500 Internal Server Error on dashboard pages
- Error digest codes in production (e.g., `653041714`)
- Errors occur on Staff, Branch Manager, Area Manager, Regional Manager, Admin, and Super Admin dashboards

**Common Causes:**
- Missing explicit field selection in Prisma queries
- Non-serializable data passed to client components
- Missing validation checks before render
- Inadequate error handling causing redirect loops
- Missing try-catch wrappers around main function body

**Solution:**
- **Systematic Fix Pattern**: Apply the same comprehensive fixes to all dashboard pages:
  1. Wrap main function body in try-catch block
  2. Add explicit `select` for all Prisma queries (especially `avatar` field)
  3. Serialize all data before passing to client components (convert to primitives)
  4. Validate `user.name` and `user.email` before render
  5. Add enhanced error logging with userId, timestamp, error details
  6. Show error UI instead of redirecting to prevent loops
  7. Use graceful degradation for non-critical data

**Files Fixed:**
- `app/(dashboard)/employee/staff/dashboard/page.tsx` - Applied all fixes
- `app/(dashboard)/employee/branch-manager/dashboard/page.tsx` - Applied all fixes
- `app/(dashboard)/employee/area-manager/dashboard/page.tsx` - Applied all fixes
- `app/(dashboard)/employee/regional-manager/dashboard/page.tsx` - Applied all fixes
- `app/(dashboard)/admin/dashboard/page.tsx` - Applied data serialization and validation
- `app/(dashboard)/super-admin/dashboard/page.tsx` - Applied data serialization and validation

**Implementation Pattern:**
```typescript
export default async function DashboardPage() {
  // 1. Get user with error handling (show UI, don't redirect)
  let user;
  try {
    user = await getCurrentUser();
  } catch (authError) {
    return <ErrorUI message="Authentication error" />;
  }

  if (!user) {
    return <ErrorUI message="Session not found" />;
  }

  // 2. Validate user properties
  if (!user.name || !user.email) {
    throw new Error("User data incomplete");
  }

  // 3. Fetch userData with explicit select
  let userData;
  try {
    userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        avatar: true, // Explicit selection
        name: true,
        // ... other required fields
      },
    });
  } catch (dbError) {
    console.error("[Dashboard] Error:", { userId: user.id, error: dbError });
    throw new Error("Failed to load user data");
  }

  // 4. Serialize data before passing to client components
  const serializableData = {
    // Convert all to primitives: String(), Number(), Boolean()
  };

  // 5. Final validation before render
  if (!userData || !user.name || !user.email) {
    throw new Error("Missing required data");
  }

  // 6. Render with safe values
  return <Component data={serializableData} />;
} catch (error) {
  // Enhanced error handling with digest tracking
  // Show error UI instead of redirecting
}
```

**Prevention:**
- Always apply the same error handling pattern to all dashboard pages
- Use explicit `select` in Prisma queries instead of relying on `include` defaults
- Serialize all data before passing to client components
- Validate required properties before render
- Use graceful degradation for non-critical data failures
- Show error UI instead of redirecting to prevent loops

---

## Revision History

- **2024-01-XX**: Created error database
- **2024-01-XX**: Added redirect loop error and solution
- **2024-01-XX**: Added duplicate response variable error
- **2024-01-XX**: Added syntax error (missing try block) error
- **2024-01-XX**: Added Server Components render error (production error hiding)
- **2024-01-XX**: Added logout redirect to localhost error and solution
- **2024-01-XX**: Added systematic dashboard fixes pattern and applied to all dashboard pages

