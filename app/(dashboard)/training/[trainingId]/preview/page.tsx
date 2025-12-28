import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma/client";
import { ProfileBottomNav } from "@/components/layout/ProfileBottomNav";
import { TrainingPreviewPageClient } from "@/components/features/courses/TrainingPreviewPageClient";
import styles from "./page.module.css";

interface PageProps {
  params: Promise<{ trainingId: string }>;
}

export default async function TrainingPreviewPage({ params }: PageProps) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  // Await params in Next.js 14+ App Router
  const { trainingId } = await params;

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

  // Fetch training data from database
  try {
    const training = await prisma.training.findUnique({
      where: { id: trainingId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            isPublished: true,
          },
        },
      },
    });

    if (!training) {
      redirect("/courses");
    }

    // Check if course is published
    if (!training.course.isPublished) {
      redirect("/courses");
    }

    // Check if training is published
    if (!training.isPublished) {
      redirect("/courses");
    }

    const trainingData = {
      id: training.id,
      title: training.title,
      description: training.shortDescription || "",
      thumbnail: training.videoThumbnail,
      order: training.order,
      totalXP: training.totalXP,
    };

    const courseData = {
      id: training.course.id,
      title: training.course.title,
    };

    return (
      <div className={styles.container}>
        <TrainingPreviewPageClient
          module={trainingData}
          course={courseData}
          isPlaceholder={false}
        />
        <ProfileBottomNav userRole={currentUser.role} dashboardRoute={dashboardRoute} />
      </div>
    );
  } catch (error) {
    console.error("Error loading training preview:", error);
    redirect("/courses");
  }
}

