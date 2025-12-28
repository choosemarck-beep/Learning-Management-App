import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const session = await auth();
  const pathname = request.nextUrl.pathname;

  // Helper function to get role-based redirect URL
  const getRoleBasedRedirect = (role: string | undefined) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "/super-admin/dashboard";
      case "ADMIN":
        return "/admin/dashboard";
      case "REGIONAL_MANAGER":
        return "/employee/regional-manager/dashboard";
      case "AREA_MANAGER":
        return "/employee/area-manager/dashboard";
      case "BRANCH_MANAGER":
        return "/employee/branch-manager/dashboard";
      case "EMPLOYEE":
        return "/employee/staff/dashboard";
      case "TRAINER":
        return "/employee/trainer/dashboard";
      default:
        return "/login"; // Default fallback
    }
  };

  // Protect staff dashboard - only EMPLOYEE
  if (pathname.startsWith("/employee/staff/dashboard")) {
    if (!session) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    const userRole = session?.user?.role;
    if (userRole !== "EMPLOYEE") {
      const redirectUrl = getRoleBasedRedirect(userRole);
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }
  }

  // Protect regional manager dashboard - only REGIONAL_MANAGER
  if (pathname.startsWith("/employee/regional-manager/dashboard")) {
    if (!session) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    const userRole = session?.user?.role;
    if (userRole !== "REGIONAL_MANAGER") {
      const redirectUrl = getRoleBasedRedirect(userRole);
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }
  }

  // Protect area manager dashboard - only AREA_MANAGER
  if (pathname.startsWith("/employee/area-manager/dashboard")) {
    if (!session) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    const userRole = session?.user?.role;
    if (userRole !== "AREA_MANAGER") {
      const redirectUrl = getRoleBasedRedirect(userRole);
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }
  }

  // Protect branch manager dashboard - only BRANCH_MANAGER
  if (pathname.startsWith("/employee/branch-manager/dashboard")) {
    if (!session) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    const userRole = session?.user?.role;
    if (userRole !== "BRANCH_MANAGER") {
      const redirectUrl = getRoleBasedRedirect(userRole);
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }
  }

  // Protect trainer dashboard - only TRAINER
  if (pathname.startsWith("/employee/trainer/dashboard")) {
    if (!session) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    const userRole = session?.user?.role;
    if (userRole !== "TRAINER") {
      const redirectUrl = getRoleBasedRedirect(userRole);
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }
  }

  // Protect branch manager management - only BRANCH_MANAGER
  if (pathname.startsWith("/employee/branch-manager/management")) {
    if (!session) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    const userRole = session?.user?.role;
    if (userRole !== "BRANCH_MANAGER") {
      const redirectUrl = getRoleBasedRedirect(userRole);
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }
  }

  // Protect area manager management - only AREA_MANAGER
  if (pathname.startsWith("/employee/area-manager/management")) {
    if (!session) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    const userRole = session?.user?.role;
    if (userRole !== "AREA_MANAGER") {
      const redirectUrl = getRoleBasedRedirect(userRole);
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }
  }

  // Protect regional manager management - only REGIONAL_MANAGER
  if (pathname.startsWith("/employee/regional-manager/management")) {
    if (!session) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    const userRole = session?.user?.role;
    if (userRole !== "REGIONAL_MANAGER") {
      const redirectUrl = getRoleBasedRedirect(userRole);
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }
  }

  // Protect employee profile page
  // Allow: EMPLOYEE/BRANCH_MANAGER (own profile), ADMIN/SUPER_ADMIN (any employee profile)
  if (pathname === "/employee/profile") {
    if (!session) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    const userRole = session?.user?.role;
    // Allow all authenticated users - page logic will handle access control
    // Employees/Branch Managers see own profile, Admins can view any employee
  }

  // Handle /admin route - redirect to /admin/dashboard
  if (pathname === "/admin") {
    if (!session) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", "/admin/dashboard");
      return NextResponse.redirect(loginUrl);
    }
    // Redirect to admin dashboard
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }

  // Protect admin dashboard - only ADMIN and SUPER_ADMIN
  if (pathname.startsWith("/admin/dashboard") || pathname.startsWith("/admin/")) {
    if (!session) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    const userRole = session?.user?.role;
    if (userRole !== "ADMIN" && userRole !== "SUPER_ADMIN") {
      // Redirect to appropriate page based on role
      const redirectUrl = getRoleBasedRedirect(userRole);
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }
  }

  // Protect super admin dashboard - only SUPER_ADMIN
  if (pathname.startsWith("/super-admin/dashboard")) {
    if (!session) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    const userRole = session?.user?.role;
    if (userRole !== "SUPER_ADMIN") {
      // Redirect to appropriate page based on role
      const redirectUrl = getRoleBasedRedirect(userRole);
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }
  }

  // Legacy dashboard route - redirect based on role
  if (pathname.startsWith("/dashboard")) {
    if (!session) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    // Redirect to role-based page
    const redirectUrl = getRoleBasedRedirect(session?.user?.role);
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  }

  // Redirect authenticated users away from auth pages
  if (
    session &&
    (pathname === "/login" || pathname === "/signup")
  ) {
    // Redirect to role-based page
    const redirectUrl = getRoleBasedRedirect(session?.user?.role);
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - root path (/) - allow through without middleware
     */
    "/((?!api|_next/static|_next/image|favicon.ico|^/$|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

