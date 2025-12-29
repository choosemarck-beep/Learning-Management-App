import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma/client";
import { TrainerLayout } from "@/components/layout/trainer/TrainerLayout";
import { TrainerDashboardClient } from "@/components/features/trainer/TrainerDashboardClient";
import styles from "./page.module.css";

export const dynamic = 'force-dynamic';

export default async function TrainerDashboardPage() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      redirect("/login");
    }

    // Role check - only TRAINER can access
    if (user.role !== "TRAINER") {
      if (user.role === "REGIONAL_MANAGER") {
        redirect("/employee/regional-manager/dashboard");
      } else if (user.role === "AREA_MANAGER") {
        redirect("/employee/area-manager/dashboard");
      } else if (user.role === "BRANCH_MANAGER") {
        redirect("/employee/branch-manager/dashboard");
      } else if (user.role === "EMPLOYEE") {
        redirect("/employee/staff/dashboard");
      } else if (user.role === "SUPER_ADMIN") {
        redirect("/super-admin/dashboard");
      } else if (user.role === "ADMIN") {
        redirect("/admin/dashboard");
      } else {
        redirect("/login");
      }
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
      course: { id: string; title: string } | null;
    }> = [];
    let allCourses: Array<{
      id: string;
      title: string;
      description: string | null;
      thumbnail: string | null;
      _count: { trainings: number };
    }> = [];
    let preferences: { trainingIds: string[]; courseIds: string[] } | null = null;
    try {
      [allTrainings, allCourses, preferences] = await Promise.all([
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
    console.error("Error in TrainerDashboardPage:", error);
    redirect("/login");
  }
}

