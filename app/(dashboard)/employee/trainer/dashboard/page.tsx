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

    // Fetch full user data from database with error handling
    let userData: {
      id: string;
      avatar: string | null;
      courseProgresses: Array<{
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
        include: {
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
      console.error("Error fetching trainer user data:", dbError);
      redirect("/login");
    }

    if (!userData) {
      redirect("/login");
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
    } catch (dbError) {
      console.error("Error fetching trainer dashboard data:", dbError);
      // Use empty defaults if database query fails
      allTrainings = [];
      allCourses = [];
      preferences = null;
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

  return (
    <TrainerLayout
      userName={user.name}
      userEmail={user.email}
      userAvatar={userData.avatar}
      pageTitle="Dashboard"
      pageDescription="Overview of training completion rates and customizable dashboard."
    >
      <div className={styles.container}>
        <TrainerDashboardClient
          initialStats={initialStats}
          initialTrainingPreferences={trainingIds}
          initialCoursePreferences={courseIds}
          allTrainings={allTrainings}
          allCourses={allCourses}
        />
      </div>
    </TrainerLayout>
  );
  } catch (error) {
    console.error("[TrainerDashboardPage] Error in TrainerDashboardPage:", {
      error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      errorType: error instanceof Error ? error.constructor.name : typeof error,
    });
    
    // Check if it's a Next.js redirect error - let those through
    if (error && typeof error === 'object' && 'digest' in error && typeof (error as any).digest === 'string' && (error as any).digest?.includes('NEXT_REDIRECT')) {
      // This is a Next.js redirect - let it through
      throw error;
    }
    
    // For other errors, show error UI instead of throwing to prevent redirect loops
    return (
      <div className={styles.container}>
        <div style={{ padding: "var(--spacing-lg)", textAlign: "center" }}>
          <h2 style={{ color: "var(--color-error)", marginBottom: "var(--spacing-md)" }}>
            Dashboard Error
          </h2>
          <p style={{ color: "var(--color-text-secondary)", marginBottom: "var(--spacing-md)" }}>
            {error instanceof Error ? error.message : "An unexpected error occurred while loading the dashboard."}
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
}

