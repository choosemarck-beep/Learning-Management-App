import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma/client";
import { OnboardingMessageWrapper } from "@/components/features/OnboardingMessageWrapper";
import { ProfileBottomNav } from "@/components/layout/ProfileBottomNav";
import { CarouselHeader } from "@/components/features/dashboard/CarouselHeader";
import { MetricsSection } from "@/components/features/dashboard/MetricsSection";
import { SuggestedTrainingSection } from "@/components/features/dashboard/SuggestedTrainingSection";
import { TrainerAnnouncementsSection } from "@/components/features/dashboard/TrainerAnnouncementsSection";
import { EmployeeJourneySection } from "@/components/features/dashboard/EmployeeJourneySection";
import { ManagerMetricsSection } from "@/components/features/dashboard/ManagerMetricsSection";
import styles from "./page.module.css";

export default async function StaffDashboardNewPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Role check - only EMPLOYEE, BRANCH_MANAGER, AREA_MANAGER, REGIONAL_MANAGER, TRAINER can access
  if (
    user.role !== "EMPLOYEE" &&
    user.role !== "BRANCH_MANAGER" &&
    user.role !== "AREA_MANAGER" &&
    user.role !== "REGIONAL_MANAGER" &&
    user.role !== "TRAINER"
  ) {
    if (user.role === "SUPER_ADMIN") {
      redirect("/super-admin/dashboard");
    } else if (user.role === "ADMIN") {
      redirect("/admin/dashboard");
    } else {
      redirect("/login");
    }
  }

  // Fetch carousel images
  const carouselImages = await prisma.carouselImage.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
    select: {
      id: true,
      imageUrl: true,
      title: true,
      description: true,
    },
  });

  const onboardingCompleted = user.onboardingCompleted || false;

  // Determine dashboard route based on role
  const getDashboardRoute = () => {
    switch (user.role) {
      case "BRANCH_MANAGER":
        return "/employee/branch-manager/dashboard";
      case "AREA_MANAGER":
        return "/employee/area-manager/dashboard";
      case "REGIONAL_MANAGER":
        return "/employee/regional-manager/dashboard";
      case "TRAINER":
        return "/employee/trainer/dashboard";
      default:
        return "/employee/staff/dashboard";
    }
  };

  return (
    <div className={styles.container}>
      {/* Onboarding Message Modal */}
      <OnboardingMessageWrapper
        userName={user.name}
        onboardingCompleted={onboardingCompleted}
      />

      {/* Carousel Header */}
      {carouselImages.length > 0 && (
        <CarouselHeader images={carouselImages} />
      )}

      {/* Metrics Section */}
      <MetricsSection />

      {/* Suggested Training Section */}
      <SuggestedTrainingSection />

      {/* Trainer Announcements Section */}
      <TrainerAnnouncementsSection />

      {/* Employee Journey Section */}
      <EmployeeJourneySection />

      {/* Manager Metrics Section (only for managers) */}
      {(user.role === "BRANCH_MANAGER" ||
        user.role === "AREA_MANAGER" ||
        user.role === "REGIONAL_MANAGER") && (
        <ManagerMetricsSection managerRole={user.role} />
      )}

      {/* Bottom Navigation */}
      <ProfileBottomNav
        userRole={user.role}
        dashboardRoute={getDashboardRoute()}
      />
    </div>
  );
}

