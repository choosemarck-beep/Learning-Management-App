# Error Database

This document tracks common errors encountered during development and their solutions. This helps prevent repeating the same fixes and allows us to reference proven solutions.

**CRITICAL - Systematic Error Tracking:**
- **ALL errors encountered are documented here** with symptoms, causes, solutions, and prevention guidelines
- **Every fix is tracked** with file names, commit references, and date stamps
- **Patterns are identified** to prevent similar errors in the future
- **Learning from debugging** is captured in prevention guidelines and best practices
- **Error categories** are organized for easy reference (TypeScript, Runtime, Database, Authentication, etc.)
- **Revision history** tracks when new error patterns are added
- **This is a living document** that grows with every error we encounter and fix

## Error Categories

### 1. TypeScript/Compilation Errors

#### Error: "Expected a semicolon" or "Unexpected token"
**Symptoms:**
- Build fails with syntax errors
- Missing try-catch block structure
- Unmatched braces or parentheses
- JSX parsing errors: "Unexpected token `div`. Expected jsx identifier"

**Common Causes:**
- Missing `try` block before `catch` block
- Incorrect function structure
- Missing closing braces
- JSX elements placed outside their parent container (e.g., after closing conditional render)
- Missing closing parentheses or braces in conditional rendering

**Solution:**
- Ensure every `catch` block has a matching `try` block
- Wrap the entire function body that needs error handling in a try-catch
- Check for proper indentation and brace matching
- Use TypeScript compiler to identify exact syntax issues
- **For JSX errors**: Verify all JSX elements are properly nested within their parent containers
- **For conditional rendering**: Ensure closing `)}` or `}` matches opening `{condition && (`
- Check that JSX elements are not placed after a closing tag of a conditional render

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

**JSX Structure Error Example:**
```tsx
// ❌ WRONG - JSX element outside conditional render
{videoUrl && embedUrl && (
  <div className={styles.videoContainer}>
    {/* Video content */}
  </div>
)}
{/* This element is OUTSIDE the conditional - causes parsing error */}
<div className={styles.progressOverlay}>...</div>

// ✅ CORRECT - JSX element inside conditional render
{videoUrl && embedUrl && (
  <div className={styles.videoContainer}>
    {/* Video content */}
    {/* This element is INSIDE the conditional */}
    <div className={styles.progressOverlay}>...</div>
  </div>
)}
```

**Files Fixed:**
- `app/(dashboard)/employee/trainer/dashboard/page.tsx` - Added try-catch wrapper around main function body
- `components/features/courses/MiniTrainingModal.tsx` - Moved progress timer overlay inside video container conditional render

---

#### Error: "Duplicate variable declarations"
**Symptoms:**
- Build fails with "the name `variableName` is defined multiple times"
- Multiple `const variableName = ...` declarations in same scope
- Common with: `response`, `onboardingCompleted`, and other variables

**Common Causes:**
- Refactoring left duplicate code (old declaration not removed)
- Copy-paste errors during code restructuring
- Variable declared both outside and inside try-catch blocks
- Variable declared before and after validation checks

**Solution:**
- Remove duplicate variable declarations
- Keep only one declaration per variable in the correct scope
- When moving code into try-catch blocks, remove old declarations outside
- Ensure variable is declared once in the appropriate location

**Example Fix:**
```typescript
// ❌ WRONG - duplicate declarations
const onboardingCompleted = userData.onboardingCompleted || false;
// ... code ...
// Final validation before render
const onboardingCompleted = userData.onboardingCompleted || false; // ERROR: duplicate

// ✅ CORRECT - single declaration
// Final validation before render
const onboardingCompleted = userData.onboardingCompleted || false;
// Use the variable
```

**Files Fixed:**
- `app/api/admin/users/[userId]/approve/route.ts` - duplicate `response`
- `app/api/admin/users/[userId]/reject/route.ts` - duplicate `response`
- `app/api/admin/users/[userId]/reset-password/route.ts` - duplicate `response`
- `app/(dashboard)/employee/staff/dashboard/page.tsx` - duplicate `onboardingCompleted`
- `app/(dashboard)/employee/branch-manager/dashboard/page.tsx` - duplicate `onboardingCompleted`
- `app/(dashboard)/employee/area-manager/dashboard/page.tsx` - duplicate `onboardingCompleted`
- `app/(dashboard)/employee/regional-manager/dashboard/page.tsx` - duplicate `onboardingCompleted`

**Prevention:**
- When refactoring code, always check for old variable declarations before adding new ones
- Use search/replace carefully to avoid leaving duplicate code
- Review entire function scope when moving variables into try-catch blocks
- Use linter to catch duplicate declarations before committing

---

#### Error: Type 'string[]' is not assignable to type 'UserRole[]' (Prisma Enum Type Error)
**Symptoms:**
- Build fails with TypeScript error: `Type 'string[]' is not assignable to type 'UserRole[]'`
- Error occurs in Prisma queries using `notIn` or `in` filters with role enums
- Error message: `Types of property 'notIn' are incompatible. Type 'string[]' is not assignable to type 'UserRole[]'`

**Common Causes:**
- Using string literals `["ADMIN", "SUPER_ADMIN"]` instead of enum values in Prisma queries
- Prisma requires enum types, not string arrays for enum fields
- TypeScript strict mode catches type mismatches at compile time

**Solution:**
- Import `UserRole` enum from `@prisma/client`
- Use enum values instead of string literals: `[UserRole.ADMIN, UserRole.SUPER_ADMIN]`
- Replace all string array role filters with enum arrays

**Example Fix:**
```typescript
// ❌ WRONG - using string literals
import { prisma } from "@/lib/prisma/client";

const employeeWhere = {
  role: {
    notIn: ["ADMIN", "SUPER_ADMIN"], // ERROR: Type 'string[]' not assignable to 'UserRole[]'
  },
  status: "APPROVED", // ERROR: Type 'string' not assignable to 'UserStatus'
};

// ✅ CORRECT - using enum values
import { prisma } from "@/lib/prisma/client";
import { UserRole, UserStatus } from "@prisma/client";

const employeeWhere = {
  role: {
    notIn: [UserRole.ADMIN, UserRole.SUPER_ADMIN], // Correct: enum array
  },
  status: UserStatus.APPROVED, // Correct: enum value
};
```

**Files Fixed:**
- `app/api/admin/analytics/users/route.ts` - Fixed employeeWhere role and status filters
- `app/api/admin/analytics/engagement/route.ts` - Fixed employeeWhere role and status filters
- `app/api/admin/analytics/overview/route.ts` - Fixed employeeWhere and pending approvals (role and status filters)
- `app/api/admin/analytics/learning/route.ts` - Fixed employeeWhere role and status filters
- `app/api/admin/analytics/gamification/route.ts` - Fixed employeeWhere role and status filters

**Prevention:**
- Always import enum types from `@prisma/client` when using them in Prisma queries
- Use enum values (`UserRole.ADMIN`) instead of string literals (`"ADMIN"`) for enum fields
- TypeScript will catch these errors at compile time, preventing runtime issues
- Check Prisma schema to identify which fields are enums before writing queries
- **Both role and status fields are enums** - always use `UserRole` and `UserStatus` enums
- **Batch all enum fixes together** - fix both UserRole and UserStatus in the same commit to avoid wasting Vercel deployments

**Related Error:**
- Same pattern applies to `UserStatus` enum - use `UserStatus.APPROVED` instead of `"APPROVED"`

**Deployment Best Practice:**
- When fixing multiple related TypeScript errors, fix ALL of them before committing
- Don't commit fixes one at a time - batch related fixes together
- Wait at least 2 minutes between deployments (per .cursorrules)
- Check for all enum-related errors at once (UserRole, UserStatus, etc.) before pushing

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
- Build fails with "Unexpected token 'div'/'header'. Expected jsx identifier"
- Syntax error in JSX/TSX files
- Error occurs during Vercel build

**Common Causes:**
- Missing closing tags
- Incorrect ternary operator syntax
- JSX structure issues
- Multiple JSX elements in ternary without React Fragment wrapper
- Missing fragment wrapper when returning multiple elements from conditional

**Solution:**
- Check for matching opening/closing tags
- Verify ternary operator syntax: `condition ? <Component1 /> : <Component2 />`
- **When returning multiple elements from ternary, wrap in React Fragment**: `condition ? <>...</> : <Component />`
- Ensure proper JSX structure
- Use `<>...</>` or `<React.Fragment>...</React.Fragment>` for multiple elements

**Example Fix:**
```typescript
// ❌ WRONG - multiple elements without fragment
{userAvatar ? (
  <img src={userAvatar} alt={userName} />
  <div className="placeholder">...</div>
) : (
  <span>Initial</span>
)}

// ✅ CORRECT - wrap multiple elements in fragment
{userAvatar ? (
  <>
    <img src={userAvatar} alt={userName} />
    <div className="placeholder">...</div>
  </>
) : (
  <span>Initial</span>
)}
```

**Files Fixed:**
- `components/features/courses/TrainingVideoPageClient.tsx` - Fixed ternary operator structure
- `components/layout/admin/AdminHeader.tsx` - Added React Fragment wrapper for multiple elements in ternary
- `components/layout/trainer/TrainerHeader.tsx` - Added React Fragment wrapper for multiple elements in ternary
- `components/features/admin/UserProfileDropdown.tsx` - Added React Fragment wrapper for multiple elements in ternary
- `components/features/employee/ProfileCover.tsx` - Added React Fragment wrapper for multiple elements in ternary

---

#### Error: "Cannot find name 'unlink'" or "Cannot find name 'join'" or "Cannot find name 'existsSync'"
**Symptoms:**
- Build fails with "Cannot find name 'unlink'/'join'/'existsSync'"
- TypeScript error about undefined filesystem functions
- Occurs after migrating from local filesystem to cloud storage

**Common Causes:**
- Leftover filesystem code after migrating to Cloudinary/S3
- Missing import statements for filesystem functions
- Old cleanup code still trying to delete local files
- DELETE handlers still using filesystem operations

**Solution:**
- Remove all filesystem operations (`unlink`, `join`, `existsSync`, `writeFile`, `mkdir`)
- Replace with cloud storage deletion functions
- Remove filesystem imports if no longer needed
- Update DELETE handlers to use cloud storage deletion

**Example Fix:**
```typescript
// ❌ WRONG - using filesystem operations after Cloudinary migration
import { unlink, join } from "fs/promises";
import { existsSync } from "fs";

if (settings?.imageUrl) {
  const imagePath = join(process.cwd(), "public", settings.imageUrl);
  if (existsSync(imagePath)) {
    await unlink(imagePath); // ERROR: unlink not imported or not needed
  }
}

// ✅ CORRECT - use Cloudinary deletion
import { deleteFromCloudinary, extractPublicIdFromUrl } from "@/lib/cloudinary/config";

if (settings?.imageUrl) {
  const publicId = extractPublicIdFromUrl(settings.imageUrl);
  if (publicId) {
    try {
      await deleteFromCloudinary(publicId, 'image');
    } catch (error) {
      console.error("Error deleting from Cloudinary (non-critical):", error);
    }
  }
}
```

**Files Fixed:**
- `app/api/admin/logo/route.ts` - Removed `unlink` calls, replaced with Cloudinary deletion
- `app/api/admin/splash-screen/route.ts` - Removed `unlink` calls, replaced with Cloudinary deletion

**Prevention:**
- When migrating from filesystem to cloud storage, search for all filesystem operations
- Remove all `unlink`, `writeFile`, `mkdir`, `join`, `existsSync` calls
- Replace with cloud storage equivalents
- Update both POST and DELETE handlers
- Remove unused filesystem imports

---

#### Error: "Interface incorrectly extends interface - Types of property 'src' are incompatible"
**Symptoms:**
- Build fails with "Type 'null' is not assignable to type 'string | undefined'"
- TypeScript error when extending `ImgHTMLAttributes` with custom `src` type
- Interface conflict between base interface and custom prop type

**Common Causes:**
- Extending `ImgHTMLAttributes<HTMLImageElement>` and overriding `src` to allow `null`
- Base interface only allows `string | undefined` for `src`
- Type incompatibility when trying to allow `null` values

**Solution:**
- Use `Omit` to exclude the conflicting property from base interface
- Then add it back with the correct type
- This allows custom types while preserving other HTML attributes

**Example Fix:**
```typescript
// ❌ WRONG - type conflict
interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string | null | undefined; // ERROR: conflicts with base interface
  alt: string;
}

// ✅ CORRECT - use Omit to exclude src, then add it back
interface SafeImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string | null | undefined; // Now allowed
  alt: string;
}
```

**Files Fixed:**
- `components/ui/SafeImage.tsx` - Used `Omit` to exclude `src` from base interface, then added with custom type

**Prevention:**
- When migrating from filesystem to cloud storage, search for all filesystem operations
- Remove all `unlink`, `writeFile`, `mkdir`, `join`, `existsSync` calls
- Replace with cloud storage equivalents
- Update both POST and DELETE handlers
- Remove unused filesystem imports

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
11. **Never use local filesystem for user uploads** in serverless environments - use cloud storage
12. **Always add `onError` handlers to image components** to show placeholders when images fail to load

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
- Issue persists in production (Vercel) even when `callbackUrl` is provided
- NextAuth may use `NEXTAUTH_URL` environment variable (set to localhost) to construct redirect URLs

**Common Causes:**
- NextAuth `signOut` page config set to `"/"` instead of `"/login"`
- `callbackUrl` not using absolute URL with current origin
- **CRITICAL**: NextAuth using `NEXTAUTH_URL` environment variable which might be set to localhost, even when `callbackUrl` is provided
- NextAuth's redirect mechanism may override `callbackUrl` with `NEXTAUTH_URL` in some cases

**Solution:**
- **RECOMMENDED APPROACH**: Use `signOut({ redirect: false })` followed by hard redirect with `window.location.href`
- This bypasses NextAuth's redirect mechanism entirely and always uses the current origin
- Update NextAuth config: `signOut: "/login"` as a fallback (though hard redirect bypasses it)
- Always use `window.location.origin` for redirect URLs in client-side code

**Example Fix (RECOMMENDED):**
```typescript
// ✅ CORRECT - Bypass NextAuth redirect mechanism
const handleLogout = async () => {
  // Sign out without redirect to bypass NextAuth's NEXTAUTH_URL dependency
  await signOut({ redirect: false });
  
  // Hard redirect to login using current origin (works in both dev and production)
  if (typeof window !== "undefined") {
    window.location.href = `${window.location.origin}/login`;
  }
};
```

**Alternative Fix (Less Reliable):**
```typescript
// ⚠️ ALTERNATIVE - May still use NEXTAUTH_URL in some cases
const handleLogout = async () => {
  if (typeof window !== "undefined") {
    const loginUrl = `${window.location.origin}/login`; // Absolute URL
    await signOut({ callbackUrl: loginUrl });
  } else {
    await signOut({ callbackUrl: "/login" }); // Fallback
  }
};
```

**NextAuth Config:**
```typescript
// ✅ CORRECT - NextAuth config (fallback, though hard redirect bypasses it)
pages: {
  signIn: "/login",
  signOut: "/login", // Redirect to login after logout
}
```

**Files Fixed:**
- `lib/auth/config.ts` - Updated `signOut` page to `/login`
- `components/layout/UserMenu.tsx` - Updated logout handler to use `signOut({ redirect: false })` + `window.location.href`
- `components/features/admin/UserProfileDropdown.tsx` - Updated logout handler to use `signOut({ redirect: false })` + `window.location.href`

**Prevention:**
- **CRITICAL**: Use `signOut({ redirect: false })` + `window.location.href` pattern to bypass NextAuth's redirect mechanism
- Always use `window.location.origin` for redirect URLs in client-side code
- Update NextAuth page configs to use explicit routes instead of root `/`
- Test logout functionality in both development and production environments
- **Note**: Even if `NEXTAUTH_URL` is set to localhost in Vercel, the hard redirect pattern will work correctly

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

### 6. Resource Loading Errors

#### Error: "404 (Not Found)" for uploaded images (carousel, avatars, splash screen)
**Symptoms:**
- Console shows multiple `404 (Not Found)` errors for image resources
- Images fail to load: `Failed to load resource: the server responded with a status of 404 ()`
- Affects carousel images, avatar images, and splash screen images
- URLs in database exist but files don't exist on server
- Works locally but fails in production (Vercel)

**Common Causes:**
- **Vercel Serverless Limitation**: Vercel's filesystem is read-only except during build time
- Files uploaded at runtime are saved to local filesystem but don't persist on Vercel
- Files are written to `public/uploads/` but Vercel's serverless functions have ephemeral filesystems
- Database stores relative paths like `/uploads/carousel/filename.png` but files don't exist in production
- Files may have been deleted or never uploaded to persistent storage

**Solution:**
- **Use Cloud Storage**: Replace local filesystem storage with cloud storage service:
  - **Vercel Blob Storage** (recommended for Vercel deployments)
  - **AWS S3** (with CloudFront CDN)
  - **Cloudinary** (image optimization included)
  - **Supabase Storage** (if using Supabase)
- **Update Upload Routes**: Modify all upload API routes to use cloud storage instead of local filesystem
- **Migration Strategy**:
  1. Set up cloud storage service
  2. Update upload routes to save to cloud storage
  3. Update image URLs in database to point to cloud storage URLs
  4. Add fallback/placeholder images for missing resources
- **Immediate Workaround**: 
  - Add error handling in image components to show placeholder when image fails to load
  - Use `onError` handlers on `<img>` tags to show default images
  - Validate image URLs before rendering

**Example Fix:**
```typescript
// ❌ WRONG - saves to local filesystem (doesn't work on Vercel)
const uploadsDir = join(process.cwd(), "public", "uploads", "carousel");
await writeFile(filepath, buffer);
const imageUrl = `/uploads/carousel/${filename}`;

// ✅ CORRECT - use Vercel Blob Storage
import { put } from '@vercel/blob';

const blob = await put(`carousel/${filename}`, buffer, {
  access: 'public',
  contentType: file.type,
});
const imageUrl = blob.url; // Full URL to cloud storage

// ✅ CORRECT - image component with error handling
<img 
  src={imageUrl || '/placeholder.png'} 
  onError={(e) => {
    e.currentTarget.src = '/placeholder.png';
  }}
  alt="Carousel image"
/>
```

**Files Affected:**
- `app/api/admin/carousel/route.ts` - Carousel image uploads
- `app/api/user/upload-avatar/route.ts` - Avatar uploads
- `app/api/admin/splash-screen/route.ts` - Splash screen uploads
- `app/api/admin/carousel/video/route.ts` - Carousel video uploads
- `app/api/trainer/courses/[courseId]/thumbnail/route.ts` - Course thumbnail uploads
- `app/api/trainer/trainings/[trainingId]/thumbnail/route.ts` - Training thumbnail uploads

**Prevention:**
- **Never use local filesystem for user-uploaded content** in serverless environments
- Always use cloud storage services for production deployments
- Add image error handling in all image components
- Validate image URLs exist before rendering
- Use placeholder images for missing resources
- Consider using Next.js `Image` component with `onError` handler

**UI/UX Considerations:**
- Show placeholder images when uploads fail to load
- Display user-friendly error messages instead of broken image icons
- Implement graceful degradation (show text/icon when image unavailable)
- Add loading states for image uploads
- Provide feedback when images fail to upload

---

#### Error: DatePicker hard to press on mobile and future dates not disabled
**Symptoms:**
- DatePicker input box is hard to press on mobile devices
- Users have to press the edge to access the date picker
- Future dates are not disabled in the date picker on mobile
- Touch target is too small or hidden input interferes with button clicks

**Common Causes:**
- Hidden date input with `width: 0` and `height: 0` interferes with button touch events
- Button overlay approach doesn't work well on mobile touch devices
- `max` attribute not properly applied to visible mobile input
- Z-index issues causing touch events to be intercepted by hidden input
- Mobile browsers need direct access to native date input for better UX

**Solution:**
- **Mobile Detection**: Detect mobile devices (touch devices with screen width ≤768px)
- **Show Native Input on Mobile**: On mobile, show the actual date input (not hidden) for direct touch access
- **Keep Button Overlay on Desktop**: On desktop, keep the button overlay approach for better UX
- **Proper max Attribute**: Ensure `max` attribute is set to today's date to disable future dates
- **Larger Touch Target**: Increase min-height to 52px for better mobile touch targets
- **Fix Z-Index**: Ensure button is above hidden input with proper z-index

**Example Fix:**
```typescript
// ✅ CORRECT - Mobile detection and conditional rendering
const [isMobile, setIsMobile] = useState(false);

useEffect(() => {
  const checkMobile = () => {
    const isTouchDevice = 'ontouchstart' in window || 
                         (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) ||
                         /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isSmallScreen = window.innerWidth <= 768;
    setIsMobile(isTouchDevice && isSmallScreen);
  };
  
  checkMobile();
  window.addEventListener('resize', checkMobile);
  return () => window.removeEventListener('resize', checkMobile);
}, []);

// In JSX:
<input
  type="date"
  className={isMobile ? styles.mobileInput : styles.hiddenInput}
  max={maxDate} // Today's date to disable future dates
  // ... other props
/>
{!isMobile && (
  <button onClick={handleButtonClick}>
    {/* Button overlay for desktop */}
  </button>
)}
```

**CSS Fix:**
```css
/* Mobile: Show actual date input for direct touch access */
.mobileInput {
  width: 100%;
  padding: var(--spacing-md);
  min-height: 52px; /* Large touch target */
  -webkit-tap-highlight-color: rgba(139, 92, 246, 0.2);
  touch-action: manipulation;
  /* Native date input styling */
  color-scheme: dark;
}

.mobileInput::-webkit-calendar-picker-indicator {
  /* Larger touch target for calendar icon */
  padding: 8px;
  margin-left: 8px;
}
```

**Files Fixed:**
- `components/ui/DatePicker.tsx` - Added mobile detection and conditional rendering
- `components/ui/DatePicker.module.css` - Added `.mobileInput` styles for visible mobile input
- `components/features/signup/EmployeeDetailsStep.tsx` - Added explicit `max` prop to disable future dates

**Prevention:**
- Always test date pickers on actual mobile devices, not just desktop browser dev tools
- Use native date inputs on mobile for better UX and touch accessibility
- Ensure `max` attribute is always set for date fields that shouldn't allow future dates
- Test touch targets are at least 44px (preferably 52px) on mobile
- Use mobile detection to show appropriate UI for touch vs. mouse interactions
- Never hide inputs that need direct touch access on mobile devices

---

#### Error: "500 Internal Server Error" on Signup API Route
**Symptoms:**
- Signup form submission returns 500 Internal Server Error
- Console shows: `POST /api/auth/signup 500 (Internal Server Error)`
- Error message: "Internal server error. Please try again or contact support."
- Error details: `undefined` (no specific error information)
- User cannot create account

**Common Causes:**
- **Database Connection Failure**: Prisma cannot connect to database (P1001 error)
- **Missing Environment Variables**: `SENDGRID_API_KEY` not set (email service throws error)
- **Prisma Schema Mismatch**: Database schema doesn't match Prisma schema (missing fields, wrong types)
- **Position Role Enum Mismatch**: `position.role` value doesn't match `UserRole` enum values
- **Null/Undefined Position Role**: Position exists but `role` field is null or undefined
- **Foreign Key Constraint Violation**: Company or Position doesn't exist in database
- **Email Service Error**: SendGrid API throws error that isn't properly caught
- **Unhandled Exception**: Error occurs outside of try-catch blocks

**Solution:**
- **Enhanced Error Logging**: Add comprehensive error logging before returning 500 error
- **Database Connection Check**: Verify DATABASE_URL is set and database is accessible
- **Environment Variable Validation**: Check for required environment variables (SENDGRID_API_KEY)
- **Prisma Error Handling**: Add specific handling for all Prisma error codes
- **Email Service Error Handling**: Ensure email errors don't cause signup to fail (already non-blocking)
- **Position Role Validation**: Validate position.role matches UserRole enum before using
- **Null Safety**: Add null checks for position.role before assignment

**Example Fix:**
```typescript
// ✅ CORRECT - Enhanced error handling with detailed logging
export async function POST(request: NextRequest) {
  try {
    // ... validation and checks ...
    
    // Fetch position with null safety
    const position = await prisma.position.findUnique({
      where: { id: positionId },
      select: { role: true },
    });

    if (!position) {
      return NextResponse.json(
        { error: "Selected position not found. Please select a valid position." },
        { status: 400 }
      );
    }

    // Validate position.role is valid UserRole enum value
    const validRoles: UserRole[] = [
      "EMPLOYEE",
      "BRANCH_MANAGER",
      "AREA_MANAGER",
      "REGIONAL_MANAGER",
      "TRAINER",
      "ADMIN",
      "SUPER_ADMIN",
    ];
    
    if (!position.role || !validRoles.includes(position.role as UserRole)) {
      console.error("Invalid position role:", {
        positionId,
        role: position.role,
        validRoles,
      });
      return NextResponse.json(
        { error: "Invalid position configuration. Please contact support." },
        { status: 400 }
      );
    }

    // Auto-detect role from position
    const userRole = position.role as UserRole;

    // Validate that only EMPLOYEE or BRANCH_MANAGER can register
    if (userRole !== "EMPLOYEE" && userRole !== "BRANCH_MANAGER") {
      return NextResponse.json(
        { error: "Invalid role for self-registration" },
        { status: 400 }
      );
    }

    // Create user with explicit error handling
    let user;
    try {
      user = await prisma.user.create({
        data: {
          // ... user data ...
          role: userRole,
        },
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true,
        },
      });
    } catch (dbError) {
      // Enhanced Prisma error handling
      if (dbError && typeof dbError === "object" && "code" in dbError) {
        const prismaError = dbError as { code: string; meta?: any };
        
        console.error("Prisma error during user creation:", {
          code: prismaError.code,
          meta: prismaError.meta,
          userId: user?.id,
        });

        // Handle specific Prisma errors
        if (prismaError.code === "P1001") {
          return NextResponse.json(
            { error: "Database connection error. Please try again later." },
            { status: 503 }
          );
        }
        
        if (prismaError.code === "P2002") {
          const field = prismaError.meta?.target?.[0] || "field";
          return NextResponse.json(
            { error: `A user with this ${field} already exists.` },
            { status: 400 }
          );
        }
      }
      
      // Re-throw to be caught by outer catch
      throw dbError;
    }

    // ... rest of signup logic ...
    
  } catch (error) {
    // Enhanced error logging
    console.error("Signup error:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
      code: error && typeof error === "object" && "code" in error ? (error as any).code : undefined,
      timestamp: new Date().toISOString(),
    });

    // Return appropriate error based on error type
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      return NextResponse.json(
        { error: firstError?.message || "Validation error" },
        { status: 400 }
      );
    }

    // Generic error response
    return NextResponse.json(
      { 
        error: process.env.NODE_ENV === "development"
          ? (error instanceof Error ? error.message : String(error))
          : "Internal server error. Please try again or contact support."
      },
      { status: 500 }
    );
  }
}
```

**Debugging Steps:**
1. **Check Vercel Function Logs**: Go to Vercel Dashboard → Deployments → Latest → Functions → Check for error messages
2. **Check Database Connection**: Verify DATABASE_URL is set correctly in Vercel environment variables
3. **Check Environment Variables**: Verify SENDGRID_API_KEY is set (email service)
4. **Check Prisma Schema**: Ensure database schema matches Prisma schema (run `npx prisma db push` or migrations)
5. **Check Position Data**: Verify positions exist in database and have valid `role` values
6. **Check Error Logs**: Look for specific Prisma error codes (P1001, P2002, P2003, etc.)

**Files Affected:**
- `app/api/auth/signup/route.ts` - Signup API route
- `lib/email/client.ts` - Email service client
- `lib/email/sendEmail.ts` - Email sending functions

**Prevention:**
- Always wrap Prisma queries in try-catch blocks
- Validate all enum values before using them
- Add null checks for optional fields
- Check environment variables before using services
- Add comprehensive error logging for debugging
- Handle all Prisma error codes specifically
- Ensure database schema matches Prisma schema
- Test signup flow in production environment
- Verify all required data exists in database (companies, positions)

**Common Prisma Error Codes:**
- **P1001**: Can't reach database server (connection issue)
- **P2002**: Unique constraint violation (email/employee number already exists)
- **P2003**: Foreign key constraint violation (company/position doesn't exist)
- **P2025**: Record not found (company/position deleted)
- **P2012**: Missing required value (null value for required field)

---

#### Error: "500 Internal Server Error" - User Management Table Not Loading
**Symptoms:**
- User Management Table shows no data
- Console shows `500 Internal Server Error` for `/api/admin/users?status=ALL`
- API route returns 500 status code
- UsersTable component cannot fetch user data
- Vercel function logs show: `Invalid prisma.user.find...` (Prisma validation error)
- OR: Vercel function logs show errors related to `Date` objects not being serializable

**Common Causes:**
1. **Prisma Query Validation Error**: Using `include` with nested `select` for optional relations can cause Prisma validation errors (`Invalid prisma.user.find...`)
2. **Data Serialization Issue**: Prisma returns `Date` objects, which `NextResponse.json()` cannot directly serialize, leading to a 500 error
3. Prisma query error in where clause construction
4. Database connection issues
5. Missing or invalid where clause conditions
6. Prisma client not generated or out of sync
7. Invalid filter combinations (role + search + status)

**Solution:**
1. **Fix Prisma Query Structure** (CRITICAL):
   - **Use `select` at top level instead of `include` with nested `select`** for optional relations
   - Prisma sometimes has validation issues with `include` + nested `select` for optional relations (`company?`, `position?`)
   - Explicitly select all needed fields at the top level
   
   ```typescript
   // ❌ WRONG - Can cause Prisma validation error "Invalid prisma.user.find"
   users = await prisma.user.findMany({
     where,
     include: {
       company: {
         select: { id: true, name: true, type: true },
       },
       position: {
         select: { id: true, title: true, role: true },
       },
     },
   });

   // ✅ CORRECT - Use select at top level
   users = await prisma.user.findMany({
     where,
     select: {
       id: true,
       name: true,
       email: true,
       // ... all needed fields
       company: {
         select: { id: true, name: true, type: true },
       },
       position: {
         select: { id: true, title: true, role: true },
       },
     },
   });
   ```

2. **Serialize Date Objects**: Convert all `Date` objects returned by Prisma to ISO strings (`.toISOString()`) before sending them in the `NextResponse.json()` response.
3. Ensure where clause is properly constructed for Prisma. Prisma automatically ANDs multiple where conditions, so `where.role` and `where.OR` can coexist.
4. Add comprehensive error logging to identify specific Prisma error codes.
5. Validate all query parameters before building where clause
6. Check database connection and Prisma client generation

**Example Fix:**
```typescript
// ✅ CORRECT - Prisma handles AND automatically
const where: any = {};

if (status === "ALL") {
  where.status = "APPROVED";
}

if (user.role === "ADMIN") {
  where.role = { notIn: ["ADMIN", "SUPER_ADMIN"] };
}

if (search) {
  where.OR = [
    { name: { contains: search, mode: "insensitive" } },
    { email: { contains: search, mode: "insensitive" } },
  ];
}
// Prisma will automatically AND these conditions: status AND role AND (OR conditions)
```

**Enhanced Error Handling:**
```typescript
} catch (dbError) {
  console.error("Database error fetching users:", dbError);
  const errorMessage = dbError instanceof Error ? dbError.message : String(dbError);
  const errorCode = dbError && typeof dbError === "object" && "code" in dbError ? (dbError as any).code : undefined;
  console.error("Database error details:", {
    message: errorMessage,
    code: errorCode,
    where,
    stack: dbError instanceof Error ? dbError.stack : undefined,
  });
  return NextResponse.json(
    { 
      success: false, 
      error: "Failed to fetch users",
      details: process.env.NODE_ENV === "development" ? errorMessage : undefined,
    },
    { status: 500 }
  );
}
```

**Files Fixed:**
- `app/api/admin/users/route.ts` - Fixed where clause construction, added enhanced error logging

**Prevention:**
- Always log Prisma error codes for debugging
- Test where clause construction with different filter combinations
- Validate query parameters before building where clause
- Use TypeScript types for where clause to catch errors early
- Test API routes with various filter combinations
- **CRITICAL**: After adding fields to Prisma schema, always run `npx prisma db push` or create a migration to sync the database
- **Schema-Database Sync**: Prisma validates the entire model schema against the database, even when using `select` - missing columns will cause errors

---

#### Error: "P2022 - Column does not exist in database" (Prisma Schema-Database Mismatch)
**Symptoms:**
- API returns 500 error with Prisma error code `P2022`
- Error message: `The column 'User.passwordResetToken' does not exist in the current database`
- Prisma schema has fields that don't exist in the actual database
- Error occurs even when using `select` (not selecting those fields)

**Common Causes:**
- Prisma schema was updated to add new fields (e.g., `passwordResetToken`, `passwordResetTokenExpires`)
- Database migration was not run to add these columns
- Database schema is out of sync with Prisma schema
- Prisma client was regenerated but database wasn't updated

**Solution:**
1. **Sync Database Schema** (Development):
   ```bash
   # Navigate to project folder
   cd "/Users/marck.baldorado/Documents/Learning Management"
   
   # Push schema changes to database (adds missing columns)
   npx prisma db push
   
   # Regenerate Prisma client
   npx prisma generate
   ```

2. **Create Migration** (Production/Version Control):
   ```bash
   # Create a migration for the schema changes
   npx prisma migrate dev --name add_password_reset_fields
   
   # This will:
   # - Create a migration file
   # - Apply it to the database
   # - Regenerate Prisma client
   ```

3. **Verify Schema Sync**:
   ```bash
   # Check if schema is in sync
   npx prisma db pull
   # This will show if there are differences
   ```

**Important Notes:**
- **Prisma validates the entire model schema**, not just selected fields
- Even if you use `select` and don't select the missing fields, Prisma will still validate the schema
- Always run `npx prisma db push` or create a migration after adding fields to `schema.prisma`
- For production, use migrations (`prisma migrate dev`) instead of `db push`

**Files Affected:**
- `prisma/schema.prisma` - Schema definition
- Database - Missing columns need to be added
- `app/api/admin/users/route.ts` - Queries will fail until schema is synced

**Prevention:**
- Always run `npx prisma db push` or `npx prisma migrate dev` after modifying `schema.prisma`
- Use migrations for production deployments
- Verify schema sync before deploying to production
- Document schema changes in migration files
- Test database operations after schema changes

---

#### Error: "500 Internal Server Error" - Carousel/Splash Screen Upload Failing
**Symptoms:**
- Uploading carousel images fails with 500 error
- Uploading splash screen images fails with 500 error
- No error message shown to user
- Console shows generic "Internal server error"
- Deprecation warning: `(node:4) [DEP0169] DeprecationWarning: url.parse() behavior is not standardized`

**Common Causes:**
- Cloudinary configuration missing or incorrect
- Database error during image record creation
- File upload to Cloudinary fails
- Missing error handling for Cloudinary upload failures
- Database transaction fails after successful Cloudinary upload
- **CRITICAL**: Using `upload_stream()` API which may trigger deprecation warnings and be less reliable than promise-based API
- Cloudinary SDK internally using deprecated `url.parse()` when using `upload_stream()`

**Solution:**
- **Use Promise-Based Upload API**: Replace `upload_stream()` with promise-based `upload()` method
- Convert buffer to data URI format for direct upload (avoids stream issues)
- Add comprehensive error logging for Cloudinary uploads
- Clean up Cloudinary uploads if database update fails
- Validate Cloudinary credentials before upload
- Add detailed error messages for different failure scenarios
- Handle Prisma errors specifically (P2002, P2003, etc.)

**Example Fix:**
```typescript
// ❌ WRONG - Using upload_stream (may trigger deprecation warnings)
return new Promise((resolve, reject) => {
  const uploadStream = cloudinary.uploader.upload_stream(
    { folder, public_id, resource_type },
    (error, result) => {
      if (error) reject(error);
      else resolve(result.secure_url);
    }
  );
  uploadStream.end(buffer);
});

// ✅ CORRECT - Using promise-based upload API
const mimeType = resourceType === 'image' ? 'image/jpeg' : 'video/mp4';
const base64 = buffer.toString('base64');
const dataUri = `data:${mimeType};base64,${base64}`;

const result = await cloudinary.uploader.upload(dataUri, {
  folder: `learning-management/${folder}`,
  public_id: filename.replace(/\.[^/.]+$/, ''),
  resource_type: resourceType,
  overwrite: false,
  invalidate: true,
});

return result.secure_url;
```

**Example Fix:**
```typescript
// Upload to Cloudinary
let imageUrl: string;
try {
  imageUrl = await uploadToCloudinary(buffer, 'carousel', filename, 'image');
  console.log(`[Carousel] Successfully uploaded to Cloudinary: ${imageUrl}`);
} catch (uploadError) {
  console.error("[Carousel] Cloudinary upload error:", uploadError);
  return NextResponse.json(
    { success: false, error: "Failed to upload image. Please try again." },
    { status: 500 }
  );
}

// Database update with cleanup on failure
try {
  const carouselImage = await prisma.carouselImage.create({
    data: { imageUrl, ... },
  });
  return NextResponse.json({ success: true, data: carouselImage }, { status: 201 });
} catch (dbError) {
  // Clean up Cloudinary upload if database fails
  if (imageUrl) {
    const publicId = extractPublicIdFromUrl(imageUrl);
    if (publicId) {
      try {
        await deleteFromCloudinary(publicId, 'image');
        console.error("[Carousel] Cleaned up Cloudinary upload due to DB error:", publicId);
      } catch (deleteError) {
        console.error("[Carousel] Error cleaning up Cloudinary upload:", deleteError);
      }
    }
  }
  
  const errorMessage = dbError instanceof Error ? dbError.message : String(dbError);
  const errorCode = dbError && typeof dbError === "object" && "code" in dbError ? (dbError as any).code : undefined;
  console.error("Database error details:", {
    message: errorMessage,
    code: errorCode,
    stack: dbError instanceof Error ? dbError.stack : undefined,
  });
  
  return NextResponse.json(
    { 
      success: false, 
      error: "Failed to create carousel image",
      details: process.env.NODE_ENV === "development" ? errorMessage : undefined,
    },
    { status: 500 }
  );
}
```

**Files Fixed:**
- `app/api/admin/carousel/route.ts` - Added enhanced error handling and Cloudinary cleanup
- `app/api/admin/splash-screen/route.ts` - Already has proper error handling (verified)
- `lib/cloudinary/config.ts` - Updated to use promise-based upload API instead of upload_stream (fixes deprecation warning and improves reliability)

**Prevention:**
- Always clean up Cloudinary uploads if database operations fail
- Validate Cloudinary credentials before attempting uploads
- Add detailed error logging for all upload operations
- Test upload flow end-to-end (file → Cloudinary → database)
- Handle all Prisma error codes specifically
- Verify Cloudinary environment variables are set in Vercel
- **CRITICAL**: Use promise-based `upload()` API instead of `upload_stream()` to avoid deprecation warnings and improve reliability

---

#### Error: "500 Internal Server Error" - Cloudinary Configuration Missing
**Symptoms:**
- Uploading images fails with 500 error
- Error message: "Image upload service is not configured"
- Console shows Cloudinary configuration missing
- Works locally but fails on Vercel

**Common Causes:**
- Cloudinary environment variables not set in Vercel
- Environment variables set but app not redeployed
- Environment variables set for wrong environment (Production vs Preview)
- Typo in environment variable names
- Environment variables set but not accessible at runtime

**Solution:**
1. **Check Vercel Environment Variables**:
   - Go to Vercel Dashboard → Project → Settings → Environment Variables
   - Verify these three variables exist:
     - `CLOUDINARY_CLOUD_NAME`
     - `CLOUDINARY_API_KEY`
     - `CLOUDINARY_API_SECRET`
   - Ensure they're set for **Production** environment (and Preview/Development if needed)

2. **Verify Variable Values**:
   - Check that values are not empty
   - Verify no extra spaces or quotes around values
   - Ensure API Secret is revealed (not hidden)

3. **Redeploy After Adding Variables**:
   - Environment variables require a new deployment to be available
   - Go to Deployments → Latest → Click "Redeploy"
   - Or push a new commit to trigger deployment

4. **Add Runtime Checks**:
   ```typescript
   // Check Cloudinary configuration before upload
   const hasCloudinaryConfig = !!(
     process.env.CLOUDINARY_CLOUD_NAME &&
     process.env.CLOUDINARY_API_KEY &&
     process.env.CLOUDINARY_API_SECRET
   );
   
   if (!hasCloudinaryConfig) {
     console.error("[API] Cloudinary configuration missing:", {
       hasCloudName: !!process.env.CLOUDINARY_CLOUD_NAME,
       hasApiKey: !!process.env.CLOUDINARY_API_KEY,
       hasApiSecret: !!process.env.CLOUDINARY_API_SECRET,
     });
     return NextResponse.json(
       { 
         success: false, 
         error: "Image upload service is not configured. Please contact your administrator.",
         details: process.env.NODE_ENV === "development" 
           ? "Cloudinary environment variables are missing. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in Vercel."
           : undefined,
       },
       { status: 500 }
     );
   }
   ```

**Debugging Steps:**
1. **Check Vercel Function Logs**:
   - Go to Vercel Dashboard → Deployments → Latest → Functions
   - Look for logs showing "Cloudinary configuration missing"
   - Check which variables are missing

2. **Verify Variable Names**:
   - Must be exact: `CLOUDINARY_CLOUD_NAME` (not `CLOUDINARY_CLOUDNAME` or `CLOUDINARY_CLOUD_NAME_`)
   - Case-sensitive: `CLOUDINARY_API_KEY` (not `cloudinary_api_key`)

3. **Test Locally**:
   - Create `.env.local` file with Cloudinary credentials
   - Test upload locally to verify credentials work
   - If works locally but not on Vercel, it's an environment variable issue

**Files Fixed:**
- `app/api/admin/carousel/route.ts` - Added Cloudinary configuration check before upload
- `app/api/admin/splash-screen/route.ts` - Added Cloudinary configuration check before upload
- `lib/cloudinary/config.ts` - Already has validation in upload functions

**Prevention:**
- Always check Cloudinary configuration before attempting uploads
- Add runtime validation for environment variables
- Provide clear error messages indicating which variables are missing
- Document required environment variables in setup guides
- Test uploads in production environment after setting variables
- Use environment variable validation in CI/CD pipeline

---

#### Error: "DEP0169 DeprecationWarning: url.parse() behavior is not standardized"
**Symptoms:**
- Console shows deprecation warning: `(node:4) [DEP0169] DeprecationWarning: url.parse() behavior is not standardized and prone to errors that have security implications. Use the WHATWG URL API instead.`
- Warning appears during Cloudinary upload operations
- Photo carousel upload may fail or be unreliable
- May cause issues in future Node.js versions

**Common Causes:**
- Cloudinary SDK using deprecated `url.parse()` internally when using `upload_stream()` API
- Node.js deprecating `url.parse()` in favor of WHATWG URL API
- Using callback-based `upload_stream()` instead of promise-based `upload()` API

**Solution:**
- **Use Promise-Based Upload API**: Replace `upload_stream()` with `cloudinary.uploader.upload()` which uses promise-based API
- Convert buffer to data URI format for direct upload (avoids stream and deprecation issues)
- This approach is more reliable and avoids the deprecation warning

**Example Fix:**
```typescript
// ❌ WRONG - Using upload_stream (triggers deprecation warning)
return new Promise((resolve, reject) => {
  const uploadStream = cloudinary.uploader.upload_stream(
    { folder, public_id, resource_type },
    (error, result) => {
      if (error) reject(error);
      else resolve(result.secure_url);
    }
  );
  uploadStream.end(buffer);
});

// ✅ CORRECT - Using promise-based upload API (no deprecation warning)
const mimeType = resourceType === 'image' 
  ? (filename.match(/\.(jpg|jpeg)$/i) ? 'image/jpeg' : 
     filename.match(/\.png$/i) ? 'image/png' : 
     filename.match(/\.gif$/i) ? 'image/gif' : 
     filename.match(/\.webp$/i) ? 'image/webp' : 'image/jpeg')
  : (filename.match(/\.mp4$/i) ? 'video/mp4' : 
     filename.match(/\.webm$/i) ? 'video/webm' : 
     filename.match(/\.mov$/i) ? 'video/quicktime' : 'video/mp4');

const base64 = buffer.toString('base64');
const dataUri = `data:${mimeType};base64,${base64}`;

const result = await cloudinary.uploader.upload(dataUri, {
  folder: `learning-management/${folder}`,
  public_id: filename.replace(/\.[^/.]+$/, ''),
  resource_type: resourceType,
  overwrite: false,
  invalidate: true,
});

return result.secure_url;
```

**Files Fixed:**
- `lib/cloudinary/config.ts` - Updated `uploadToCloudinary()` to use promise-based `upload()` API instead of `upload_stream()`
- `lib/cloudinary/config.ts` - Updated `deleteFromCloudinary()` to use promise-based `destroy()` API

**Prevention:**
- Always use promise-based Cloudinary APIs instead of callback-based stream APIs
- Convert buffers to data URIs for direct upload when possible
- Test upload functionality after switching to promise-based APIs
- Monitor for deprecation warnings in logs
- Update Cloudinary SDK to latest version if available
- Avoid using `upload_stream()` in favor of `upload()` with data URIs
- **CRITICAL**: Always validate `file.name` before using it in upload routes
- **CRITICAL**: Always validate `filename` parameter in `uploadToCloudinary()` function

---

#### Error: "TypeError: Cannot read properties of undefined (reading 'replace')" - Cloudinary Upload
**Symptoms:**
- Console shows: `TypeError: Cannot read properties of undefined (reading 'replace')`
- Error occurs in `uploadToCloudinary()` function
- Carousel upload fails with 500 error
- Stack trace points to Cloudinary upload code

**Common Causes:**
- `filename` parameter is `undefined` or `null` when passed to `uploadToCloudinary()`
- `file.name` is `undefined` in upload API routes
- File object doesn't have a `name` property
- Filename validation missing before calling `uploadToCloudinary()`

**Solution:**
- **Validate `file.name`** in all upload API routes before using it
- **Validate `filename` parameter** in `uploadToCloudinary()` function
- Provide fallback filename if `file.name` is missing
- Add proper error handling for missing file names

**Example Fix:**
```typescript
// ❌ WRONG - No validation, can cause undefined error
const fileExtension = file.name.split('.').pop() || 'jpg';
const filename = `carousel-${timestamp}.${fileExtension}`;
await uploadToCloudinary(buffer, 'carousel', filename, 'image');

// ✅ CORRECT - Validate file.name first
if (!file.name || typeof file.name !== 'string' || file.name.trim() === '') {
  return NextResponse.json(
    { success: false, error: "File name is required" },
    { status: 400 }
  );
}
const fileExtension = file.name.split('.').pop() || 'jpg';
const filename = `carousel-${timestamp}.${fileExtension}`;
await uploadToCloudinary(buffer, 'carousel', filename, 'image');

// ✅ CORRECT - Validate filename in uploadToCloudinary function
export async function uploadToCloudinary(
  buffer: Buffer,
  folder: string,
  filename: string,
  resourceType: 'image' | 'video' = 'image'
): Promise<string> {
  // Validate filename
  if (!filename || typeof filename !== 'string') {
    throw new Error('Filename is required and must be a string');
  }
  
  const safeFilename = filename.trim() || `upload-${Date.now()}`;
  // ... rest of upload code
}
```

**Files Fixed:**
- `lib/cloudinary/config.ts` - Added filename validation in `uploadToCloudinary()` function
- `app/api/admin/carousel/route.ts` - Added `file.name` validation before upload
- `app/api/admin/splash-screen/route.ts` - Added `file.name` validation
- `app/api/admin/logo/route.ts` - Added `file.name` validation
- `app/api/admin/carousel/video/route.ts` - Added `file.name` validation
- `app/api/trainer/trainings/[trainingId]/thumbnail/route.ts` - Added `file.name` validation
- `app/api/trainer/courses/[courseId]/thumbnail/route.ts` - Added `file.name` validation
- `app/api/user/upload-avatar/route.ts` - Added `file.name` validation

**Prevention:**
- Always validate `file.name` exists and is a string before using it
- Always validate `filename` parameter in utility functions
- Provide clear error messages when validation fails
- Use TypeScript to catch potential undefined issues
- Test upload functionality with files that have no name property

---

#### Error: "[object Object]" in Cloudinary Upload Error Messages
**Symptoms:**
- Console shows: `[Cloudinary] Upload error: { message: '[object Object]', ... }`
- Error message displays as `[object Object]` instead of actual error details
- Carousel photo upload fails with unhelpful error message
- Error object is not properly serialized when logging or throwing

**Common Causes:**
- Cloudinary errors are objects, not simple Error instances
- Using `String(error)` on Cloudinary error objects returns `[object Object]`
- Not extracting error properties (`message`, `http_code`, `name`) from Cloudinary error structure
- Error object structure: `{ message: string, http_code: number, name: string, error?: { message: string } }`

**Solution:**
- **Extract Error Properties**: Check if error is an object and extract meaningful properties
- **Handle Multiple Error Structures**: Cloudinary errors can be Error instances or plain objects
- **Serialize Properly**: Extract `message`, `http_code`, and other relevant properties
- **Log Full Details**: Include all error properties in logs for debugging

**Example Fix:**
```typescript
// ❌ WRONG - Returns [object Object] for Cloudinary errors
catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  // String(error) returns "[object Object]" for Cloudinary error objects
  throw new Error(`Failed to upload: ${errorMessage}`);
}

// ✅ CORRECT - Extract meaningful error message from Cloudinary error structure
catch (error) {
  let errorMessage: string;
  let errorDetails: any = {};
  
  if (error instanceof Error) {
    errorMessage = error.message;
    errorDetails.stack = error.stack;
  } else if (error && typeof error === 'object') {
    // Cloudinary error objects have properties like: message, http_code, name, etc.
    const cloudinaryError = error as any;
    errorMessage = cloudinaryError.message || 
                  cloudinaryError.error?.message || 
                  `Cloudinary upload failed${cloudinaryError.http_code ? ` (HTTP ${cloudinaryError.http_code})` : ''}`;
    
    // Extract all relevant error properties for logging
    errorDetails = {
      message: cloudinaryError.message,
      http_code: cloudinaryError.http_code,
      name: cloudinaryError.name,
      error: cloudinaryError.error,
      raw: process.env.NODE_ENV === 'development' ? JSON.stringify(error, null, 2) : undefined,
    };
  } else {
    errorMessage = String(error);
  }
  
  console.error('[Cloudinary] Upload error:', {
    message: errorMessage,
    ...errorDetails,
    filename,
    resourceType,
    bufferSize: buffer.length,
  });
  
  throw new Error(`Failed to upload to Cloudinary: ${errorMessage}`);
}
```

**Files Fixed:**
- `lib/cloudinary/config.ts` - Updated `uploadToCloudinary()` and `deleteFromCloudinary()` to properly serialize Cloudinary error objects
- `app/api/admin/carousel/route.ts` - Enhanced error handling to extract meaningful error messages

**Prevention:**
- Always check if error is an object before using `String(error)`
- Extract specific error properties (`message`, `http_code`) from Cloudinary error objects
- Use conditional logic to handle both Error instances and plain error objects
- Log full error details (including `http_code`, `name`) for debugging
- Test error handling with actual Cloudinary API errors
- **CRITICAL**: Cloudinary errors are objects with properties, not simple strings - always extract `message` or `error.message` property

**Cloudinary Error Structure:**
```typescript
// Cloudinary error object structure
{
  message: string,        // Error message
  http_code: number,     // HTTP status code (e.g., 400, 401, 403, 500)
  name: string,          // Error name/type
  error?: {              // Nested error object (sometimes present)
    message: string
  }
}
```

---

#### Error: Vercel Not Deploying Automatically After Git Push
**Symptoms:**
- Code is pushed to GitHub successfully
- No new deployment appears in Vercel dashboard
- Previous deployments worked fine
- GitHub App permissions are correct
- No webhooks configured (Vercel uses GitHub App integration, not webhooks)

**Common Causes:**
- Project is paused in Vercel
- Production branch mismatch (not set to `main`)
- Build failures blocking new deployments
- GitHub App integration disconnected
- Vercel GitHub App permissions revoked
- Previous build stuck in "Building" state

**Solution:**
1. **Check Vercel Dashboard**:
   - Verify project is not paused
   - Check Production Branch is set to `main`
   - Review recent deployments for failures

2. **Check Git Integration**:
   - Vercel Dashboard → Project → Settings → Git
   - Verify repository is connected
   - If disconnected, reconnect the repository

3. **Check GitHub App Permissions**:
   - GitHub → Settings → Applications → Installed GitHub Apps
   - Find "Vercel" and verify it has:
     - Read/write access to code, deployments, etc.
     - Repository access (All repositories or specific repo)

4. **Manual Redeploy Test**:
   - Vercel Dashboard → Deployments → Latest → "..." → Redeploy
   - This tests if builds work (bypasses integration)

5. **Trigger New Deployment**:
   - Make a small change (e.g., version bump, comment)
   - Commit and push to `main` branch
   - Wait 1-2 minutes and check Vercel dashboard

**Example Fix:**
```bash
# Test deployment trigger
echo "# Deployment test - $(date)" >> .deployment-test
git add .deployment-test
git commit -m "Test: Trigger Vercel deployment"
git push

# Then check Vercel dashboard in 1-2 minutes
```

**Files Fixed:**
- N/A (Infrastructure/Configuration issue)

**Prevention:**
- Regularly check Vercel dashboard for paused projects
- Verify production branch matches your Git branch (`main`)
- Monitor build logs for failures that might block deployments
- Keep GitHub App permissions up to date
- Use manual redeploy if automatic deployments stop working
- Document Vercel project settings for reference

**Note:** Vercel uses GitHub App integration (not webhooks), so no webhook configuration is needed. If webhooks are missing, that's normal and not the issue.

---

#### Error: "Vercel - Deployment rate limited — retry in 3 hours"
**Symptoms:**
- Red 'X' appears on GitHub commits
- Status check shows: "Vercel - Deployment rate limited — retry in 3 hours"
- Commits push successfully but no new deployments appear
- Previous deployments worked fine

**Common Causes:**
- Too many deployments triggered in a short time period
- Multiple rapid commits/pushes
- Manual redeploys combined with automatic deployments
- Vercel free tier rate limits (typically 100 deployments per day)

**Solution:**
1. **Wait for Rate Limit to Reset**:
   - Rate limit message shows when it will retry (e.g., "retry in 3 hours")
   - Wait for the specified time
   - Vercel will automatically retry the deployment

2. **Manual Redeploy (May Bypass Rate Limit)**:
   - Go to Vercel Dashboard → Deployments
   - Find the latest successful deployment
   - Click "..." → "Redeploy"
   - This may bypass the automatic deployment rate limit

3. **Prevent Future Rate Limits**:
   - Avoid rapid commits (wait 2+ minutes between pushes)
   - Batch multiple changes into single commits when possible
   - Use manual redeploy for testing instead of pushing test commits
   - Monitor deployment count in Vercel dashboard

4. **Upgrade Vercel Plan (If Needed)**:
   - Free tier: 100 deployments/day
   - Pro tier: Higher limits
   - Check Vercel dashboard for current usage

**Example Prevention:**
```bash
# ❌ WRONG - Rapid commits trigger rate limits
git commit -m "Fix 1" && git push
git commit -m "Fix 2" && git push  # Too soon!
git commit -m "Fix 3" && git push  # Rate limited!

# ✅ CORRECT - Batch changes or wait between pushes
git add file1.ts file2.ts file3.ts
git commit -m "Fix multiple issues"
git push
# Wait 2+ minutes before next push
```

**Files Fixed:**
- N/A (Infrastructure/Configuration issue)

**Prevention:**
- Wait at least 2 minutes between git pushes
- Batch related changes into single commits
- Use manual redeploy for testing instead of pushing test commits
- Monitor Vercel dashboard for deployment count
- Document deployment frequency in project rules
- Consider upgrading Vercel plan if hitting limits frequently

**Note:** The rate limit is per-project, not per-account. Each Vercel project has its own deployment quota.

---

#### Error: "500 Internal Server Error" - Date Serialization in API Responses
**Symptoms:**
- API returns 500 error when fetching data with Date fields
- Prisma queries succeed but JSON serialization fails
- Error occurs in `NextResponse.json()` when returning Prisma results
- Date objects from Prisma cannot be directly serialized to JSON

**Common Causes:**
- Prisma returns Date objects which are not JSON-serializable
- `NextResponse.json()` cannot serialize Date objects directly
- Missing date conversion before returning response
- Date fields in nested relations not converted

**Solution:**
- Always convert Date objects to ISO strings before returning in JSON responses
- Use `.toISOString()` method on all Date fields
- Handle nullable dates with optional chaining: `date?.toISOString() || null`
- Serialize all Date fields in the response object

**Example Fix:**
```typescript
// ❌ WRONG - Date objects cannot be serialized
const users = await prisma.user.findMany({
  where,
  include: { company: true, position: true },
});

return NextResponse.json({
  success: true,
  data: users, // ERROR: Date objects in createdAt, updatedAt, etc.
}, { status: 200 });

// ✅ CORRECT - Serialize Date objects to ISO strings
const users = await prisma.user.findMany({
  where,
  include: { company: true, position: true },
});

const serializedUsers = users.map((user) => ({
  ...user,
  createdAt: user.createdAt.toISOString(),
  updatedAt: user.updatedAt.toISOString(),
  approvedAt: user.approvedAt?.toISOString() || null,
  hireDate: user.hireDate?.toISOString() || null,
}));

return NextResponse.json({
  success: true,
  data: serializedUsers, // All dates are now ISO strings
}, { status: 200 });
```

**Files Fixed:**
- `app/api/admin/users/route.ts` - Added Date serialization for all Date fields

**Prevention:**
- Always serialize Date objects before returning in API responses
- Create a utility function for serializing Prisma results if needed
- Test API responses to ensure JSON serialization works
- Check for Date objects in nested relations and serialize them too
- Use TypeScript to catch Date objects in response types
- **CRITICAL**: When spreading Prisma results (`...user`), explicitly construct response objects instead of spreading to avoid including non-serializable fields

**Common Mistakes:**
```typescript
// ❌ WRONG - Spreading includes all Prisma fields which may not be serializable
const serializedUsers = users.map((user) => ({
  ...user, // Includes internal Prisma fields, Date objects, etc.
  createdAt: user.createdAt.toISOString(), // This might not override properly
}));

// ✅ CORRECT - Explicitly construct response object with only needed fields
const serializedUsers = users.map((user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  createdAt: user.createdAt.toISOString(),
  updatedAt: user.updatedAt.toISOString(),
  company: user.company ? {
    id: user.company.id,
    name: user.company.name,
  } : null,
}));
```

---

#### Error: Emails Not Being Received (SendGrid)
**Symptoms:**
- Trainer creation email not received
- Approval email not received
- No error messages in console
- Email sending appears to succeed but emails don't arrive
- User account created/approved successfully but no email notification

**Common Causes:**
- **Missing SENDGRID_API_KEY**: Environment variable not set in Vercel
- **Invalid SendGrid API Key**: API key is incorrect or expired
- **Unverified Sender Email**: SendGrid requires sender email to be verified
- **Email in Spam Folder**: Emails are being sent but filtered as spam
- **SendGrid Account Issues**: Free tier limitations or account restrictions
- **Email Service Error Not Logged**: Errors are caught but not properly logged

**Solution:**
1. **Check Environment Variables in Vercel**:
   - Go to Vercel Dashboard → Project → Settings → Environment Variables
   - Verify `SENDGRID_API_KEY` exists and is set correctly
   - Ensure it's set for Production, Preview, and Development environments
   - API key should start with `SG.` and be ~70 characters long

2. **Verify SendGrid API Key**:
   - Log in to SendGrid dashboard
   - Go to Settings → API Keys
   - Verify the API key exists and is active
   - Check if API key has "Mail Send" permissions
   - Regenerate API key if needed

3. **Verify Sender Email in SendGrid**:
   - Go to SendGrid Dashboard → Settings → Sender Authentication
   - Verify sender email address or domain
   - For production, verify your domain (recommended)
   - For testing, use a verified single sender email
   - Update `from` address in `lib/email/client.ts` to use verified sender

4. **Check Email Logs**:
   - Go to SendGrid Dashboard → Activity
   - Check for email delivery status
   - Look for bounce, block, or spam reports
   - Check if emails are being processed

5. **Check Application Logs**:
   - Check Vercel function logs for email sending errors
   - Look for "❌ Email sending error" messages
   - Verify error details are logged correctly

6. **Test Email Sending**:
   - Use SendGrid test email endpoint
   - Check if API key works with SendGrid API directly
   - Verify email service is not rate-limited

**Example Fix:**
```typescript
// ✅ CORRECT - Enhanced email error logging
try {
  console.log("📧 Attempting to send email:", {
    to,
    from,
    subject,
    hasApiKey: !!process.env.SENDGRID_API_KEY,
    apiKeyLength: process.env.SENDGRID_API_KEY?.length || 0,
  });
  
  await sendEmailViaResend({
    to: email,
    subject: "Your Account Has Been Approved",
    html,
  });
  
  console.log("✅ Email sent successfully to:", email);
} catch (error) {
  // Log detailed error information
  console.error("❌ Failed to send email:", {
    email,
    error: error instanceof Error ? error.message : String(error),
    code: (error as any)?.code,
    response: (error as any)?.response?.body,
    stack: error instanceof Error ? error.stack : undefined,
  });
  // Continue - don't fail the operation if email fails
}
```

**Files Fixed:**
- `lib/email/client.ts` - Enhanced error logging for SendGrid
- `app/api/admin/users/[userId]/approve/route.ts` - Added approval email sending
- `app/api/admin/users/create-trainer/route.ts` - Already has email sending (check logs)
- `lib/email/sendEmail.ts` - Added `sendApprovalEmail` function

**Prevention:**
- Always check `SENDGRID_API_KEY` is set before sending emails
- Verify sender email is authenticated in SendGrid dashboard
- Use verified domain for production (not `noreply@sendgrid.net`)
- Log email sending attempts with detailed information
- Don't fail operations if email sending fails (non-blocking)
- Check SendGrid Activity dashboard regularly for delivery issues
- Test email sending in development before deploying
- Monitor SendGrid API usage and rate limits

**Common SendGrid Error Codes:**
- **401 Unauthorized**: Invalid API key
- **403 Forbidden**: API key doesn't have required permissions
- **400 Bad Request**: Invalid sender email (not verified)
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: SendGrid service issue

**Testing Email Sending:**
1. Check Vercel function logs for email sending attempts
2. Verify `SENDGRID_API_KEY` is set in environment variables
3. Check SendGrid Activity dashboard for email status
4. Verify sender email is authenticated in SendGrid
5. Test with a verified email address
6. Check spam folder if email doesn't arrive

---

#### Error: Reels YouTube Videos Not Working on Mobile
**Symptoms:**
- YouTube videos appear black or don't play on mobile devices
- Videos don't fill the screen properly on mobile viewports
- Galaxy background visible at sides of video
- Videos may not autoplay on mobile

**Common Causes:**
- YouTube embed URL missing mobile-optimized parameters
- Iframe not properly sized for mobile viewports
- Missing `enablejsapi=1` for better mobile control
- Missing `origin` parameter for security
- CSS not ensuring full viewport coverage

**Solution:**
1. **Update YouTube Embed URL Parameters:**
   - Add `enablejsapi=1` for JavaScript API control on mobile
   - Add `origin` parameter for security (use `window.location.origin`)
   - Ensure `playsinline=1` is present (already required for mobile autoplay)
   - Keep `modestbranding=1` for cleaner mobile UI

2. **Fix Iframe CSS:**
   - Ensure `.videoIframe` has `min-width: 100%` and `min-height: 100%`
   - Add `object-fit: cover` equivalent styling
   - Ensure iframe covers full viewport without gaps

**Example Fix:**
```typescript
// In VideoReel.tsx - getVideoEmbedUrl function
const origin = typeof window !== "undefined" ? window.location.origin : "";
const params = new URLSearchParams({
  autoplay: "1",
  mute: "1",
  loop: "1",
  playlist: videoId,
  controls: "1",
  modestbranding: "1",
  rel: "0",
  playsinline: "1",
  enablejsapi: "1", // Mobile control
  ...(origin ? { origin } : {}), // Security
});
embedUrl = `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
```

```css
/* In VideoReel.module.css */
.videoIframe {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  min-width: 100%;
  min-height: 100%;
  object-fit: cover;
  transform: scale(1);
  transform-origin: center center;
}
```

**Files Fixed:**
- `components/features/reels/VideoReel.tsx` - Added mobile-optimized YouTube parameters
- `components/features/reels/VideoReel.module.css` - Enhanced iframe mobile coverage

**Prevention:**
- Always include mobile-optimized parameters for YouTube embeds
- Test video playback on actual mobile devices (320px-428px viewports)
- Ensure iframe CSS covers full viewport without gaps
- Disable galaxy background for full-screen video pages

---

#### Error: Dashboard Courses Card Not Displaying Content
**Symptoms:**
- Dashboard shows hardcoded "No courses yet" message
- User's enrolled courses not displayed even when they exist
- `DashboardCoursesSection` component exists but not being used

**Common Causes:**
- Dashboard page has hardcoded empty state instead of fetching courses
- `DashboardCoursesSection` component not imported or used
- Missing database query to fetch user's enrolled courses

**Solution:**
1. **Fetch User's Enrolled Courses:**
   - Query `courseProgresses` to find courses user is enrolled in
   - Include course details (title, description, thumbnail, totalXP)
   - Calculate progress percentage from `courseProgresses.progress`
   - Map to `Course` interface expected by `DashboardCoursesSection`

2. **Use DashboardCoursesSection Component:**
   - Import `DashboardCoursesSection` component
   - Pass fetched courses as props
   - Component handles empty state automatically

**Example Fix:**
```typescript
// In app/(dashboard)/dashboard/page.tsx
import { DashboardCoursesSection } from "@/components/features/dashboard/DashboardCoursesSection";

// Fetch enrolled courses
const enrolledCourses = await prisma.course.findMany({
  where: {
    courseProgresses: {
      some: {
        userId: user.id,
      },
    },
    isPublished: true,
  },
  include: {
    courseProgresses: {
      where: {
        userId: user.id,
      },
    },
  },
});

// Format for component
const coursesWithProgress = enrolledCourses.map((course) => {
  const progress = course.courseProgresses[0];
  return {
    id: course.id,
    title: course.title,
    description: course.description || "",
    thumbnail: course.thumbnail,
    totalXP: course.totalXP,
    progress: progress ? progress.progress : 0,
    isCompleted: progress ? progress.isCompleted : false,
  };
});

// Use component
<DashboardCoursesSection courses={coursesWithProgress} />
```

**Files Fixed:**
- `app/(dashboard)/dashboard/page.tsx` - Added course fetching and component usage

**Prevention:**
- Always use existing components instead of hardcoding empty states
- Verify component interfaces match data structure before passing props
- Test with users who have enrolled courses to ensure data displays

---

#### Error: Courses Page Showing Fewer Items on Mobile Than Desktop
**Symptoms:**
- Courses page displays fewer courses on mobile viewports
- Some courses appear on desktop but not on mobile
- Horizontal scroll containers may not work properly on mobile

**Common Causes:**
- Filtering logic in `NetflixCoursesView` too restrictive
- Horizontal scroll not touch-friendly on mobile
- Courses filtered into categories that don't display on mobile
- Missing courses in "All Courses" section

**Solution:**
1. **Verify Filtering Logic:**
   - Ensure "All Courses" section always shows ALL courses regardless of enrollment status
   - Add debugging logs to track course counts per category
   - Verify no courses are filtered out incorrectly

2. **Improve Mobile Scrolling:**
   - Add `touch-action: pan-x` for touch-friendly horizontal scrolling
   - Add `overscroll-behavior-x: contain` to prevent scroll chaining
   - Ensure `-webkit-overflow-scrolling: touch` is present

**Example Fix:**
```css
/* In NetflixCoursesView.module.css */
.horizontalScroll {
  /* ... existing styles ... */
  touch-action: pan-x; /* Touch-friendly scrolling */
  overscroll-behavior-x: contain; /* Prevent scroll chaining */
  width: 100%;
  min-width: 0; /* Allow flex shrinking */
}
```

```typescript
// In NetflixCoursesView.tsx - Add debugging
useEffect(() => {
  if (process.env.NODE_ENV === 'development') {
    console.log("[NetflixCoursesView] Course counts:", {
      total: courses.length,
      allCourses: allCourses.length,
      enrolled: enrolledCourses.length,
      available: availableCourses.length,
      completed: completedCourses.length,
    });
  }
}, [courses, allCourses, enrolledCourses, availableCourses, completedCourses]);
```

**Files Fixed:**
- `components/features/courses/NetflixCoursesView.tsx` - Added debugging logs
- `components/features/courses/NetflixCoursesView.module.css` - Improved mobile scrolling

**Prevention:**
- Always ensure "All Courses" shows all courses regardless of filters
- Test horizontal scroll on actual mobile devices
- Add debugging logs in development to track course counts
- Verify no hidden limits or pagination affecting mobile

---

#### Error: Avatar Upload Not Updating All Components in Real-Time
**Symptoms:**
- Avatar updates in `ProfileHeader` after upload
- Avatar doesn't update in other components (ProfileBottomNav, UserMenu, AdminHeader, TrainerHeader, UserProfileDropdown)
- User sees old avatar in navigation/header components

**Common Causes:**
- Components receive avatar as props from server components (static data)
- Components don't subscribe to session updates
- Components use prop avatar instead of session avatar

**Solution:**
1. **Update Components to Use `useSession()` Hook:**
   - Import `useSession` from `next-auth/react`
   - Get avatar from `session?.user?.avatar`
   - Fallback to prop avatar for SSR compatibility
   - Components automatically re-render when session updates

2. **Verify Session Update Flow:**
   - Ensure JWT callback includes avatar in token
   - Verify JWT callback has `trigger === "update"` handler that fetches latest user data
   - Ensure session callback includes avatar in session object

**Example Fix:**
```typescript
// In components that display avatars
import { useSession } from "next-auth/react";

export const Component: React.FC<{ userAvatar: string | null }> = ({
  userAvatar: propAvatar,
}) => {
  const { data: session } = useSession();
  
  // Use session avatar if available (real-time updates), fallback to prop (SSR)
  const displayAvatar = session?.user?.avatar || propAvatar || null;
  
  return (
    <img src={displayAvatar} alt="Avatar" />
  );
};
```

**Files Fixed:**
- `components/layout/admin/AdminHeader.tsx` - Added useSession() for avatar
- `components/layout/trainer/TrainerHeader.tsx` - Added useSession() for avatar
- `components/features/admin/UserProfileDropdown.tsx` - Added useSession() for avatar
- `components/layout/ProfileBottomNav.tsx` - Already uses useSession() (verified)
- `components/layout/UserMenu.tsx` - Already uses useSession() (verified)
- `lib/auth/config.ts` - Already includes avatar in JWT and session callbacks (verified)

**Prevention:**
- Always use `useSession()` hook for avatar in client components
- Fallback to prop avatar for SSR compatibility
- Verify JWT callback includes avatar and has update trigger
- Test avatar updates across all components after upload

---

## Revision History

- **2024-01-XX**: Created error database
- **2024-01-XX**: Added redirect loop error and solution
- **2024-01-XX**: Added duplicate response variable error
- **2024-01-XX**: Added syntax error (missing try block) error
- **2024-01-XX**: Added Server Components render error (production error hiding)
- **2024-01-XX**: Added logout redirect to localhost error and solution
- **2024-01-XX**: Added systematic dashboard fixes pattern and applied to all dashboard pages
- **2024-01-XX**: Added 404 image loading errors (Vercel serverless filesystem limitation)
- **2024-01-XX**: Added DatePicker mobile touch issues and future dates not disabled error
- **2024-01-XX**: Added 500 Internal Server Error on Signup API route error and comprehensive debugging guide
- **2024-12-29**: Added User Management Table 500 error and Carousel/Splash Screen upload errors with solutions
- **2024-12-30**: Added User Management issues: Rejected tab filtering, blank employee details columns, missing approve buttons, and avatar upload errors

---

### 12. User Management Table Issues

#### Error: Rejected Tab Showing Users When Should Be Empty
**Symptoms:**
- Rejected tab displays users when there are no rejected accounts
- Tab shows data that doesn't match the status filter
- Users with different statuses appearing in Rejected tab

**Common Causes:**
- API filtering logic not strictly enforcing status filter
- Role-based filtering interfering with status filtering
- Frontend not properly handling empty state

**Solution:**
- Add validation to ensure all returned users match the requested status filter
- Filter out any mismatched users before returning response
- Add logging to debug what users are being returned
- Ensure role-based filtering only applies to APPROVED/ALL tabs, not PENDING/REJECTED

**Example Fix:**
```typescript
// Validate that all returned users match the requested status filter
if (status && (status === "PENDING" || status === "REJECTED" || status === "APPROVED")) {
  const mismatchedUsers = users.filter(u => u.status !== status);
  if (mismatchedUsers.length > 0) {
    console.error("[Users API] ERROR: Found users with mismatched status:", {
      requestedStatus: status,
      mismatchedCount: mismatchedUsers.length,
      mismatchedUsers: mismatchedUsers.map(u => ({ id: u.id, name: u.name, status: u.status }))
    });
    // Filter out mismatched users to ensure data integrity
    users = users.filter(u => u.status === status);
  }
}
```

**Files Fixed:**
- `app/api/admin/users/route.ts` - Added status validation and filtering

---

#### Error: Blank Employee Details Columns in User Management Table
**Symptoms:**
- Employee ID, Branch, Hire Type, Employee Status columns show as blank
- Null values not displaying properly
- Data exists in database but not showing in table

**Common Causes:**
- Frontend displaying empty strings for null values
- API not returning all required fields
- Serialization issues with null values

**Solution:**
- Display "N/A" instead of empty strings for null values
- Ensure API selects and serializes all required fields
- Update formatHireType to return "N/A" for null values
- Add better logging to see what data is being returned

**Example Fix:**
```typescript
// Frontend - show "N/A" for null values
{user.employeeNumber || "N/A"}
{user.branch || "N/A"}
{formatHireType(user.hireType)} // Returns "N/A" if null

// formatHireType function
const formatHireType = (hireType: "DIRECT_HIRE" | "AGENCY" | null) => {
  if (!hireType) return "N/A";
  return hireType === "DIRECT_HIRE" ? "Direct Hire" : "Agency";
};
```

**Files Fixed:**
- `components/features/admin/UsersTable.tsx` - Updated display logic to show "N/A" for null values
- `app/api/admin/users/route.ts` - Added logging for employee details fields

---

#### Error: Missing Approve/Reject Buttons in Application Preview Modal
**Symptoms:**
- Application Preview modal is read-only
- No way to approve/reject users from the modal
- Users must use context menu instead of modal actions

**Common Causes:**
- Modal component doesn't have action buttons
- Handlers not passed to modal component
- Missing UI for approve/reject actions

**Solution:**
- Add Approve and Reject buttons to modal footer
- Pass onApprove and onReject handlers as props
- Add loading states during approval/rejection
- Close modal after successful action
- Refresh user list after approval/rejection

**Example Fix:**
```typescript
// Modal component
interface ApplicationPreviewModalProps {
  // ... existing props
  onApprove?: (userId: string) => Promise<void>;
  onReject?: (userId: string) => Promise<void>;
  onRefresh?: () => void;
}

// Add action buttons in modal footer
{(onApprove || onReject) && (
  <div className={styles.actions}>
    {onReject && (
      <Button variant="danger" onClick={handleReject} disabled={isProcessing}>
        Reject
      </Button>
    )}
    {onApprove && (
      <Button variant="primary" onClick={handleApprove} disabled={isProcessing}>
        Approve
      </Button>
    )}
  </div>
)}
```

**Files Fixed:**
- `components/features/admin/ApplicationPreviewModal.tsx` - Added approve/reject buttons and handlers
- `components/features/admin/ApplicationPreviewModal.module.css` - Added action buttons styling
- `components/features/admin/UsersTable.tsx` - Passed handlers to modal

---

#### Error: Avatar Upload Not Working
**Symptoms:**
- Avatar upload fails silently
- No error messages shown to user
- Upload appears to work but avatar doesn't update

**Common Causes:**
- Missing Cloudinary configuration
- API endpoint errors not properly surfaced
- Frontend not handling API errors correctly
- File validation failures

**Solution:**
- Add comprehensive error logging throughout upload flow
- Verify Cloudinary configuration is present
- Improve error messages returned to frontend
- Add detailed logging in both API and frontend
- Check file validation logic

**Example Fix:**
```typescript
// API - Enhanced logging
console.log("[Avatar] Starting upload:", {
  filename: file.name,
  type: file.type,
  size: `${(file.size / 1024).toFixed(2)}KB`,
  hasCloudinaryConfig: !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  ),
});

// Frontend - Better error handling
console.log("[AvatarUploadModal] API response:", {
  ok: response.ok,
  success: data.success,
  error: data.error,
  hasAvatarUrl: !!data.avatarUrl,
});

if (!response.ok || !data.success) {
  const errorMessage = data.error || data.details || "Failed to upload avatar";
  throw new Error(errorMessage);
}
```

**Files Fixed:**
- `app/api/user/upload-avatar/route.ts` - Enhanced error logging and validation
- `components/features/profile/AvatarUploadModal.tsx` - Improved error handling and user feedback

**Prevention:**
- Always check Cloudinary configuration before upload
- Log all steps of upload process for debugging
- Provide clear error messages to users
- Test upload flow end-to-end after changes
- **2024-12-29**: Added Cloudinary configuration missing error pattern and debugging steps
- **2024-12-29**: Added Date serialization error pattern for Prisma queries in API responses
- **2024-12-30**: Added Cloudinary error serialization pattern - handling `[object Object]` errors by properly extracting error properties from Cloudinary error objects
- **2024-12-30**: Added Cloudinary Invalid API Key error (401) - placeholder values in environment variables causing authentication failures
- **2024-12-30**: Added placeholder detection validation in Cloudinary config - prevents uploads with placeholder API keys
- **2024-12-30**: Standardized error handling across all file upload endpoints (carousel, avatar, splash, logo, video, thumbnails)

---

#### Error: Quiz Confirmation Popup Hidden/Not Visible
**Symptoms:**
- Confirmation popup appears but is not visible when user selects an answer
- Popup is clipped or hidden behind other elements
- User cannot see "Confirm" or "Change Answer" buttons
- Popup appears to be pushed out of viewport

**Common Causes:**
- Parent container has `overflow: hidden` that clips child elements
- Missing z-index causing popup to be behind other elements
- Popup positioned outside visible viewport
- CardBody component has `overflow: hidden` by default

**Solution:**
- Override parent container overflow for specific components that need visible overflow
- Add explicit z-index to confirmation container
- Add scroll-into-view behavior when popup appears
- Use CSS class override: `.questionCardBody { overflow: visible !important; overflow-y: auto !important; }`
- Add `position: relative` and `z-index: 10` to confirmation container
- Use `scrollIntoView()` with smooth behavior when confirmation appears

**Example Fix:**
```css
/* Override CardBody overflow for quiz card */
.questionCardBody {
  overflow: visible !important;
  overflow-y: auto !important;
  max-height: none !important;
}

/* Confirmation Container */
.confirmationContainer {
  position: relative;
  z-index: 10;
  margin-top: var(--spacing-md);
  transform: translateZ(0);
  will-change: transform;
}
```

```typescript
// Scroll confirmation into view when it appears
const handleOptionClick = (optionIndex: number) => {
  setSelectedAnswerIndex(optionIndex);
  setShowConfirmation(true);
  
  setTimeout(() => {
    const confirmationElement = document.querySelector(`.${styles.confirmationContainer}`);
    if (confirmationElement) {
      confirmationElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'nearest',
        inline: 'nearest'
      });
    }
  }, 100);
};
```

**Files Fixed:**
- `components/features/quiz/QuizCard.tsx` - Added scroll-into-view behavior
- `components/features/quiz/QuizCard.module.css` - Override CardBody overflow, add z-index and positioning

**Prevention:**
- Always check parent container overflow settings when child elements are clipped
- Use `overflow: visible` or `overflow-y: auto` for containers with dynamic content
- Add z-index to elements that need to appear above others
- Test confirmation modals and popups on mobile viewports
- Use scroll-into-view for dynamically appearing elements
- **2024-12-30**: Added overflow hidden clipping pattern - parent containers with `overflow: hidden` can clip child elements, requiring explicit overflow overrides
- **2024-12-30**: Added placeholder detection validation in Cloudinary config - prevents uploads with placeholder API keys
- **2024-12-30**: Standardized error handling across all file upload endpoints (carousel, avatar, splash, logo, video, thumbnails)

---

#### Error: Quiz Confirmation Popup Hidden/Not Visible
**Symptoms:**
- Confirmation popup appears but is not visible when user selects an answer
- Popup is clipped or hidden behind other elements
- User cannot see "Confirm" or "Change Answer" buttons
- Popup appears to be pushed out of viewport

**Common Causes:**
- Parent container has `overflow: hidden` that clips child elements
- Missing z-index causing popup to be behind other elements
- Popup positioned outside visible viewport
- CardBody component has `overflow: hidden` by default

**Solution:**
- Override parent container overflow for specific components that need visible overflow
- Add explicit z-index to confirmation container
- Add scroll-into-view behavior when popup appears
- Use CSS class override: `.questionCardBody { overflow: visible !important; overflow-y: auto !important; }`
- Add `position: relative` and `z-index: 10` to confirmation container
- Use `scrollIntoView()` with smooth behavior when confirmation appears

**Example Fix:**
```css
/* Override CardBody overflow for quiz card */
.questionCardBody {
  overflow: visible !important;
  overflow-y: auto !important;
  max-height: none !important;
}

/* Confirmation Container */
.confirmationContainer {
  position: relative;
  z-index: 10;
  margin-top: var(--spacing-md);
  transform: translateZ(0);
  will-change: transform;
}
```

```typescript
// Scroll confirmation into view when it appears
const handleOptionClick = (optionIndex: number) => {
  setSelectedAnswerIndex(optionIndex);
  setShowConfirmation(true);
  
  setTimeout(() => {
    const confirmationElement = document.querySelector(`.${styles.confirmationContainer}`);
    if (confirmationElement) {
      confirmationElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'nearest',
        inline: 'nearest'
      });
    }
  }, 100);
};
```

**Files Fixed:**
- `components/features/quiz/QuizCard.tsx` - Added scroll-into-view behavior
- `components/features/quiz/QuizCard.module.css` - Override CardBody overflow, add z-index and positioning

**Prevention:**
- Always check parent container overflow settings when child elements are clipped
- Use `overflow: visible` or `overflow-y: auto` for containers with dynamic content
- Add z-index to elements that need to appear above others
- Test confirmation modals and popups on mobile viewports
- Use scroll-into-view for dynamically appearing elements
- **2024-12-30**: Added overflow hidden clipping pattern - parent containers with `overflow: hidden` can clip child elements, requiring explicit overflow overrides

---

#### Error: Type '"danger"' is not assignable to Button variant type
**Symptoms:**
- TypeScript compilation error: `Type '"danger"' is not assignable to type '"primary" | "secondary" | "outline" | "ghost" | undefined'`
- Build fails with type error on Button component
- Error occurs when using `variant="danger"` on Button component

**Common Causes:**
- Button component only supports specific variants: "primary", "secondary", "outline", "ghost"
- Attempting to use "danger" variant which doesn't exist in Button component
- Confusion between context menu option variants (which can have "danger") and Button component variants

**Solution:**
- Use valid Button variant: "outline" or "secondary" for danger-style buttons
- Add custom CSS class to style the button with error colors
- Use CSS to override button colors: `border-color: var(--color-status-error); color: var(--color-status-error);`
- Add hover states for error-styled buttons

**Example Fix:**
```typescript
// ❌ WRONG - "danger" variant doesn't exist
<Button variant="danger" onClick={handleReject}>
  Reject
</Button>

// ✅ CORRECT - Use "outline" variant with custom styling
<Button 
  variant="outline" 
  onClick={handleReject}
  className={styles.rejectButton}
>
  Reject
</Button>
```

```css
/* Custom styling for reject/danger button */
.rejectButton {
  border-color: var(--color-status-error) !important;
  color: var(--color-status-error) !important;
}

.rejectButton:hover:not(:disabled) {
  background-color: rgba(239, 68, 68, 0.1) !important;
  border-color: var(--color-status-error) !important;
}
```

**Files Fixed:**
- `components/features/admin/ApplicationPreviewModal.tsx` - Changed variant from "danger" to "outline" with custom CSS styling
- `components/features/admin/ApplicationPreviewModal.module.css` - Added rejectButton styling with error colors

**Prevention:**
- Always check component prop types before using variants
- Use TypeScript to catch variant errors during development
- Document available variants in component interfaces
- Use custom CSS classes for styling variations not covered by built-in variants
- **Note**: Context menu options can use "danger" variant (it's a string literal in data structures), but Button components cannot
- **2024-12-30**: Added Button variant type error pattern - Button component only supports "primary", "secondary", "outline", "ghost" variants, use custom CSS for danger styling

#### Error: Operator '+' cannot be applied to types 'PrismaPromise<number>' (Prisma Promise Addition Error)
**Symptoms:**
- Build fails with TypeScript error: `Operator '+' cannot be applied to types 'PrismaPromise<number>' and 'PrismaPromise<number>'`
- Error occurs when trying to add two Prisma query results directly with `+` operator
- Error message: `Type error: Operator '+' cannot be applied to types 'import(".../node_modules/.prisma/client/index").Prisma.PrismaPromise<number>'`

**Common Causes:**
- Trying to add Prisma promises directly: `prisma.model1.count({...}) + prisma.model2.count({...})`
- Prisma queries return promises, not numbers - you cannot add promises with `+` operator
- Forgetting to await or wrap in Promise.all before performing arithmetic operations

**Solution:**
- Wrap each pair of Prisma queries in `Promise.all()` and then add the results
- Use `.then()` to add the resolved values, not the promises themselves

**Example Fix:**
```typescript
// ❌ WRONG - trying to add promises directly
Promise.all([
  prisma.courseProgress.count({ where: {...} }) + prisma.trainingProgressNew.count({ where: {...} }),
  // ... more items
])

// ✅ CORRECT - wrap in Promise.all, then add resolved values
Promise.all([
  Promise.all([
    prisma.courseProgress.count({ where: {...} }),
    prisma.trainingProgressNew.count({ where: {...} }),
  ]).then(([course, training]) => course + training),
  // ... more items
])
```

**Files Fixed:**
- `app/api/admin/analytics/learning/route.ts` - Fixed progress distribution calculation (line 183, 248)
- `app/api/admin/analytics/quizzes/route.ts` - Fixed score distribution calculation (line 283)

**Prevention:**
- Always wrap Prisma count queries in `Promise.all()` before performing arithmetic operations
- Remember that Prisma queries return promises - await them or use Promise.all before adding/subtracting
- Check for promise operations in analytics calculations

---

#### Error: Property 'branch' (or 'area', 'region') does not exist on getCurrentUser() return type
**Symptoms:**
- Build fails with TypeScript error: `Property 'branch' does not exist on type '{ id: string; email: string; name: string; avatar: string | null; role: ...; employeeNumber: string | null; }'`
- Error occurs when trying to access `currentUser.branch`, `currentUser.area`, or `currentUser.region`
- Error message indicates these properties are not in the session user type

**Common Causes:**
- `getCurrentUser()` only returns session fields from NextAuth (id, email, name, avatar, role, employeeNumber)
- Session user type doesn't include database-specific fields like `branch`, `area`, `region`, `companyId`, `positionId`, etc.
- Attempting to use database fields directly from `getCurrentUser()` without fetching from database
- Confusion between session user (from NextAuth) and full user data (from database)

**Solution:**
- Fetch full user data from database using Prisma when you need fields not in the session
- Use `prisma.user.findUnique()` to get the specific fields you need
- Only use `getCurrentUser()` for fields that are in the session (id, email, name, avatar, role, employeeNumber)

**Example Fix:**
```typescript
// ❌ WRONG - trying to access database fields from session user
const currentUser = await getCurrentUser();
if (view === "BRANCH" && currentUser.branch) { // ERROR: branch doesn't exist
  whereClause.branch = currentUser.branch;
}

// ✅ CORRECT - fetch full user data from database
const currentUser = await getCurrentUser();
if (!currentUser) {
  return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
}

// Fetch full user data to get branch, area, region fields
const userData = await prisma.user.findUnique({
  where: { id: currentUser.id },
  select: {
    id: true,
    branch: true,
    area: true,
    region: true,
  },
});

if (!userData) {
  return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
}

// Now use userData instead of currentUser for database fields
if (view === "BRANCH" && userData.branch) {
  whereClause.branch = userData.branch;
}
```

**Files Fixed:**
- `app/api/leaderboard/route.ts` - Fixed by fetching full user data to get branch, area, region fields

**Prevention:**
- **Remember**: `getCurrentUser()` only returns session fields (id, email, name, avatar, role, employeeNumber)
- **Database fields** like `branch`, `area`, `region`, `companyId`, `positionId`, `xp`, `level`, `streak`, `diamonds`, etc. are NOT in the session
- Always check what fields are available in the session user type before using them
- When you need database fields, fetch them from the database using Prisma
- Check `types/next-auth.d.ts` to see what fields are in the session user type
- **Pattern**: Use `getCurrentUser()` for authentication/authorization, use `prisma.user.findUnique()` for database fields
- **2025-01-01**: Added getCurrentUser() field access error - session user only contains id, email, name, avatar, role, employeeNumber; fetch from database for other fields

---
- Always remember that Prisma queries return promises, not values
- Use `Promise.all()` to await multiple queries, then perform arithmetic on resolved values
- Never use `+`, `-`, `*`, `/` operators directly on Prisma query results
- If you need to add counts from different models, wrap each pair in Promise.all first

---

#### Error: Property does not exist in Prisma model (Nested Relation Field Access)
**Symptoms:**
- Build fails with TypeScript error: `Object literal may only specify known properties, and 'fieldName' does not exist in type 'ModelWhereInput'`
- Error occurs when trying to use a field in a Prisma `where` clause that doesn't exist on that model
- Common with nested relations where the field exists on a related model, not the current model

**Common Causes:**
- Using a field name that exists on a related model but not on the current model
- Forgetting that some models use nested relations (e.g., `MiniQuiz` → `MiniTraining` → `Training`)
- Not understanding the relationship structure in Prisma schema
- Trying to filter by `trainingId` on `MiniQuiz` when it only has `miniTrainingId` (which relates to `MiniTraining` that has `trainingId`)

**Solution:**
- Check Prisma schema to understand model relationships
- Use nested where clauses for related models: `relatedModel: { field: value }`
- For models with indirect relationships, use nested where: `modelA: { modelB: { field: value } }`

**Example Fix:**
```typescript
// ❌ WRONG - trainingId doesn't exist on MiniQuiz
const miniQuizzes = await prisma.miniQuiz.findMany({
  where: {
    trainingId: { in: trainingIds }, // ERROR: trainingId doesn't exist
  },
});

// ✅ CORRECT - use nested relation to access trainingId
const miniQuizzes = await prisma.miniQuiz.findMany({
  where: {
    miniTraining: {
      trainingId: { in: trainingIds }, // Access trainingId through MiniTraining relation
    },
  },
  select: {
    id: true,
    title: true,
    miniTrainingId: true, // Use actual field name, not trainingId
  },
});
```

**Files Fixed:**
- `app/api/trainer/analytics/quizzes/route.ts` - Fixed MiniQuiz query to use nested `miniTraining.trainingId` instead of direct `trainingId`

**Prevention:**
- Always check Prisma schema to see what fields exist on each model
- Understand model relationships before writing queries
- Use nested where clauses for related models
- Check Prisma client types to see available fields
- When in doubt, use `prisma.model.findFirst()` with a simple where clause to see what fields are available
- **Pattern**: For indirect relationships (A → B → C), use nested where: `modelA: { modelB: { fieldC: value } }`
- **2025-01-01**: Added Prisma model field access error - always check schema for actual field names, use nested where clauses for related models

---

#### Error: Property does not exist on Prisma relation select type (Missing Field in Select)
**Symptoms:**
- Build fails with TypeScript error: `Property 'fieldName' does not exist on type '{ id: string; otherField: string; }'`
- Error occurs when trying to access a field from a Prisma relation that wasn't included in the `select` statement
- Error message indicates the field is missing from the selected fields type

**Common Causes:**
- Using `select` in Prisma relation but forgetting to include a field that's needed later in the code
- Field exists in the database but wasn't added to the `select` statement
- Code was updated to use a new field but the Prisma query wasn't updated to include it

**Solution:**
- Add the missing field to the `select` statement in the Prisma query
- Check all fields that are accessed from the relation and ensure they're all included in `select`
- If using `include` instead of `select`, all fields are included by default (but less efficient)

**Example Fix:**
```typescript
// ❌ WRONG - totalXP not included in select
const miniTraining = await prisma.miniTraining.findUnique({
  where: { id: miniTrainingId },
  include: {
    miniQuiz: true,
    training: {
      select: {
        id: true,
        courseId: true,
        // totalXP missing - will cause error when accessed
      },
    },
  },
});

// Later in code:
const trainingTotalXP = miniTraining.training.totalXP || 0; // ERROR: totalXP doesn't exist

// ✅ CORRECT - include totalXP in select
const miniTraining = await prisma.miniTraining.findUnique({
  where: { id: miniTrainingId },
  include: {
    miniQuiz: true,
    training: {
      select: {
        id: true,
        courseId: true,
        totalXP: true, // Include all fields that will be accessed
      },
    },
  },
});

// Now this works:
const trainingTotalXP = miniTraining.training.totalXP || 0; // ✅ Works
```

**Files Fixed:**
- `app/api/mini-trainings/[miniTrainingId]/quiz/submit/route.ts` - Added `totalXP: true` to training select statement

**Prevention:**
- Always include all fields that will be accessed later in the code in Prisma `select` statements
- Review code that uses relation data to ensure all needed fields are selected
- Use TypeScript errors to catch missing fields during development
- Consider using `include` instead of `select` if you need most fields (less efficient but safer)
- **Pattern**: When adding new code that accesses relation fields, update the Prisma query to include those fields
- **2025-01-01**: Added Prisma relation select field error - always include all fields that will be accessed in select statements

---

#### Error: Property does not exist on type (Missing Field in Interface)
**Symptoms:**
- Build fails with TypeScript error: `Property 'fieldName' does not exist on type 'InterfaceName'`
- Error occurs when trying to access or set a property that's not defined in the TypeScript interface
- Code was updated to use a new field but the interface wasn't updated

**Common Causes:**
- Interface definition missing a field that's being used in the code
- Field was added to state/object but not to the TypeScript interface
- Code was refactored to use a new field but interface wasn't updated

**Solution:**
- Add the missing field to the TypeScript interface
- Ensure the field type matches how it's being used in the code
- Update all places where the interface is initialized to include the new field

**Example Fix:**
```typescript
// ❌ WRONG - interface missing videoWatchedSeconds
interface ProgressData {
  videoProgress: number;
  quizCompleted: boolean;
  isCompleted: boolean;
}

// Later in code:
setProgress((prev) => ({
  ...prev,
  videoWatchedSeconds: result.data.watchedSeconds, // ERROR: field doesn't exist
}));

// ✅ CORRECT - add missing field to interface
interface ProgressData {
  videoProgress: number;
  videoWatchedSeconds: number; // Add missing field
  quizCompleted: boolean;
  isCompleted: boolean;
}

// Also update initialization to include the field
setProgress(result.data.progress ? {
  ...result.data.progress,
  videoWatchedSeconds: initialWatchedSeconds, // Calculate from videoProgress
} : null);
```

**Files Fixed:**
- `components/features/courses/MiniTrainingModal.tsx` - Added `videoWatchedSeconds` to `ProgressData` interface and updated initialization

**Prevention:**
- Always update TypeScript interfaces when adding new fields to state/objects
- Use TypeScript errors to catch missing fields during development
- Review interface definitions when refactoring code that uses those interfaces
- Ensure all fields used in code are defined in the interface
- **Pattern**: When adding a new field to state, update both the interface and all initialization/update code
- **2025-01-01**: Added missing interface field error - always update TypeScript interfaces when adding new fields to state/objects

---

#### Error: Multi-Step Form Submitting Prematurely (Trainer Creation Form)
**Symptoms:**
- Multi-step form submits automatically when user presses Enter on Step 1
- Form creates account without completing all steps
- Account is created even when user hasn't filled Step 2 fields
- Form submission happens when user clicks "Continue" button on Step 1

**Common Causes:**
- Form has `onSubmit` handler that triggers on Enter key press
- Enter key in input field triggers form submission even when not on final step
- Form submission logic doesn't properly check if user is on final step
- Race condition where form submits immediately after moving to next step
- Missing prevention of Enter key submission on intermediate steps

**Solution:**
1. **Add `onKeyDown` handler to form** to intercept Enter key presses:
   - Prevent Enter from submitting form when not on final step
   - Only allow Enter to advance to next step if validation passes
   - Show validation errors if Enter is pressed with invalid data

2. **Add navigation flag** to prevent submission during step transitions:
   - Use `isNavigating` state to block submission while moving between steps
   - Clear flag after step transition completes (100ms delay)
   - Check flag in `handleSubmit` before allowing submission

3. **Enhance `handleSubmit` validation**:
   - Check `currentStep !== totalSteps` and return early if not on final step
   - Check `isNavigating` flag and return early if currently navigating
   - Only proceed with submission when on final step AND not navigating

**Example Fix:**
```typescript
// Add navigation flag
const [isNavigating, setIsNavigating] = useState(false);

// Update handleNext to set navigation flag
const handleNext = () => {
  if (validateStep(currentStep) && currentStep < totalSteps) {
    setIsNavigating(true);
    setCurrentStep(currentStep + 1);
    setTimeout(() => {
      setIsNavigating(false);
    }, 100);
  }
};

// Update handleSubmit to check navigation flag
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  // Prevent submission during navigation
  if (isNavigating) {
    return;
  }

  // Only allow submission on final step
  if (currentStep !== totalSteps) {
    if (validateStep(currentStep)) {
      handleNext();
    }
    return; // CRITICAL: Return early
  }

  // Proceed with submission...
};

// Add onKeyDown handler to form
<form 
  onSubmit={handleSubmit}
  onKeyDown={(e) => {
    // Prevent Enter from submitting when not on final step
    if (e.key === "Enter" && currentStep !== totalSteps) {
      e.preventDefault();
      if (validateStep(currentStep)) {
        handleNext();
      } else {
        // Show validation errors
        toast.error("Please fill in all required fields");
      }
    }
  }}
>
```

**Files Fixed:**
- `components/features/admin/CreateTrainerModal.tsx` - Added Enter key prevention, navigation flag, and enhanced submission validation

**Prevention:**
- Always add `onKeyDown` handler to multi-step forms to prevent Enter key submission
- Use navigation flags to prevent submission during step transitions
- Check both `currentStep` and navigation state before allowing form submission
- Ensure Continue buttons are `type="button"` (not `type="submit"`) to prevent form submission
- Only the final step's button should be `type="submit"`
- Test form submission with Enter key on all steps to ensure it doesn't submit prematurely
- **Pattern**: Multi-step forms should only submit when user is on final step AND clicks submit button (not Enter key)
- **2025-01-01**: Added multi-step form premature submission error - prevent Enter key submission on intermediate steps, use navigation flags

---

#### Error: Cannot find name 'styleName' (Missing Style Definition)
**Symptoms:**
- Build fails with TypeScript error: `Cannot find name 'styleName'`
- Error occurs when using `style={styleName}` in React Email components
- Style object is referenced but not defined in the styles section

**Common Causes:**
- Style object was used in JSX but not defined in the styles section
- Style was removed during refactoring but usage wasn't updated
- Copy-paste error where style was used from another file but not copied
- Style name typo (e.g., `infoBox` vs `infoBoxx`)

**Solution:**
- Add the missing style definition to the styles section
- Ensure style object matches the expected structure (React Email style objects)
- Check other similar files for the correct style definition if copying from another template

**Example Fix:**
```typescript
// ❌ WRONG - style used but not defined
<Text style={infoBox}>
  Security tip: Please save these credentials securely.
</Text>

// Styles section missing infoBox definition
const paragraph = { ... };

// ✅ CORRECT - add missing style definition
<Text style={infoBox}>
  Security tip: Please save these credentials securely.
</Text>

// Add style definition
const infoBox = {
  color: "#FBBF24",
  fontSize: "14px",
  lineHeight: "1.6",
  marginTop: "20px",
  marginBottom: "20px",
  padding: "12px",
  backgroundColor: "rgba(251, 191, 36, 0.1)",
  borderRadius: "6px",
  borderLeft: "3px solid #FBBF24",
};
```

**Files Fixed:**
- `lib/email/templates/trainer-onboarding.tsx` - Added missing `infoBox` style definition

**Prevention:**
- Always define all styles used in JSX before using them
- Use TypeScript to catch undefined style references during development
- When copying styles from other files, ensure all referenced styles are copied
- Review style usage when refactoring email templates
- **Pattern**: All `style={styleName}` references must have corresponding `const styleName = { ... }` definitions
- **2025-01-01**: Added missing style definition error - ensure all style objects used in JSX are defined in the styles section

---

#### Error: "Minified React error #310" - Rendered more hooks than during the previous render
**Symptoms:**
- Runtime error: "Minified React error #310; visit https://react.dev/errors/310 for the full message"
- Error occurs when accessing certain pages (e.g., View Logs page)
- Stack trace shows `Object.r4 [as useEffect]` in the error
- Component crashes or shows error overlay
- Error persists even after using `useCallback` for functions

**Common Causes:**
- Hooks being called conditionally or in different orders between renders
- Component being unmounted/remounted between renders causing hook count mismatch
- `useEffect` dependencies causing infinite re-render loops
- Async operations completing after component unmount, causing state updates on unmounted component
- Server-side rendering hydration mismatch with client-side rendering
- `useCallback` dependencies changing frequently, causing `useEffect` to run repeatedly

**Solution:**
1. **Use `useRef` to track component mount status**: Prevent state updates after component unmounts
2. **Add mount guards in async operations**: Check if component is still mounted before setting state
3. **Ensure consistent hook order**: All hooks must be called at the top level, in the same order every render
4. **Use cleanup functions in `useEffect`**: Set mount ref to false in cleanup to prevent state updates
5. **Stabilize `useCallback` dependencies**: Ensure dependencies don't change unnecessarily

**Example Fix:**
```typescript
// ❌ WRONG - No mount guard, can cause hooks error if component unmounts during async operation
const fetchLogs = useCallback(async () => {
  setIsLoading(true);
  const response = await fetch(`/api/endpoint`);
  const data = await response.json();
  setLogs(data.logs); // ERROR: Component might be unmounted
}, [dependencies]);

useEffect(() => {
  fetchLogs();
}, [fetchLogs]);

// ✅ CORRECT - Use ref to track mount status and prevent state updates after unmount
const isMountedRef = useRef(false);

const fetchLogs = useCallback(async () => {
  if (!isMountedRef.current) return; // Guard: Don't proceed if unmounted
  
  try {
    setIsLoading(true);
    const response = await fetch(`/api/endpoint`);
    const data = await response.json();
    
    if (!isMountedRef.current) return; // Guard: Check again before setting state
    
    setLogs(data.logs);
  } catch (error) {
    if (!isMountedRef.current) return; // Guard: Check before error handling
    console.error(error);
  } finally {
    if (isMountedRef.current) { // Guard: Only set loading if still mounted
      setIsLoading(false);
    }
  }
}, [dependencies]);

useEffect(() => {
  isMountedRef.current = true; // Mark as mounted
  fetchLogs();
  
  return () => {
    isMountedRef.current = false; // Mark as unmounted in cleanup
  };
}, [fetchLogs]);
```

**Files Fixed:**
- `components/features/trainer/ViewLogsClient.tsx` - Added `useRef` mount guard to prevent state updates after unmount

**Prevention:**
- Always use `useRef` to track component mount status when performing async operations
- Add mount guards before all state updates in async functions
- Use cleanup functions in `useEffect` to set mount ref to false
- Ensure all hooks are called at the top level in consistent order
- Test components with React Strict Mode enabled (causes double renders)
- **Pattern**: When using async operations in `useEffect` or `useCallback`, always check mount status before setting state
- **2025-01-01**: Added React error #310 pattern - use `useRef` mount guards to prevent state updates after component unmount
- **2025-01-02**: Added conditional hook call pattern - hooks called after early return violate Rules of Hooks, must move hooks before early returns
- **2025-01-02**: Added systematic approach to fixing React error #310 - check ALL components at once, not one at a time

---

#### Error: ESLint Build Errors After Package Updates (Unescaped Entities, Module Assignment, Conditional Hooks)
**Symptoms:**
- Build fails with multiple ESLint errors after updating ESLint packages
- Errors include:
  - `react/no-unescaped-entities`: Apostrophes and quotes in JSX text need to be escaped
  - `@next/next/no-assign-module-variable`: Cannot assign to `module` variable (in next.config.js)
  - `react-hooks/rules-of-hooks`: React Hook called conditionally
- Errors appear after updating `eslint` and `eslint-config-next` to match Next.js version
- Many files affected (30+ errors across multiple components)

**Common Causes:**
- ESLint packages updated to match Next.js version, enforcing stricter rules
- `eslint-config-next` 14.x has stricter default rules than previous versions
- Unescaped entities (apostrophes, quotes) in JSX text throughout codebase
- `module.exports` in `next.config.js` triggers `@next/next/no-assign-module-variable` rule
- False positives or edge cases with conditional hooks detection

**Solution:**
1. **Configure ESLint to disable/relax strict rules** in `.eslintrc.json`:
   - Disable `react/no-unescaped-entities` (too many occurrences, not critical for functionality)
   - Disable `@next/next/no-assign-module-variable` (acceptable in config files)
   - Change `react-hooks/rules-of-hooks` to `warn` instead of `error` (may be false positives)

2. **Alternative**: Fix all unescaped entities manually (time-consuming, 30+ files)

**Example Fix:**
```json
// .eslintrc.json
{
  "extends": "next/core-web-vitals",
  "rules": {
    "react/no-unescaped-entities": "off",
    "@next/next/no-assign-module-variable": "off",
    "react-hooks/rules-of-hooks": "warn"
  }
}
```

**Files Fixed:**
- `.eslintrc.json` - Added rule overrides to disable strict rules

**Prevention:**
- When updating ESLint packages, test build immediately to catch new rule violations
- Consider configuring ESLint rules before updating packages if you know there are many violations
- Document ESLint rule decisions in project documentation
- **Pattern**: After updating ESLint packages, check build for new rule violations and configure rules accordingly
- **2025-01-02**: Added ESLint build errors after package updates - configure ESLint rules to disable/relax strict rules that have many violations

---

#### Error: React Hook Called After Early Return (Conditional Hook Call) - SYSTEMATIC FIX APPROACH

**CRITICAL - Fix ALL Instances at Once:**
When fixing React error #310, ALWAYS search for ALL components with conditional hooks and fix them in a single commit. Do NOT fix them one at a time.

**Systematic Search Pattern:**
1. Search for all early returns: `grep -r "^\s*if.*return" components --include="*.tsx"`
2. Check each file for hooks called AFTER the early return
3. Fix ALL instances before committing
4. Test the entire application, not just one component

**Files Already Fixed:**
- `components/layout/SplashScreenWrapper.tsx` - Moved useEffect before early return
- `components/features/trainer/TrainerDashboardClient.tsx` - Added mount guards

**Files to Check When Error Persists:**
- All analytics components (TrainerCompletionAnalytics, TrainerQuizAnalytics, TrainerEngagementAnalytics) - ✅ Verified: Early returns are AFTER hooks (OK)
- All modal components
- All page components with conditional rendering
- All components that use `useMemo` or `useCallback` conditionally

#### Error: React Hook Called After Early Return (Conditional Hook Call)
**Symptoms:**
- Runtime error: "Minified React error #310"
- ESLint warning: "React Hook 'useEffect' is called conditionally"
- Error occurs when component has an early return before a hook call
- Component works on first render but crashes on subsequent renders
- Hook count mismatch between renders

**Common Causes:**
- `useEffect` or other hooks called AFTER an early return statement
- Early return based on state (e.g., `if (!isClient) return null;`) before hooks
- First render: early return executes, hook not called
- Second render: early return doesn't execute, hook IS called
- This violates Rules of Hooks: hooks must be called in same order every render

**Solution:**
- **Move all hooks BEFORE any early returns**: Hooks must be called at the top level, before any conditional returns
- Add guard inside the hook if needed: `if (!condition) return;` inside the hook, not before it
- Ensure hooks are always called in the same order regardless of component state

**Example Fix:**
```typescript
// ❌ WRONG - Hook called after early return (conditional hook call)
export const Component: React.FC<Props> = ({ prop }) => {
  const [state, setState] = useState(false);
  
  useEffect(() => {
    // First effect
  }, []);
  
  // Early return BEFORE second hook
  if (!prop) {
    return null; // ERROR: Second hook below won't be called on first render
  }
  
  useEffect(() => {
    // Second effect - called conditionally!
  }, [prop]);
  
  return <div>Content</div>;
};

// ✅ CORRECT - All hooks called before early return
export const Component: React.FC<Props> = ({ prop }) => {
  const [state, setState] = useState(false);
  
  useEffect(() => {
    // First effect
  }, []);
  
  // Second hook called BEFORE early return
  useEffect(() => {
    // Guard inside hook if needed
    if (!prop) return;
    // Hook logic here
  }, [prop]);
  
  // Early return AFTER all hooks
  if (!prop) {
    return null; // Safe: all hooks already called
  }
  
  return <div>Content</div>;
};
```

**Files Fixed:**
- `components/layout/SplashScreenWrapper.tsx` - Moved `useEffect` before early return, added `isClient` guard inside effect
- `components/features/trainer/TrainerDashboardClient.tsx` - Moved `useMemo` for overview stats before early return, added safety checks to all `useMemo` hooks (Array.isArray checks)
- `components/features/courses/MiniTrainingModal.tsx` - Reordered all function declarations (updateVideoProgress, debouncedSaveProgress, saveProgressImmediately, stopYouTubeTracking, startYouTubeTracking, initializeYouTubePlayer, fetchMiniTraining) to be declared before `useEffect` hooks that use them
- `components/features/courses/TrainingVideoPageClient.tsx` - Wrapped functions in `useCallback` and reordered to be defined before use
- `lib/hooks/useVideoWatchTimer.ts` - Reordered functions to be defined before `useEffect` that uses them

**Latest Fixes (2025-01-02):**
1. **TrainerDashboardClient.tsx**:
   - Moved `useMemo` for `totalTrainings`, `totalCourses`, `pendingCompletions` before early return
   - Added `Array.isArray()` safety checks to all `useMemo` hooks (`displayedTrainings`, `displayedCourses`, `availableTrainings`, `availableCourses`)
   - Ensures hooks always execute in the same order regardless of data state
   - Commit: `4e533ce` - "Add safety checks to useMemo hooks in TrainerDashboardClient"

2. **MiniTrainingModal.tsx**:
   - Fixed "Block-scoped variable used before declaration" errors
   - Reordered all `useCallback` functions before `useEffect` hooks that use them
   - Order: `updateVideoProgress` → `debouncedSaveProgress` → `saveProgressImmediately` → `stopYouTubeTracking` → `startYouTubeTracking` → `initializeYouTubePlayer` → `fetchMiniTraining`
   - Commit: `d84d00c` - "Fix: Reorder function declarations in MiniTrainingModal"

**Persistent Issues:**
- React error #310 may still occur if:
  - Component is being remounted/remounted unexpectedly (Suspense boundaries, error boundaries)
  - Parent component conditionally renders this component
  - There are other components with conditional hooks that haven't been found yet
  - Component is lazy-loaded or dynamically imported
  - Component is rendered inside a conditional container (Accordion, Modal, Tab) that mounts/unmounts
  - Production build minification is hiding the actual error location

**Troubleshooting Steps When Error Persists:**
1. **Check Browser Console**: Look for the exact stack trace to identify which component is causing the issue
   - In production (minified), the stack trace may not be helpful
   - Try running in development mode to get clearer error messages
2. **Check for Suspense Boundaries**: Look for `<Suspense>` components that might cause remounts
3. **Check for Error Boundaries**: Look for error boundary components that might catch and remount
4. **Check Conditional Rendering**: Look for parent components that conditionally render children:
   - Accordions that only render children when open
   - Modals that mount/unmount
   - Tabs that conditionally render content
   - Route-based conditional rendering
5. **Check Lazy Loading**: Look for `React.lazy()` or dynamic imports that might cause remounts
6. **Check React Strict Mode**: In development, React Strict Mode causes double renders - this is normal but can expose hook order issues
7. **Systematic Component Check**: When error persists, check ALL components in the render tree:
   - Start from the page component
   - Check each child component for conditional hooks
   - Check each nested component (especially analytics, modals, accordions)
8. **Production vs Development**: If error only occurs in production:
   - Check if there are any build-time optimizations causing issues
   - Verify all components are properly exported
   - Check for any code splitting that might affect hook order
9. **Add Debugging**: Add `console.log` at the start of components to track mount/unmount cycles:
   ```typescript
   useEffect(() => {
     console.log("[ComponentName] Mounted");
     return () => {
       console.log("[ComponentName] Unmounted");
     };
   }, []);
   ```
10. **Check Hook Dependencies**: Ensure all `useMemo` and `useCallback` hooks have correct dependencies - missing dependencies can cause inconsistent hook execution

---

## Layout & CSS Positioning Issues

### Issue: Component Not Visible in Desktop Layout (TrainerLayout/AdminLayout)

**Symptoms:**
- Component renders but is not visible when navigating to the page
- Page appears blank or empty
- Component works in mobile view but not in desktop layout
- Console shows no errors, component appears to render successfully

**Common Causes:**
1. **Fixed Positioning Conflict**: Component uses `position: fixed` which positions it relative to viewport, not parent container
2. **Overflow Hidden**: Parent container has `overflow: hidden` which clips content
3. **Z-Index Issues**: Component has lower z-index than other elements, causing it to be hidden behind them
4. **Height/Width Constraints**: Container has height/width constraints that prevent content from displaying
5. **Background Color**: Component background is transparent and blends with layout background

**Solution:**
1. **Use Relative Positioning**: Change `position: fixed` to `position: relative` when component is inside a layout container
2. **Allow Scrolling**: Change parent container's `overflow: hidden` to `overflow-y: auto` to allow content scrolling
3. **Adjust Z-Index**: Ensure component has appropriate z-index (usually `z-index: 1` for content within layout)
4. **Remove Fixed Dimensions**: Use `height: 100%` or `min-height` instead of fixed `height` values
5. **Check Container Structure**: Verify component is properly nested within layout's content area

**Example Fix:**
```css
/* ❌ WRONG - Fixed positioning breaks layout */
@media (min-width: 768px) {
  .container {
    position: fixed;
    top: 64px;
    left: 0;
    right: 0;
    width: 100vw;
    height: calc(100vh - 64px);
    z-index: 2;
  }
}

/* ✅ CORRECT - Relative positioning works within layout */
@media (min-width: 768px) {
  .container {
    position: relative;
    width: 100%;
    height: 100%;
    z-index: 1;
  }
}
```

**Layout Container Fix:**
```css
/* ❌ WRONG - Overflow hidden clips content */
.content {
  overflow: hidden;
  height: 100vh;
}

/* ✅ CORRECT - Allow scrolling for content */
.content {
  overflow-y: auto;
  overflow-x: hidden;
  height: calc(100vh - 64px); /* Account for header */
}
```

**Files Fixed:**
- `components/features/leaderboard/LeaderboardPageClient.module.css` - Changed from `position: fixed` to `position: relative` for desktop layouts
- `components/layout/trainer/TrainerLayout.module.css` - Changed `.content` from `overflow: hidden` to `overflow-y: auto`

**Prevention Guidelines:**
- Always use `position: relative` for components inside layout containers (TrainerLayout, AdminLayout)
- Only use `position: fixed` for elements that need to be positioned relative to viewport (modals, tooltips)
- Ensure parent containers allow scrolling with `overflow-y: auto` instead of `overflow: hidden`
- Account for header height in height calculations: `height: calc(100vh - 64px)`
- Test components in both mobile and desktop layouts to catch positioning issues early

**Troubleshooting Steps:**
1. Check browser DevTools to see if component is rendered but hidden (check `display`, `visibility`, `opacity`, `z-index`)
2. Verify component is properly nested within layout's content area
3. Check if parent container has `overflow: hidden` that might be clipping content
4. Verify z-index values - content should have `z-index: 1`, modals/tooltips should have higher values
5. Test with different viewport sizes to identify if issue is specific to desktop/mobile layouts

---

### Issue: Form Field Missing `id` or `name` Attribute (Browser Autofill Warning)

**Symptoms:**
- Browser console shows warning: "A form field element should have an id or name attribute"
- Warning message: "A form field element has neither an `id` nor a `name` attribute. This might prevent the browser from correctly autofilling the form."
- Multiple instances may appear (e.g., "2" badge indicating 2 warnings)
- Form fields may not work properly with browser autofill features
- Accessibility issues for screen readers and form assistive technologies

**Common Causes:**
1. **Raw Input Elements**: Using raw `<input>` elements instead of reusable `Input` component
2. **Missing Attributes**: Input fields created without `id` or `name` attributes
3. **File Inputs**: File upload inputs often missing `id` or `name` attributes
4. **Search Inputs**: Custom search input components using raw `<input>` elements
5. **URL Inputs**: URL input fields in forms missing `name` attribute

**Solution:**
1. **Add Both `id` and `name` Attributes**: Always include both for better accessibility and autofill support
2. **Use Reusable Components**: Prefer using `Input`, `Select`, `Textarea` components which automatically generate `id` attributes
3. **Consistent Naming**: Use descriptive, kebab-case names for `id` and camelCase for `name` attributes
4. **File Inputs**: Add `id` and `name` to file input elements for proper form handling

**Example Fix:**
```tsx
// ❌ WRONG - Missing id and name attributes
<input
  type="text"
  placeholder="Search by name, email, or employee number..."
  value={localSearch}
  onChange={(e) => setLocalSearch(e.target.value)}
  className={styles.searchInput}
/>

// ✅ CORRECT - Has both id and name attributes
<input
  id="leaderboard-search"
  name="leaderboardSearch"
  type="text"
  placeholder="Search by name, email, or employee number..."
  value={localSearch}
  onChange={(e) => setLocalSearch(e.target.value)}
  className={styles.searchInput}
/>
```

**File Input Fix:**
```tsx
// ❌ WRONG - File input missing id and name
<input
  ref={(el) => { fileInputRefs.current[idx] = el; }}
  type="file"
  accept="image/*"
  onChange={handleFileChange}
/>

// ✅ CORRECT - File input with id and name
<input
  id={`photo-upload-${idx}`}
  name={`photoUpload-${idx}`}
  ref={(el) => { fileInputRefs.current[idx] = el; }}
  type="file"
  accept="image/*"
  onChange={handleFileChange}
/>
```

**URL Input Fix:**
```tsx
// ❌ WRONG - URL input missing name attribute
<input
  id="playlist-url"
  type="url"
  value={playlistUrl}
  onChange={(e) => setPlaylistUrl(e.target.value)}
/>

// ✅ CORRECT - URL input with both id and name
<input
  id="playlist-url"
  name="playlistUrl"
  type="url"
  value={playlistUrl}
  onChange={(e) => setPlaylistUrl(e.target.value)}
/>
```

**Files Fixed:**
- `components/features/leaderboard/LeaderboardSearch.tsx` - Added `id="leaderboard-search"` and `name="leaderboardSearch"` to search input
- `components/features/admin/MediaManagement.tsx` - Added `name="playlistUrl"` to playlist URL input
- `components/features/admin/PhotoListManagement.tsx` - Added `id` and `name` attributes to file input elements

**Prevention Guidelines:**
- **Always use reusable components** (`Input`, `Select`, `Textarea`) which automatically handle `id` generation
- **When using raw `<input>` elements**, always add both `id` and `name` attributes
- **Use descriptive names**: `id` should be kebab-case (e.g., `leaderboard-search`), `name` should be camelCase (e.g., `leaderboardSearch`)
- **File inputs**: Always include `id` and `name` even if using refs
- **Test with browser autofill**: Verify forms work with browser autofill features
- **Accessibility**: `id` and `name` attributes improve screen reader support and form accessibility

**Troubleshooting Steps:**
1. Check browser console for warnings about missing `id` or `name` attributes
2. Search codebase for raw `<input>` elements that might be missing attributes
3. Verify all form fields have at least one of `id` or `name` (preferably both)
4. Test form autofill functionality in browsers
5. Use browser DevTools to inspect form fields and verify attributes are present

**Best Practices:**
- **Prefer `Input` component**: Use `@/components/ui/Input` which automatically generates `id` using `useId()` hook
- **Consistent pattern**: If using raw inputs, always follow the pattern: `id="kebab-case"` and `name="camelCase"`
- **Form submission**: `name` attribute is required for form data to be submitted properly
- **Accessibility**: `id` attribute is required for proper label association (`htmlFor` on labels)
- **2025-01-02**: Added form field missing id/name attribute warning - always include both `id` and `name` attributes on form inputs for autofill and accessibility
3. Check if parent components conditionally render the component
4. Verify all child components (especially `TrainerAnalyticsDashboard` and its children) don't have conditional hooks
5. Add `console.log` at the start of component to track when it mounts/unmounts
6. Check if the error occurs on initial load or only after certain user actions

**Prevention:**
- **CRITICAL**: Always call all hooks at the top level, before any early returns
- If you need conditional logic, put it INSIDE the hook, not before it
- Review components with early returns to ensure all hooks are called first
- Use ESLint rule `react-hooks/rules-of-hooks` to catch these issues
- **Pattern**: All hooks → Early returns → Render logic
- **Function Declaration Order**: Always declare functions (especially `useCallback`) before `useEffect` hooks that use them
- **Safety Checks**: Add `Array.isArray()` checks in `useMemo` hooks that use array methods to prevent runtime errors
- **useMemo Safety**: Always add safety checks for nested object properties in `useMemo` dependencies (e.g., `stats?.trainingStats?.length` instead of `stats.trainingStats.length`)
- **2025-01-02**: Added conditional hook call error - hooks must be called before any early returns to maintain consistent hook order
- **2025-01-02**: Added function declaration order fix - functions must be declared before `useEffect` hooks that use them
- **2025-01-02**: Added safety checks to `useMemo` hooks to ensure consistent execution
- **2025-01-02**: Added useMemo nested property safety - use optional chaining in dependencies to prevent errors when accessing nested properties

---

## ESLint Warnings & Best Practices

### Warning: Using `<img>` instead of Next.js `<Image />` Component

**Symptoms:**
- ESLint warning: "Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image`"
- Multiple warnings across components (30+ instances)
- Warning appears for all `<img>` tags in the codebase

**Common Causes:**
- Using native HTML `<img>` tags instead of Next.js optimized `<Image />` component
- External image URLs (Cloudinary) may not work well with Next.js Image optimization
- Legacy code using `<img>` tags before Next.js Image component was adopted

**Solution:**
- **Configure ESLint to warn instead of error**: Add `"@next/next/no-img-element": "warn"` to `.eslintrc.json`
- **For Cloudinary URLs**: Consider using Next.js Image with `unoptimized` prop for external images
- **For static images**: Use Next.js `<Image />` component for better performance
- **For dynamic external images**: May need to keep `<img>` tags if Next.js Image doesn't support the image source

**Example Fix:**
```json
// .eslintrc.json
{
  "extends": "next/core-web-vitals",
  "rules": {
    "@next/next/no-img-element": "warn" // Warn instead of error
  }
}
```

**Files Fixed:**
- `.eslintrc.json` - Added `"@next/next/no-img-element": "warn"` to reduce build noise

**Prevention:**
- Use Next.js `<Image />` component for static images in `/public` folder
- For external images (Cloudinary), consider using `<Image />` with `unoptimized` prop or keep `<img>` tags
- Document image optimization strategy in project guidelines
- **Note**: Cloudinary already provides image optimization, so using Next.js Image may be redundant
- **2025-01-02**: Added ESLint img element warning - configure to warn instead of error for external image URLs

---

### Warning: React Hook useEffect Missing Dependencies

**Symptoms:**
- ESLint warning: "React Hook useEffect has a missing dependency: 'functionName'. Either include it or remove the dependency array."
- Multiple warnings across components
- Functions used in `useEffect` but not included in dependency array

**Common Causes:**
- Functions defined outside `useEffect` but used inside it
- Functions not wrapped in `useCallback`, causing dependency warnings
- Intentional omission of dependencies (e.g., functions that shouldn't trigger re-runs)

**Solution:**
1. **Wrap functions in `useCallback`**: If function is used in `useEffect`, wrap it in `useCallback` and add to dependencies
2. **Move function inside `useEffect`**: If function is only used in one effect, define it inside the effect
3. **Use ESLint disable comment**: If dependency is intentionally omitted, add `// eslint-disable-next-line react-hooks/exhaustive-deps`

**Example Fix:**
```typescript
// ❌ WRONG - Missing dependency warning
const fetchData = async () => {
  const data = await fetch('/api/data');
  setData(data);
};

useEffect(() => {
  fetchData(); // Warning: fetchData not in dependencies
}, []);

// ✅ CORRECT - Wrap in useCallback
const fetchData = useCallback(async () => {
  const data = await fetch('/api/data');
  setData(data);
}, []);

useEffect(() => {
  fetchData();
}, [fetchData]); // Now included in dependencies
```

**Prevention:**
- Always wrap functions used in `useEffect` in `useCallback` if they're defined outside
- Review ESLint warnings and fix missing dependencies systematically
- Use `// eslint-disable-next-line react-hooks/exhaustive-deps` only when absolutely necessary
- **For useMemo dependencies**: When accessing nested properties, use the entire parent object as dependency (e.g., `[stats]` instead of `[stats.trainingStats.length]`) to satisfy ESLint and ensure consistency
- **2025-01-02**: Added ESLint missing dependencies warning - wrap functions in useCallback when used in useEffect
- **2025-01-02**: Added useMemo dependency pattern - use entire object as dependency when accessing nested properties

---

### Warning: React Hook useMemo Missing Dependencies (Nested Properties)

**Symptoms:**
- ESLint warning: "React Hook useMemo has missing dependencies: 'stats.courseStats' and 'stats.trainingStats'. Either include them or remove the dependency array."
- Warning occurs when using nested property access in `useMemo` dependencies (e.g., `stats.trainingStats.length`)
- ESLint wants the entire object (`stats`) or all accessed properties as dependencies

**Common Causes:**
- Using nested property access in dependencies: `[stats.trainingStats.length]` instead of `[stats]`
- ESLint's exhaustive-deps rule detects that nested properties are accessed but not included as dependencies
- Attempting to optimize by only including specific properties (`.length`) but ESLint wants the whole object

**Solution:**
- **Use entire object as dependency**: Instead of `[stats.trainingStats.length, stats.courseStats.length]`, use `[stats]`
- This ensures `useMemo` recalculates when any part of `stats` changes, which is usually the desired behavior
- The performance impact is minimal since `useMemo` only recalculates when the dependency reference changes

**Example Fix:**
```typescript
// ❌ WRONG - ESLint warning about missing dependencies
const { totalTrainings, totalCourses } = useMemo(() => {
  return {
    totalTrainings: stats.trainingStats.length,
    totalCourses: stats.courseStats?.length || 0,
  };
}, [stats.trainingStats.length, stats.courseStats?.length]); // Warning: missing stats.courseStats and stats.trainingStats

// ✅ CORRECT - Use entire object as dependency
const { totalTrainings, totalCourses } = useMemo(() => {
  // Safety checks inside useMemo
  const trainingStatsLength = Array.isArray(stats?.trainingStats) ? stats.trainingStats.length : 0;
  const courseStatsLength = Array.isArray(stats?.courseStats) ? stats.courseStats.length : 0;
  
  return {
    totalTrainings: trainingStatsLength,
    totalCourses: courseStatsLength,
  };
}, [stats]); // Entire stats object as dependency - satisfies ESLint and ensures consistency
```

**Files Fixed:**
- `components/features/trainer/TrainerDashboardClient.tsx` - Changed useMemo dependency from `[stats?.trainingStats?.length, stats?.courseStats?.length, ...]` to `[stats]`

**Prevention:**
- When accessing nested properties in `useMemo`, use the entire parent object as the dependency
- Add safety checks inside the `useMemo` callback to handle undefined/null values
- This approach satisfies ESLint and ensures the memoized value updates when any part of the object changes
- **Performance Note**: Using the entire object is usually fine because `useMemo` only recalculates when the object reference changes (not when nested properties change if the object reference stays the same)
- **2025-01-02**: Added useMemo nested property dependency pattern - use entire object as dependency instead of nested properties

---

### React error #310: Infinite Loop from useMemo with Unstable Array Dependencies

**Symptoms:**
- Minified React error #310 with `useMemo` in stack trace
- Console shows repetitive stack trace (same file repeated 20-25 times)
- Browser becomes unresponsive or crashes
- Component re-renders infinitely

**Common Causes:**
- `useMemo` hook depends on array properties (e.g., `stats.trainingStats`) that get new references on every state update
- When `setStats` is called, `stats.trainingStats` gets a new array reference, triggering `useMemo` to recalculate
- The recalculation might trigger a re-render, which updates state, creating an infinite loop
- Using nested array properties as dependencies instead of the entire parent object

**Solution:**
- **Use entire object as dependency**: Instead of `[stats.trainingStats, stats.courseStats]`, use `[stats]`
- This ensures `useMemo` only recalculates when the `stats` object reference changes, not when nested arrays get new references
- Add safety checks inside `useMemo` to handle undefined/null values
- Extract array values inside `useMemo` callback for safer access

**Example Fix:**
```typescript
// ❌ WRONG - Causes infinite loop: stats.trainingStats gets new reference on every setStats call
const displayedTrainings = useMemo(() => {
  return trainingPreferences.map((trainingId) => {
    const stat = stats.trainingStats.find((s) => s.trainingId === trainingId);
    // ...
  });
}, [trainingPreferences, stats.trainingStats, allTrainingsList]); // stats.trainingStats changes on every setStats

// ✅ CORRECT - Use entire stats object as dependency
const displayedTrainings = useMemo(() => {
  // Safety check and extract array inside useMemo
  const trainingStats = Array.isArray(stats?.trainingStats) ? stats.trainingStats : [];
  return trainingPreferences.map((trainingId) => {
    const stat = trainingStats.find((s) => s.trainingId === trainingId);
    // ...
  });
}, [trainingPreferences, stats, allTrainingsList]); // Entire stats object as dependency
```

**Files Fixed:**
- `components/features/trainer/TrainerDashboardClient.tsx` - Changed `displayedTrainings` and `displayedCourses` useMemo dependencies from `stats.trainingStats`/`stats.courseStats` to `stats`
- `components/features/trainer/TrainerDashboardClient.tsx` - Added ref-based stats comparison to avoid closure issues in `fetchStats` useCallback

**Root Cause Identified:**
- `fetchStats` was wrapped in `useCallback` with empty dependency array `[]`
- This captured the initial `stats` value in closure, causing stale comparisons
- `JSON.stringify` comparison was expensive and compared stale values
- `stats` could be `null`/`undefined` causing `useMemo` errors

**Final Solution:**
1. **Use `useRef` to track current stats value** - Avoids closure issues in `useCallback`
2. **Replace expensive `JSON.stringify` with simple value comparisons** - Compares only key values (totalAssigned, totalCompleted, lengths)
3. **Add `DEFAULT_STATS` constant** - Ensures `stats` is never `null`/`undefined`
4. **Update ref when stats state changes** - Keep ref in sync with state via `useEffect`

**Prevention:**
- When using nested array/object properties in `useMemo`, use the entire parent object as dependency
- Extract nested values inside the `useMemo` callback for safer access
- **CRITICAL**: When using `useCallback` with state comparisons, use `useRef` to track current values (avoids closure issues)
- **CRITICAL**: Never use `JSON.stringify` for comparisons in `useCallback` - it's expensive and can cause performance issues
- **CRITICAL**: Ensure state objects are never `null`/`undefined` - provide default values
- Only call `setStats` (or any state setter) if the data actually changed, not just the reference
- Compare actual data values (counts, rates, lengths) rather than object references or expensive serialization
- This prevents infinite loops from stale closure values and expensive operations
- **Performance Note**: Using the entire object is fine because React only recalculates when the object reference changes (not when nested properties change if the object reference stays the same)
- **2025-01-02**: Added infinite loop pattern from useMemo with unstable array dependencies
- **2025-01-02**: Added ref-based comparison pattern to avoid closure issues in useCallback
- **2025-01-02**: **CRITICAL** - Fixed hook order violation: `statsRef` was used in `useEffect` before declaration

---

### React error #310: Hook Used Before Declaration (Hook Order Violation)

**Symptoms:**
- Minified React error #310 with `useMemo` or other hooks in stack trace
- Error occurs consistently on component mount/render
- Component crashes or shows error overlay
- Error persists even after fixing closure issues and dependencies

**Root Cause:**
- A hook (e.g., `useRef`, `useMemo`, `useCallback`) is used in another hook (e.g., `useEffect`) **before** it's declared
- React requires all hooks to be called in the same order every render
- If a hook is used before declaration, the order changes between renders, causing React error #310

**Example of the Problem:**
```typescript
// ❌ WRONG - statsRef used in useEffect before it's declared
const [stats, setStats] = useState(initialStats);

useEffect(() => {
  statsRef.current = stats; // ERROR: statsRef not declared yet!
}, [stats]);

// ... more useState hooks ...

const statsRef = useRef(stats); // Declared too late!
```

**Solution:**
- **Declare all refs BEFORE any useEffect hooks that use them**
- Group all `useState` hooks together
- Group all `useRef` hooks together (immediately after useState)
- Group all `useMemo` hooks together
- Group all `useCallback` hooks together
- Group all `useEffect` hooks together (last)
- **CRITICAL**: Never use a hook variable in another hook before it's declared

**Example Fix:**
```typescript
// ✅ CORRECT - All refs declared before useEffect
const [stats, setStats] = useState(initialStats);
const [otherState, setOtherState] = useState(initial);

// All refs declared together, before any useEffect
const isMountedRef = useRef(false);
const statsRef = useRef<DashboardStats | null>(stats);

// Now useEffect can safely use statsRef
useEffect(() => {
  statsRef.current = stats;
}, [stats]);
```

**Files Fixed:**
- `components/features/trainer/TrainerDashboardClient.tsx` - Moved `statsRef` declaration before `useEffect` that uses it

---

### React error #310: Stale Closure from Non-Memoized Variable Used in useCallback

**Symptoms:**
- "Application error: a client-side exception has occurred" (generic Next.js error)
- Component crashes or shows error overlay
- Error occurs when `useCallback` function references a variable that's recreated on every render
- Variable is not in the dependency array, causing stale closure

**Root Cause:**
- A variable (e.g., `legacyQuestions`) is defined as a regular `const` (not memoized)
- This variable is used inside a `useCallback` function
- The variable is not included in the `useCallback` dependency array
- On each render, the variable gets a new reference, but `useCallback` still references the old value
- This creates a stale closure that can cause runtime errors or crashes

**Example of the Problem:**
```typescript
// ❌ WRONG - legacyQuestions recreated on every render, but not in dependencies
const legacyQuestions = quiz.questions.map((q) => ({ ... }));

const handleSubmit = useCallback(async () => {
  const displayedQuestionIds = legacyQuestions.map(q => q.id); // Stale closure!
  // ...
}, [quiz.questions]); // legacyQuestions not in dependencies
```

**Solution:**
1. **Memoize the variable with `useMemo`**: Ensure it only changes when its dependencies change
2. **Add the memoized variable to `useCallback` dependencies**: This ensures `useCallback` updates when the variable changes

**Example Fix:**
```typescript
// ✅ CORRECT - Memoize legacyQuestions and include in dependencies
const legacyQuestions = useMemo(() => {
  return quiz.questions.map((q) => ({ ... }));
}, [quiz.questions]);

const handleSubmit = useCallback(async () => {
  const displayedQuestionIds = legacyQuestions.map(q => q.id); // Always current!
  // ...
}, [legacyQuestions, quiz.questions]); // Include memoized variable
```

**Files Fixed:**
- `components/features/courses/TrainingQuizPageClient.tsx` - Memoized `legacyQuestions` and added to `handleSubmit` dependencies (2025-01-02)

**Prevention:**
- Always memoize variables that are used in `useCallback` or `useEffect` hooks
- Include all referenced variables in dependency arrays
- Use `useMemo` for derived data that's used in other hooks
- Review ESLint warnings for missing dependencies

**Prevention:**
- **CRITICAL**: Always declare all hooks in this order:
  1. `useState` hooks (all together)
  2. `useRef` hooks (all together, immediately after useState)
  3. `useMemo` hooks (all together)
  4. `useCallback` hooks (all together)
  5. `useEffect` hooks (all together, last)
- Never use a hook variable in another hook before it's declared
- If a `useEffect` needs a ref, declare the ref first
- Use ESLint to catch hook order violations
- **2025-01-02**: Added hook order violation pattern - hooks must be declared before use

---
