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

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ id?: string }>;
}

export default async function EmployeeProfilePage({
  searchParams,
}: PageProps) {
  const currentUser = await getCurrentUser();
  const resolvedSearchParams = await searchParams;

  if (!currentUser) {
    redirect("/login");
  }

  // Determine which employee profile to show
  let targetUserId: string;
  let isViewingOwnProfile = false;

  // If admin is viewing, use the id from query params
  if (
    (currentUser.role === "ADMIN" || currentUser.role === "SUPER_ADMIN") &&
    resolvedSearchParams.id
  ) {
    targetUserId = resolvedSearchParams.id;
    isViewingOwnProfile = false;
  } else if (
    currentUser.role === "EMPLOYEE" ||
    currentUser.role === "BRANCH_MANAGER"
  ) {
    // Employees and Branch Managers view their own profile
    targetUserId = currentUser.id;
    isViewingOwnProfile = true;
  } else {
    // Admins without id param should go to admin dashboard
      redirect("/admin/dashboard");
  }

  // Fetch the target employee's data
  const employeeData = await prisma.user.findUnique({
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

  if (!employeeData) {
    redirect("/admin/dashboard");
  }

  // Only allow viewing EMPLOYEE and BRANCH_MANAGER profiles
  if (
    employeeData.role !== "EMPLOYEE" &&
    employeeData.role !== "BRANCH_MANAGER"
  ) {
    redirect("/admin/dashboard");
  }

  const userLevel = employeeData.level || 1;
  const userXP = employeeData.xp || 0;
  const userRank = employeeData.rank || "Stellar Cadet";
  const userStreak = employeeData.streak || 0;
  const userDiamonds = employeeData.diamonds || 0;
  const accountStatus = employeeData.status;

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
            name={employeeData.name}
            avatar={employeeData.avatar}
            employeeNumber={employeeData.employeeNumber}
            userId={employeeData.id}
            isViewingOwnProfile={isViewingOwnProfile}
          />
        </div>

        {/* Tabbed Content */}
        <div className={styles.tabsSection}>
          <ProfilePageTabs
            tabs={tabs}
            contactContent={
              <ProfileContactTab
                email={employeeData.email}
                phone={employeeData.phone}
              />
            }
            workContent={
              <ProfileWorkTab
                company={employeeData.company}
                position={employeeData.position}
                department={employeeData.department}
                branch={employeeData.branch}
                area={employeeData.area}
                region={employeeData.region}
                hireDate={employeeData.hireDate}
                createdAt={employeeData.createdAt}
                userId={employeeData.id}
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
        userRole={employeeData.role}
        dashboardRoute={
          employeeData.role === "BRANCH_MANAGER"
            ? "/employee/branch-manager/dashboard"
            : "/employee/staff/dashboard"
        }
      />
    </div>
  );
}
