import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma/client";
import { ProfileBottomNav } from "@/components/layout/ProfileBottomNav";
import { NetflixCourseDetailClient } from "@/components/features/courses/NetflixCourseDetailClient";
import styles from "./page.module.css";

export const dynamic = 'force-dynamic';

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  // Await params in Next.js 14+ App Router
  const { courseId } = await params;

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

  // Fetch course with trainings
  const course = await prisma.course.findUnique({
    where: {
      id: courseId,
      isPublished: true, // Only show published courses
    },
    include: {
      trainings: {
        where: {
          isPublished: true, // Only show published trainings
        },
        orderBy: {
          order: "asc",
        },
        include: {
          _count: {
            select: {
              miniTrainings: true,
            },
          },
        },
      },
      courseProgresses: {
        where: {
          userId: currentUser.id,
        },
      },
    },
  });

  if (!course) {
    redirect("/courses");
  }

  // Fetch training progress for all trainings in the course
  const trainingIds = course.trainings.map((t) => t.id);
  const trainingProgresses = await prisma.trainingProgressNew.findMany({
    where: {
      userId: currentUser.id,
      trainingId: {
        in: trainingIds,
      },
    },
    select: {
      trainingId: true,
      progress: true,
      isCompleted: true,
    },
  });

  // Create a map of trainingId -> progress for easy lookup
  const progressMap = new Map(
    trainingProgresses.map((tp) => [tp.trainingId, { progress: tp.progress, isCompleted: tp.isCompleted }])
  );

  // Get user's progress for this course (auto-enroll if not enrolled)
  let courseProgress = course.courseProgresses[0];
  if (!courseProgress) {
    // Auto-enroll user in course
    courseProgress = await prisma.courseProgress.create({
      data: {
        userId: currentUser.id,
        courseId: courseId,
        progress: 0,
        isCompleted: false,
      },
    });
  }
  const progress = courseProgress.progress;
  const isCompleted = courseProgress.isCompleted;
  const isEnrolled = true; // Always enrolled after auto-enrollment

  // Format course data with trainings
  const courseData = {
    id: course.id,
    title: course.title,
    description: course.description,
    thumbnail: course.thumbnail,
    totalXP: course.totalXP,
    progress,
    isCompleted,
    isEnrolled,
    trainings: course.trainings.map((training) => {
      const trainingProgress = progressMap.get(training.id);
      return {
        id: training.id,
        title: training.title,
        description: training.shortDescription || "",
        thumbnail: training.videoThumbnail || null,
        order: training.order,
        totalXP: training.totalXP,
        miniTrainingCount: training._count.miniTrainings,
        progress: trainingProgress?.progress || 0,
        isCompleted: trainingProgress?.isCompleted || false,
      };
    }),
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <NetflixCourseDetailClient course={courseData} />
      </div>

      <ProfileBottomNav
        userRole={currentUser.role}
        dashboardRoute={dashboardRoute}
      />
    </div>
  );
}

