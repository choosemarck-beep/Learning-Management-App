import { getCurrentUser } from "@/lib/auth/utils";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma/client";
import { LeaderboardPageClient } from "@/components/features/leaderboard/LeaderboardPageClient";
import { ProfileBottomNav } from "@/components/layout/ProfileBottomNav";
import { AdminLayout } from "@/components/layout/admin/AdminLayout";
import { TrainerLayout } from "@/components/layout/trainer/TrainerLayout";
import styles from "./page.module.css";

export const dynamic = 'force-dynamic';

export default async function LeaderboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch full user data to get avatar
  const userData = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
      role: true,
    },
  });

  if (!userData) {
    redirect("/login");
  }

  // Validate user properties
  if (!userData.name || !userData.email) {
    throw new Error("User data is incomplete");
  }

  const safeUserName = String(userData.name);
  const safeUserEmail = String(userData.email);
  const safeUserAvatar = userData.avatar ? String(userData.avatar) : null;

  // Admin/Super Admin: Desktop layout with sidebar
  if (userData.role === "ADMIN" || userData.role === "SUPER_ADMIN") {
    return (
      <AdminLayout
        userRole={userData.role as "ADMIN" | "SUPER_ADMIN"}
        userName={safeUserName}
        userEmail={safeUserEmail}
        userAvatar={safeUserAvatar}
        pageTitle="Leaderboard"
        pageDescription="View employee rankings and leaderboard statistics."
      >
        <LeaderboardPageClient initialData={null} userRole={userData.role} />
      </AdminLayout>
    );
  }

  // Trainer: Desktop layout with sidebar
  if (userData.role === "TRAINER") {
    return (
      <TrainerLayout
        userName={safeUserName}
        userEmail={safeUserEmail}
        userAvatar={safeUserAvatar}
        pageTitle="Leaderboard"
        pageDescription="View employee rankings and leaderboard statistics."
      >
        <LeaderboardPageClient initialData={null} userRole={userData.role} />
      </TrainerLayout>
    );
  }

  // Employee: Mobile layout with bottom nav
  if (userData.role === "EMPLOYEE") {
    return (
      <div className={styles.container}>
        <LeaderboardPageClient initialData={null} userRole={userData.role} />
        <ProfileBottomNav
          userRole={userData.role}
          dashboardRoute="/employee/staff/dashboard"
        />
      </div>
    );
  }

  // Managers should be redirected (middleware handles, but fallback here)
  // Branch Manager
  if (userData.role === "BRANCH_MANAGER") {
    redirect("/employee/branch-manager/dashboard");
  }
  // Area Manager
  if (userData.role === "AREA_MANAGER") {
    redirect("/employee/area-manager/dashboard");
  }
  // Regional Manager
  if (userData.role === "REGIONAL_MANAGER") {
    redirect("/employee/regional-manager/dashboard");
  }

  // Fallback: redirect to login
  redirect("/login");
}

