import React, { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma/client";
import { ProfileBottomNav } from "@/components/layout/ProfileBottomNav";
import { NetflixCoursesPageClient } from "@/components/features/courses/NetflixCoursesPageClient";
import styles from "./page.module.css";

export default async function CoursesPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  // Get dashboard route based on role
  const getDashboardRoute = () => {
    switch (currentUser.role) {
      case "BRANCH_MANAGER":
        return "/employee/branch-manager/dashboard";
      case "AREA_MANAGER":
        return "/employee/area-manager/dashboard";
      case "REGIONAL_MANAGER":
        return "/employee/regional-manager/dashboard";
      case "TRAINER":
        return "/employee/trainer/dashboard";
      case "EMPLOYEE":
      default:
        return "/employee/staff/dashboard";
    }
  };

  const dashboardRoute = getDashboardRoute();

  // Fetch all published courses with trainings
  let courses;
  try {
    courses = await prisma.course.findMany({
      where: {
        isPublished: true,
      },
      include: {
        trainings: {
          where: {
            isPublished: true,
          },
          orderBy: {
            order: "asc",
          },
          select: {
            id: true,
            title: true,
            order: true,
            totalXP: true,
            videoThumbnail: true,
            shortDescription: true,
          },
        },
        courseProgresses: {
          where: {
            userId: currentUser.id,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  } catch (error) {
    console.error("Error fetching courses:", error);
    // Fallback query
    courses = await prisma.course.findMany({
      where: {
        isPublished: true,
      },
      include: {
        trainings: {
          where: {
            isPublished: true,
          },
          orderBy: {
            order: "asc",
          },
          select: {
            id: true,
            title: true,
            order: true,
            totalXP: true,
            videoThumbnail: true,
            shortDescription: true,
          },
        },
        courseProgresses: {
          where: {
            userId: currentUser.id,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  // Format courses with progress data and trainings
  const coursesWithProgress = courses.map((course) => {
    const progress = course.courseProgresses[0];
    return {
      id: course.id,
      title: course.title,
      description: course.description,
      thumbnail: course.thumbnail,
      totalXP: course.totalXP,
      progress: progress ? progress.progress : 0,
      isCompleted: progress ? progress.isCompleted : false,
      isEnrolled: !!progress,
      modules: course.trainings.map((training) => ({
        id: training.id,
        title: training.title,
        description: training.shortDescription || "",
        thumbnail: training.videoThumbnail || null,
        order: training.order,
        totalXP: training.totalXP,
      })),
    };
  });

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <Suspense fallback={<div>Loading courses...</div>}>
          <NetflixCoursesPageClient courses={coursesWithProgress} />
        </Suspense>
      </div>

      <ProfileBottomNav
        userRole={currentUser.role}
        dashboardRoute={dashboardRoute}
      />
    </div>
  );
}

