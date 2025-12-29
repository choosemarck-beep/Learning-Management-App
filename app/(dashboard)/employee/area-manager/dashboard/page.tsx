import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/utils";

export const dynamic = 'force-dynamic';
import { prisma } from "@/lib/prisma/client";
import { OnboardingMessageWrapper } from "@/components/features/OnboardingMessageWrapper";
import { ProfileBottomNav } from "@/components/layout/ProfileBottomNav";
import { CarouselHeader } from "@/components/features/dashboard/CarouselHeader";
import { CarouselPlaceholder } from "@/components/features/dashboard/CarouselPlaceholder";
import { DashboardCoursesSection } from "@/components/features/dashboard/DashboardCoursesSection";
import { TrainerAnnouncementsSection } from "@/components/features/dashboard/TrainerAnnouncementsSection";
import styles from "./page.module.css";

export default async function AreaManagerDashboardPage() {
  console.log("[AreaManagerDashboard] Page component started");
  
  // Get user - if this fails, middleware should have caught it
  // But we'll handle gracefully to prevent redirect loops
  let user;
  try {
    user = await getCurrentUser();
    console.log("[AreaManagerDashboard] User retrieved:", { id: user?.id, role: user?.role });
  } catch (authError) {
    console.error("[AreaManagerDashboard] Error getting current user:", authError);
    // If middleware allowed access but getCurrentUser fails, show error UI instead of redirecting
    // This prevents redirect loops
    return (
      <div className={styles.container}>
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
      </div>
    );
  }

  if (!user) {
    console.error("[AreaManagerDashboard] User is null - middleware should have prevented this");
    // Show error UI instead of redirecting to prevent loops
    return (
      <div className={styles.container}>
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
      </div>
    );
  }

  // Role check - only AREA_MANAGER can access
  if (user.role !== "AREA_MANAGER") {
    console.log("[AreaManagerDashboard] User role mismatch:", user.role);
    // Middleware should have handled this, but if we get here, redirect once
    const roleRedirects: Record<string, string> = {
      REGIONAL_MANAGER: "/employee/regional-manager/dashboard",
      BRANCH_MANAGER: "/employee/branch-manager/dashboard",
      EMPLOYEE: "/employee/staff/dashboard",
      TRAINER: "/employee/trainer/dashboard",
      SUPER_ADMIN: "/super-admin/dashboard",
      ADMIN: "/admin/dashboard",
    };
    
    const redirectUrl = roleRedirects[user.role] || "/login";
    console.log("[AreaManagerDashboard] Redirecting to:", redirectUrl);
    redirect(redirectUrl);
  }

  try {
    // Fetch full user data from database with error handling
    let userData: {
      id: string;
      name: string;
      onboardingCompleted: boolean | null;
      courseProgresses?: Array<{
        course: {
          id: string;
          title: string;
          description: string | null;
          thumbnail: string | null;
          totalXP: number;
        };
        progress: number;
        isCompleted: boolean;
      }>;
    } | null = null;
    
    try {
      console.log(`[AreaManagerDashboard] Fetching user data for user ID: ${user.id}`);
      userData = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          name: true,
          onboardingCompleted: true,
          courseProgresses: {
            include: {
              course: {
                select: {
                  id: true,
                  title: true,
                  description: true,
                  thumbnail: true,
                  totalXP: true,
                },
              },
            },
          },
        },
      });
      console.log(`[AreaManagerDashboard] User data fetched successfully, courses: ${userData?.courseProgresses?.length || 0}`);
    } catch (dbError) {
      // Enhanced error logging with more context
      const errorDetails = dbError instanceof Error 
        ? { message: dbError.message, stack: dbError.stack, name: dbError.name }
        : { error: String(dbError) };
      
      console.error("[AreaManagerDashboard] Error fetching user data:", {
        userId: user.id,
        userRole: user.role,
        error: errorDetails,
        timestamp: new Date().toISOString(),
      });
      
      // Don't redirect - show error UI instead to prevent loops
      throw new Error(`Failed to load user data from database: ${errorDetails.message || 'Unknown database error'}`);
    }

    if (!userData) {
      console.error("[AreaManagerDashboard] User data is null after fetch");
      throw new Error("User data not found in database");
    }

    // Fetch carousel settings and data with error handling
  let mode: "PHOTO_CAROUSEL" | "VIDEO" = "PHOTO_CAROUSEL";
  let videoUrl: string | null = null;
  let carouselImages: Array<{
    id: string;
    imageUrl: string;
    title: string | null;
    description: string | null;
  }> = [];

  try {
    const carouselSettings = await prisma.carouselSettings.findFirst();
    if (carouselSettings) {
      mode = carouselSettings.mode || "PHOTO_CAROUSEL";
      videoUrl = carouselSettings.videoUrl || null;
    }

    // Fetch carousel images (only for photo carousel mode, limit to 4)
    if (mode === "PHOTO_CAROUSEL") {
      carouselImages = await prisma.carouselImage.findMany({
        where: { isActive: true },
        orderBy: { order: "asc" },
        take: 4,
        select: {
          id: true,
          imageUrl: true,
          title: true,
          description: true,
        },
      });
    }
  } catch (error) {
    // If carouselSettings model doesn't exist yet, default to photo carousel
    console.error("Error fetching carousel settings:", error);
    // Try to fetch images anyway
    try {
      carouselImages = await prisma.carouselImage.findMany({
        where: { isActive: true },
        orderBy: { order: "asc" },
        take: 4,
        select: {
          id: true,
          imageUrl: true,
          title: true,
          description: true,
        },
      });
    } catch (imageError) {
      console.error("Error fetching carousel images:", imageError);
    }
  }

    // Final validation before render
    if (!user || !userData) {
      throw new Error("User data is missing - cannot render dashboard");
    }
    
    if (!user.name || !user.email) {
      console.error("[AreaManagerDashboard] User missing required fields:", {
        hasName: !!user.name,
        hasEmail: !!user.email,
        userId: user.id,
        userRole: user.role,
      });
      throw new Error("User data is incomplete - missing name or email");
    }
    
    // Ensure courseProgresses is an array
    const courseProgresses = Array.isArray(userData.courseProgresses) ? userData.courseProgresses : [];
    
    // Serialize courses data - ensure all values are primitives
    const courses = courseProgresses.map((cp) => ({
      id: String(cp.course.id),
      title: String(cp.course.title || ''),
      description: String(cp.course.description || ''),
      thumbnail: cp.course.thumbnail ? String(cp.course.thumbnail) : null,
      totalXP: typeof cp.course.totalXP === 'number' ? cp.course.totalXP : 0,
      progress: typeof cp.progress === 'number' ? cp.progress : 0,
      isCompleted: typeof cp.isCompleted === 'boolean' ? cp.isCompleted : false,
    }));

    const onboardingCompleted = userData.onboardingCompleted || false;
    
    // Safe property access with explicit conversion
    const safeUserName = String(user.name || 'Area Manager');
    
    console.log("[AreaManagerDashboard] Final render check:", {
      hasUser: !!user,
      hasUserName: !!user.name,
      hasUserEmail: !!user.email,
      hasUserData: !!userData,
      coursesCount: courses.length,
      onboardingCompleted,
    });

    return (
      <div className={styles.container}>
        {/* Onboarding Message Modal */}
        <OnboardingMessageWrapper
          userName={safeUserName}
          onboardingCompleted={onboardingCompleted}
        />

      {/* Carousel Header */}
      {(mode === "VIDEO" && videoUrl) || (mode === "PHOTO_CAROUSEL" && carouselImages.length > 0) ? (
        <CarouselHeader
          mode={mode}
          images={carouselImages}
          videoUrl={videoUrl}
        />
      ) : (
        <CarouselPlaceholder />
      )}

      {/* Courses Section */}
      <DashboardCoursesSection courses={courses} />

      {/* Announcements Section */}
      <TrainerAnnouncementsSection />

      {/* Bottom Navigation */}
      <ProfileBottomNav
        userRole={user.role}
        dashboardRoute="/employee/area-manager/dashboard"
      />
    </div>
  );
  } catch (error) {
    // Enhanced error logging that works in production
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    const errorDigest = error && typeof error === 'object' && 'digest' in error ? String((error as any).digest) : undefined;
    
    // Log to console (visible in Vercel logs)
    console.error("[AreaManagerDashboard] CRITICAL ERROR:", {
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
      <div className={styles.container}>
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
      </div>
    );
  }
}

