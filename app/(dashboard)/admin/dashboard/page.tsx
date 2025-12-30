/**
 * Admin Dashboard Page - DESKTOP ONLY
 * 
 * This page uses UserManagementTabs and UsersTable components which are
 * desktop-optimized and should NOT be used on mobile devices.
 * 
 * For Regional/Area/Branch Managers, use ManagementPage component which
 * is mobile-first (320px-428px viewport).
 */
import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma/client";
import { Card, CardBody } from "@/components/ui/Card";
import { AdminLayout } from "@/components/layout/admin/AdminLayout";

export const dynamic = 'force-dynamic';
import { StatsCard } from "@/components/features/admin/StatsCard";
import { AdminDashboardClient } from "@/components/features/admin/AdminDashboardClient";
import styles from "./page.module.css";

export default async function AdminDashboardPage() {
  console.log("[AdminDashboard] Page component started");
  
  // Get user - if this fails, middleware should have caught it
  // But we'll handle gracefully to prevent redirect loops
  let user;
  try {
    user = await getCurrentUser();
    console.log("[AdminDashboard] User retrieved:", { id: user?.id, role: user?.role });
  } catch (authError) {
    console.error("[AdminDashboard] Error getting current user:", authError);
    // If middleware allowed access but getCurrentUser fails, show error UI instead of redirecting
    // This prevents redirect loops
    return (
      <div style={{ padding: "var(--spacing-lg)", textAlign: "center" }}>
        <h2 style={{ color: "var(--color-error)", marginBottom: "var(--spacing-md)" }}>
          Authentication Error
        </h2>
        <p style={{ color: "var(--color-text-secondary)", marginBottom: "var(--spacing-md)" }}>
          Unable to verify your session. Please try refreshing the page.
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: "var(--spacing-sm) var(--spacing-md)",
            background: "var(--color-primary-purple)",
            color: "white",
            border: "none",
            borderRadius: "var(--radius-md)",
            cursor: "pointer",
          }}
        >
          Refresh Page
        </button>
      </div>
    );
  }

  if (!user) {
    console.error("[AdminDashboard] User is null - middleware should have prevented this");
    // Show error UI instead of redirecting to prevent loops
    return (
      <div style={{ padding: "var(--spacing-lg)", textAlign: "center" }}>
        <h2 style={{ color: "var(--color-error)", marginBottom: "var(--spacing-md)" }}>
          Session Not Found
        </h2>
        <p style={{ color: "var(--color-text-secondary)", marginBottom: "var(--spacing-md)" }}>
          Your session could not be found. Please log in again.
        </p>
        <a
          href="/login"
          style={{
            display: "inline-block",
            padding: "var(--spacing-sm) var(--spacing-md)",
            background: "var(--color-primary-purple)",
            color: "white",
            textDecoration: "none",
            borderRadius: "var(--radius-md)",
          }}
        >
          Go to Login
        </a>
      </div>
    );
  }

  // Role check - only ADMIN and SUPER_ADMIN can access
  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
    console.log("[AdminDashboard] User role mismatch:", user.role);
    // Middleware should have handled this, but if we get here, redirect once
    const roleRedirects: Record<string, string> = {
      REGIONAL_MANAGER: "/employee/regional-manager/dashboard",
      AREA_MANAGER: "/employee/area-manager/dashboard",
      BRANCH_MANAGER: "/employee/branch-manager/dashboard",
      EMPLOYEE: "/employee/staff/dashboard",
      TRAINER: "/employee/trainer/dashboard",
    };
    
    const redirectUrl = roleRedirects[user.role] || "/login";
    console.log("[AdminDashboard] Redirecting to:", redirectUrl);
    redirect(redirectUrl);
  }

  try {

    // Validate user properties
    if (!user.name || !user.email) {
      console.error("[AdminDashboard] User missing required fields:", {
        hasName: !!user.name,
        hasEmail: !!user.email,
        userId: user.id,
        userRole: user.role,
      });
      throw new Error("User data is incomplete - missing name or email");
    }

    // Fetch stats only for dashboard analytics
    let totalUsers = 0;
    let rejectedUsers = 0;
    let pendingUsers = 0;
    
    try {
      console.log("[AdminDashboard] Fetching dashboard analytics for admin:", user.id);
      [totalUsers, rejectedUsers, pendingUsers] = await Promise.all([
        // Get total counts for stats
        prisma.user.count({ where: { status: "APPROVED" } }),
        prisma.user.count({ where: { status: "REJECTED" } }),
        prisma.user.count({ where: { status: "PENDING" } }),
      ]);
      
      console.log("[AdminDashboard] Successfully fetched dashboard analytics:", {
        totalUsers,
        rejectedUsers,
        pendingUsers,
      });
    } catch (dbError) {
      // Enhanced error logging
      const errorDetails = dbError instanceof Error 
        ? { message: dbError.message, stack: dbError.stack, name: dbError.name }
        : { error: String(dbError) };
      
      console.error("[AdminDashboard] Error fetching dashboard analytics:", {
        userId: user.id,
        userRole: user.role,
        error: errorDetails,
        timestamp: new Date().toISOString(),
      });
      
      // Use empty defaults if database query fails (graceful degradation)
      totalUsers = 0;
      rejectedUsers = 0;
      pendingUsers = 0;
    }

    // Final validation before render
    if (!user || !user.name || !user.email) {
      throw new Error("User data is missing or incomplete - cannot render dashboard");
    }

    // Safe property access with explicit conversion
    const safeUserName = String(user.name || 'Admin');
    const safeUserEmail = String(user.email || '');
    const safeUserAvatar = user.avatar ? String(user.avatar) : null;
    const safeUserRole = (user.role === "ADMIN" || user.role === "SUPER_ADMIN") 
      ? user.role as "ADMIN" | "SUPER_ADMIN"
      : "ADMIN";

    console.log("[AdminDashboard] Final render check:", {
      hasUser: !!user,
      hasUserName: !!user.name,
      hasUserEmail: !!user.email,
      totalUsers,
      pendingUsers,
      rejectedUsers,
    });

    return (
      <AdminLayout
        userRole={safeUserRole}
        userName={safeUserName}
        userEmail={safeUserEmail}
        userAvatar={safeUserAvatar}
        pageTitle="Dashboard"
        pageDescription="Overview of users and system statistics."
      >
        <AdminDashboardClient
          initialStats={{
            totalUsers: typeof totalUsers === 'number' ? totalUsers : 0,
            rejectedUsers: typeof rejectedUsers === 'number' ? rejectedUsers : 0,
            pendingUsers: typeof pendingUsers === 'number' ? pendingUsers : 0,
          }}
        />
      </AdminLayout>
    );
  } catch (error) {
    // Enhanced error logging that works in production
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    const errorDigest = error && typeof error === 'object' && 'digest' in error ? String((error as any).digest) : undefined;
    
    // Log to console (visible in Vercel logs)
    console.error("[AdminDashboard] CRITICAL ERROR:", {
      message: errorMessage,
      stack: errorStack,
      digest: errorDigest,
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      timestamp: new Date().toISOString(),
    });
    
    // Check if it's a Next.js redirect error - let those through
    if (errorDigest?.includes('NEXT_REDIRECT')) {
      // This is a Next.js redirect - let it through
      throw error;
    }
    
    // For other errors, show error UI with more details
    // In production, Next.js hides error messages, so we'll show a user-friendly message
    // but log the actual error to console/Vercel logs
    const userFriendlyMessage = process.env.NODE_ENV === 'production'
      ? "An error occurred while loading the dashboard. Please try refreshing the page. If the problem persists, contact support."
      : errorMessage;
    
    return (
      <div style={{ padding: "var(--spacing-lg)", textAlign: "center" }}>
        <h2 style={{ color: "var(--color-error)", marginBottom: "var(--spacing-md)" }}>
          Dashboard Error
        </h2>
        <p style={{ color: "var(--color-text-secondary)", marginBottom: "var(--spacing-md)" }}>
          {userFriendlyMessage}
        </p>
        {errorDigest && (
          <p style={{ 
            color: "var(--color-text-secondary)", 
            fontSize: "var(--font-size-xs)",
            marginBottom: "var(--spacing-md)",
            fontFamily: "monospace"
          }}>
            Error ID: {errorDigest}
          </p>
        )}
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: "var(--spacing-sm) var(--spacing-md)",
            background: "var(--color-primary-purple)",
            color: "white",
            border: "none",
            borderRadius: "var(--radius-md)",
            cursor: "pointer",
          }}
        >
          Refresh Page
        </button>
      </div>
    );
  }
}
