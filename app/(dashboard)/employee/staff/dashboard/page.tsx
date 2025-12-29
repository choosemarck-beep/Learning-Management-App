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

export const dynamic = 'force-dynamic';

export default async function StaffDashboardPage() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      redirect("/login");
    }

    // Role check - only EMPLOYEE can access
    if (user.role !== "EMPLOYEE") {
      if (user.role === "BRANCH_MANAGER") {
        redirect("/employee/branch-manager/dashboard");
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
      name: string;
      onboardingCompleted: boolean | null;
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
      console.error("Error fetching user data:", dbError);
      // If database query fails, redirect to login
      redirect("/login");
    }

    if (!userData) {
      redirect("/login");
    }

  const onboardingCompleted = userData.onboardingCompleted || false;

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
        dashboardRoute="/employee/staff/dashboard"
      />
    </div>
  );
  } catch (error) {
    console.error("Error in StaffDashboardPage:", error);
    // Redirect to login on any error
    redirect("/login");
  }
}

