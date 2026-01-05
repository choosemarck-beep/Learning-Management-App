import { getCurrentUser } from "@/lib/auth/utils";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma/client";
import { MechanicsPageClient } from "@/components/features/mechanics/MechanicsPageClient";
import { ProfileBottomNav } from "@/components/layout/ProfileBottomNav";
import styles from "./page.module.css";

export const dynamic = 'force-dynamic';

export default async function MechanicsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch user data to get role and gamification stats
  const userData = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      xp: true,
      level: true,
      streak: true,
      diamonds: true,
    },
  });

  if (!userData) {
    redirect("/login");
  }

  // Get dashboard route based on role (for ProfileBottomNav)
  const getDashboardRoute = () => {
    switch (userData.role) {
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

  // Only show to employees and managers (mobile users)
  // Admins, Super Admins, and Trainers use desktop and don't need this page
  if (
    userData.role === "ADMIN" ||
    userData.role === "SUPER_ADMIN" ||
    userData.role === "TRAINER"
  ) {
    redirect(dashboardRoute);
  }

  return (
    <div className={styles.container}>
      <MechanicsPageClient
        userXP={userData.xp || 0}
        userLevel={userData.level || 1}
        userStreak={userData.streak || 0}
        userDiamonds={userData.diamonds || 0}
      />
      <ProfileBottomNav
        userRole={userData.role}
        dashboardRoute={dashboardRoute}
      />
    </div>
  );
}

