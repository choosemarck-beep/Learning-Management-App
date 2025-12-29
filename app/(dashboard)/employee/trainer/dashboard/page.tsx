import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma/client";
import { TrainerLayout } from "@/components/layout/trainer/TrainerLayout";
import { TrainerDashboardClient } from "@/components/features/trainer/TrainerDashboardClient";
import styles from "./page.module.css";

export const dynamic = 'force-dynamic';

export default async function TrainerDashboardPage() {
  console.log("[TrainerDashboardPage] Page component started");
  
  // Get user - if this fails, middleware should have caught it
  // But we'll handle gracefully to prevent redirect loops
  let user;
  try {
    user = await getCurrentUser();
    console.log("[TrainerDashboardPage] User retrieved:", { id: user?.id, role: user?.role });
  } catch (authError) {
    console.error("[TrainerDashboardPage] Error getting current user:", authError);
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
    console.error("[TrainerDashboardPage] User is null - middleware should have prevented this");
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

  // Role check - only TRAINER can access
  // If role doesn't match, middleware should have redirected, but handle it gracefully
  if (user.role !== "TRAINER") {
    console.log("[TrainerDashboardPage] User role mismatch:", user.role);
    // Middleware should have handled this, but if we get here, redirect once
    // Use a direct redirect that won't loop
    const roleRedirects: Record<string, string> = {
      REGIONAL_MANAGER: "/employee/regional-manager/dashboard",
      AREA_MANAGER: "/employee/area-manager/dashboard",
      BRANCH_MANAGER: "/employee/branch-manager/dashboard",
      EMPLOYEE: "/employee/staff/dashboard",
      SUPER_ADMIN: "/super-admin/dashboard",
      ADMIN: "/admin/dashboard",
    };
    
    const redirectUrl = roleRedirects[user.role] || "/login";
    console.log("[TrainerDashboardPage] Redirecting to:", redirectUrl);
    redirect(redirectUrl);
  }

  try {
    // Fetch full user data from database with error handling
    let userData: {
      id: string;
      avatar: string | null;
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
      userData = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          avatar: true, // Explicitly select avatar
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
    } catch (dbError) {
      // Enhanced error logging with more context
      const errorDetails = dbError instanceof Error 
        ? { message: dbError.message, stack: dbError.stack, name: dbError.name }
        : { error: String(dbError) };
      
      console.error("[TrainerDashboardPage] Error fetching trainer user data:", {
        userId: user.id,
        userRole: user.role,
        error: errorDetails,
        timestamp: new Date().toISOString(),
      });
      
      // Don't redirect - show error UI instead to prevent loops
      throw new Error(`Failed to load user data from database: ${errorDetails.message || 'Unknown database error'}`);
    }

    if (!userData) {
      console.error("[TrainerDashboardPage] User data is null after fetch");
      throw new Error("User data not found in database");
    }

    // Fetch all trainings and courses with error handling
    let allTrainings: Array<{
      id: string;
      title: string;
      course?: { id: string; title: string };
    }> = [];
    let allCourses: Array<{
      id: string;
      title: string;
      description: string;
      thumbnail: string | null;
      _count: { trainings: number };
    }> = [];
    let preferences: { trainingIds: string[]; courseIds: string[] } | null = null;
    
    try {
      console.log("[TrainerDashboardPage] Fetching trainings and courses for trainer:", user.id);
      const [rawTrainings, rawCourses, rawPreferences] = await Promise.all([
        // Fetch all trainings created by this trainer (from courses)
        prisma.training.findMany({
          where: {
            createdBy: user.id,
          },
          select: {
            id: true,
            title: true,
            course: {
              select: {
                id: true,
                title: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        }),
        // Fetch all courses created by this trainer
        prisma.course.findMany({
          where: {
            createdBy: user.id,
          },
          select: {
            id: true,
            title: true,
            description: true,
            thumbnail: true,
            _count: {
              select: {
                trainings: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        }),
        // Fetch dashboard preferences
        prisma.trainerDashboardPreferences.findUnique({
          where: {
            trainerId: user.id,
          },
          select: {
            trainingIds: true,
            courseIds: true,
          },
        }),
      ]);

      // Convert null to undefined for course (to match component interface)
      allTrainings = rawTrainings.map((training) => ({
        id: training.id,
        title: training.title,
        course: training.course || undefined,
      }));

      // Convert null description to empty string (to match component interface)
      allCourses = rawCourses.map((course) => ({
        id: course.id,
        title: course.title,
        description: course.description || "",
        thumbnail: course.thumbnail,
        _count: course._count,
      }));

      preferences = rawPreferences;
      
      console.log("[TrainerDashboardPage] Successfully fetched dashboard data:", {
        trainingsCount: allTrainings.length,
        coursesCount: allCourses.length,
        hasPreferences: !!preferences,
      });
    } catch (dbError) {
      // Enhanced error logging
      const errorDetails = dbError instanceof Error 
        ? { message: dbError.message, stack: dbError.stack, name: dbError.name }
        : { error: String(dbError) };
      
      console.error("[TrainerDashboardPage] Error fetching trainer dashboard data:", {
        userId: user.id,
        error: errorDetails,
        timestamp: new Date().toISOString(),
      });
      
      // Use empty defaults if database query fails
      allTrainings = [];
      allCourses = [];
      preferences = null;
      
      // Don't throw - allow page to render with empty data rather than 500 error
      // The client component will handle empty state gracefully
    }

    const trainingIds = preferences?.trainingIds || [];
    const courseIds = preferences?.courseIds || [];

    // Calculate stats for all trainings using TrainingProgressNew with error handling
    const trainingIdsForStats = allTrainings.map((t) => t.id);

    let overallCompletionRate = 0;
    let totalAssigned = 0;
    let totalCompleted = 0;
    const trainingStats: Array<{
      trainingId: string;
      title: string;
      courseTitle?: string;
      completionRate: number;
      totalAssigned: number;
      totalCompleted: number;
    }> = [];

    if (trainingIdsForStats.length > 0) {
      try {
        // Count total TrainingProgressNew records
        totalAssigned = await prisma.trainingProgressNew.count({
          where: {
            trainingId: { in: trainingIdsForStats },
          },
        });

        // Count completed TrainingProgressNew records
        totalCompleted = await prisma.trainingProgressNew.count({
          where: {
            trainingId: { in: trainingIdsForStats },
            isCompleted: true,
          },
        });

        // Calculate overall completion rate
        overallCompletionRate =
          totalAssigned > 0 ? (totalCompleted / totalAssigned) * 100 : 0;

        // Get per-training stats
        for (const training of allTrainings) {
          try {
            const assigned = await prisma.trainingProgressNew.count({
              where: {
                trainingId: training.id,
              },
            });

            const completed = await prisma.trainingProgressNew.count({
              where: {
                trainingId: training.id,
                isCompleted: true,
              },
            });

            const completionRate = assigned > 0 ? (completed / assigned) * 100 : 0;

            trainingStats.push({
              trainingId: training.id,
              title: training.title,
              courseTitle: training.course?.title,
              completionRate: Math.round(completionRate * 100) / 100,
              totalAssigned: assigned,
              totalCompleted: completed,
            });
          } catch (statError) {
            console.error(`Error fetching stats for training ${training.id}:`, statError);
            // Continue with next training
          }
        }
      } catch (statsError) {
        console.error("Error calculating training stats:", statsError);
        // Use defaults (already set to 0)
      }
    }

  const initialStats = {
    overallCompletionRate: Math.round(overallCompletionRate * 100) / 100,
    totalAssigned,
    totalCompleted,
    trainingStats,
  };

  // Log data being passed to client component for debugging
  console.log("[TrainerDashboardPage] Rendering dashboard with:", {
    statsCount: initialStats.trainingStats.length,
    trainingIdsCount: trainingIds.length,
    courseIdsCount: courseIds.length,
    allTrainingsCount: allTrainings.length,
    allCoursesCount: allCourses.length,
    userId: user.id,
    userRole: user.role,
  });

  // Ensure all required data is present before rendering
  if (!initialStats || !Array.isArray(allTrainings) || !Array.isArray(allCourses)) {
    console.error("[TrainerDashboardPage] Missing required data:", {
      hasInitialStats: !!initialStats,
      allTrainingsIsArray: Array.isArray(allTrainings),
      allCoursesIsArray: Array.isArray(allCourses),
    });
    throw new Error("Failed to load dashboard data");
  }

    // Final validation before render - comprehensive checks
    if (!user) {
      throw new Error("User is missing - cannot render dashboard");
    }
    
    if (!user.name || !user.email) {
      console.error("[TrainerDashboardPage] User missing required fields:", {
        hasName: !!user.name,
        hasEmail: !!user.email,
        userId: user.id,
        userRole: user.role,
      });
      throw new Error("User data is incomplete - missing name or email");
    }
    
    if (!userData) {
      throw new Error("User data from database is missing - cannot render dashboard");
    }
    
    if (!initialStats || !Array.isArray(allTrainings) || !Array.isArray(allCourses)) {
      throw new Error("Dashboard data is incomplete - cannot render dashboard");
    }
    
    // Ensure trainingIds and courseIds are arrays
    const safeTrainingIds = Array.isArray(trainingIds) ? trainingIds : [];
    const safeCourseIds = Array.isArray(courseIds) ? courseIds : [];
    
    // Ensure all data is serializable (no functions, Date objects, etc.)
    const serializableStats = {
      overallCompletionRate: typeof initialStats.overallCompletionRate === 'number' 
        ? initialStats.overallCompletionRate 
        : 0,
      totalAssigned: typeof initialStats.totalAssigned === 'number' 
        ? initialStats.totalAssigned 
        : 0,
      totalCompleted: typeof initialStats.totalCompleted === 'number' 
        ? initialStats.totalCompleted 
        : 0,
      trainingStats: Array.isArray(initialStats.trainingStats)
        ? initialStats.trainingStats.map(stat => ({
            trainingId: String(stat.trainingId),
            title: String(stat.title || ''),
            courseTitle: stat.courseTitle ? String(stat.courseTitle) : undefined,
            completionRate: typeof stat.completionRate === 'number' ? stat.completionRate : 0,
            totalAssigned: typeof stat.totalAssigned === 'number' ? stat.totalAssigned : 0,
            totalCompleted: typeof stat.totalCompleted === 'number' ? stat.totalCompleted : 0,
          }))
        : [],
    };
    
    // Ensure all trainings and courses are serializable
    const serializableTrainings = allTrainings.map(training => ({
      id: String(training.id),
      title: String(training.title || ''),
      course: training.course ? {
        id: String(training.course.id),
        title: String(training.course.title || ''),
      } : undefined,
    }));
    
    const serializableCourses = allCourses.map(course => ({
      id: String(course.id),
      title: String(course.title || ''),
      description: String(course.description || ''),
      thumbnail: course.thumbnail ? String(course.thumbnail) : null,
      _count: {
        trainings: typeof course._count?.trainings === 'number' ? course._count.trainings : 0,
      },
    }));
    
    console.log("[TrainerDashboardPage] Final render check:", {
      hasUser: !!user,
      hasUserName: !!user.name,
      hasUserEmail: !!user.email,
      hasUserData: !!userData,
      hasInitialStats: !!initialStats,
      trainingIdsLength: safeTrainingIds.length,
      courseIdsLength: safeCourseIds.length,
      allTrainingsLength: serializableTrainings.length,
      allCoursesLength: serializableCourses.length,
      statsSerializable: !!serializableStats,
    });
    
    // Final safety check - ensure all required props are valid strings
    const safeUserName = String(user.name || 'Trainer');
    const safeUserEmail = String(user.email || '');
    const safeUserAvatar = userData.avatar ? String(userData.avatar) : null;
    
    return (
      <TrainerLayout
        userName={safeUserName}
        userEmail={safeUserEmail}
        userAvatar={safeUserAvatar}
        pageTitle="Dashboard"
        pageDescription="Overview of training completion rates and customizable dashboard."
      >
        <div className={styles.container}>
          <TrainerDashboardClient
            initialStats={serializableStats}
            initialTrainingPreferences={safeTrainingIds}
            initialCoursePreferences={safeCourseIds}
            allTrainings={serializableTrainings}
            allCourses={serializableCourses}
          />
        </div>
      </TrainerLayout>
    );
  } catch (error) {
    // Enhanced error logging that works in production
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    const errorDigest = error && typeof error === 'object' && 'digest' in error ? String((error as any).digest) : undefined;
    
    // Log to console (visible in Vercel logs)
    console.error("[TrainerDashboardPage] CRITICAL ERROR:", {
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

