import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma/client";
import { ProfileHeader } from "@/components/features/ProfileHeader";
import { ProfileBottomNav } from "@/components/layout/ProfileBottomNav";
import { ProfilePageTabs } from "@/components/features/profile/ProfilePageTabs";
import { ProfileContactTab } from "@/components/features/profile/ProfileContactTab";
import { ProfileWorkTab } from "@/components/features/profile/ProfileWorkTab";
import { ProfileStatsTab } from "@/components/features/profile/ProfileStatsTab";
import styles from "./page.module.css";

interface PageProps {
  searchParams: { id?: string };
}

export default async function TrainerProfilePage({
  searchParams,
}: PageProps) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  // Determine which profile to show
  let targetUserId: string;
  let isViewingOwnProfile = false;

  // If admin is viewing, use the id from query params
  if (
    (currentUser.role === "ADMIN" || currentUser.role === "SUPER_ADMIN") &&
    searchParams.id
  ) {
    targetUserId = searchParams.id;
    isViewingOwnProfile = false;
  } else if (currentUser.role === "TRAINER") {
    // Trainers view their own profile
    targetUserId = currentUser.id;
    isViewingOwnProfile = true;
  } else {
    // Other roles should go to their dashboards
    redirect("/admin/dashboard");
  }

  // Fetch the target user's data
  const userData = await prisma.user.findUnique({
    where: { id: targetUserId },
    include: {
      company: {
        select: {
          id: true,
          name: true,
          type: true,
        },
      },
      position: {
        select: {
          id: true,
          title: true,
          role: true,
        },
      },
    },
  });

  if (!userData) {
    redirect("/admin/dashboard");
  }

  // Only allow viewing TRAINER profiles
  if (userData.role !== "TRAINER") {
    redirect("/admin/dashboard");
  }

  const userLevel = userData.level || 1;
  const userXP = userData.xp || 0;
  const userRank = userData.rank || "Stellar Cadet";
  const userStreak = userData.streak || 0;
  const userDiamonds = userData.diamonds || 0;
  const accountStatus = userData.status;

  // Calculate XP for next level
  const xpForCurrentLevel = (userLevel - 1) * 1000;
  const xpForNextLevel = userLevel * 1000;
  const xpInCurrentLevel = userXP - xpForCurrentLevel;
  const xpNeededForNextLevel = xpForNextLevel - xpForCurrentLevel;
  const progressToNextLevel = Math.min(
    (xpInCurrentLevel / xpNeededForNextLevel) * 100,
    100
  );

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const tabs = [
    { id: "CONTACT" as const, label: "Contact" },
    { id: "WORK" as const, label: "Work" },
    { id: "STATS" as const, label: "Stats" },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.profileContainer}>
        {/* Profile Header */}
        <div className={styles.headerSection}>
          <ProfileHeader
            name={userData.name}
            avatar={userData.avatar}
            employeeNumber={userData.employeeNumber}
            userId={userData.id}
            isViewingOwnProfile={isViewingOwnProfile}
          />
        </div>

        {/* Tabbed Content */}
        <div className={styles.tabsSection}>
        <ProfilePageTabs
          tabs={tabs}
          contactContent={
            <ProfileContactTab
              email={userData.email}
              phone={userData.phone}
            />
          }
          workContent={
            <ProfileWorkTab
              company={userData.company}
              position={userData.position}
              department={userData.department}
              branch={userData.branch}
              area={userData.area}
              region={userData.region}
              hireDate={userData.hireDate}
              createdAt={userData.createdAt}
              userId={userData.id}
            />
          }
          statsContent={
            <ProfileStatsTab
              level={userLevel}
              xp={userXP}
              rank={userRank}
              streak={userStreak}
              diamonds={userDiamonds}
              progressToNextLevel={progressToNextLevel}
              isViewingOwnProfile={isViewingOwnProfile}
            />
          }
        />
        </div>
      </div>

      {/* Bottom Navigation */}
      <ProfileBottomNav
        userRole="TRAINER"
        dashboardRoute="/employee/trainer/dashboard"
      />
    </div>
  );
}

