import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma/client";
import { OnboardingMessageWrapper } from "@/components/features/OnboardingMessageWrapper";
import { ProfileBottomNav } from "@/components/layout/ProfileBottomNav";
import { CarouselHeader } from "@/components/features/dashboard/CarouselHeader";
import { CarouselPlaceholder } from "@/components/features/dashboard/CarouselPlaceholder";
import { DashboardCoursesSection } from "@/components/features/dashboard/DashboardCoursesSection";
import { TrainerAnnouncementsSection } from "@/components/features/dashboard/TrainerAnnouncementsSection";
import styles from "./page.module.css";

export default async function BranchManagerDashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Role check - only BRANCH_MANAGER can access
  if (user.role !== "BRANCH_MANAGER") {
    if (user.role === "EMPLOYEE") {
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

  const onboardingCompleted = userData.onboardingCompleted || false;

  // Fetch carousel settings and data
  const carouselSettings = await prisma.carouselSettings.findFirst();
  const mode = carouselSettings?.mode || "PHOTO_CAROUSEL";
  const videoUrl = carouselSettings?.videoUrl || null;

  // Fetch carousel images (only for photo carousel mode, limit to 4)
  const carouselImages = mode === "PHOTO_CAROUSEL"
    ? await prisma.carouselImage.findMany({
        where: { isActive: true },
        orderBy: { order: "asc" },
        take: 4,
        select: {
          id: true,
          imageUrl: true,
          title: true,
          description: true,
        },
      })
    : [];

  // Prepare courses data
  const courses = userData.courseProgresses.map((cp) => ({
    id: cp.course.id,
    title: cp.course.title,
    description: cp.course.description,
    thumbnail: cp.course.thumbnail,
    totalXP: cp.course.totalXP,
    progress: cp.progress,
    isCompleted: cp.isCompleted,
  }));

  return (
    <div className={styles.container}>
      {/* Onboarding Message Modal */}
      <OnboardingMessageWrapper
        userName={user.name}
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
        dashboardRoute="/employee/branch-manager/dashboard"
      />
    </div>
  );
}

