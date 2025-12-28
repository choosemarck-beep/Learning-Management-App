import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma/client";
import { TrainerLayout } from "@/components/layout/trainer/TrainerLayout";
import { TrainerDashboardClient } from "@/components/features/trainer/TrainerDashboardClient";
import styles from "./page.module.css";

export default async function TrainerDashboardPage() {
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

  // Fetch full user data from database
  const userData = await prisma.user.findUnique({
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

  if (!userData) {
    redirect("/login");
  }

  // Fetch all trainings created by this trainer (from courses)
  const allTrainings = await prisma.training.findMany({
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
  });

  // Fetch all courses created by this trainer
  const allCourses = await prisma.course.findMany({
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
  });

  // Fetch dashboard preferences
  const preferences = await prisma.trainerDashboardPreferences.findUnique({
    where: {
      trainerId: user.id,
    },
    select: {
      trainingIds: true,
      courseIds: true,
    },
  });

  const trainingIds = preferences?.trainingIds || [];
  const courseIds = preferences?.courseIds || [];

  // Calculate stats for all trainings using TrainingProgressNew
  const trainingIdsForStats = allTrainings.map((t) => t.id);

  let overallCompletionRate = 0;
  let totalAssigned = 0;
  let totalCompleted = 0;
  const trainingStats: Array<{
    trainingId: string;
    title: string;
    completionRate: number;
    totalAssigned: number;
    totalCompleted: number;
  }> = [];

  if (trainingIdsForStats.length > 0) {
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
}

