import { getCurrentUser } from "@/lib/auth/utils";
import { redirect } from "next/navigation";
import { LeaderboardPageClient } from "@/components/features/leaderboard/LeaderboardPageClient";
import { ProfileBottomNav } from "@/components/layout/ProfileBottomNav";
import styles from "./page.module.css";

export const dynamic = 'force-dynamic';

export default async function LeaderboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Get dashboard route based on role
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
      case "EMPLOYEE":
      default:
        return "/employee/staff/dashboard";
    }
  };

  const dashboardRoute = getDashboardRoute();

  return (
    <div className={styles.container}>
      <LeaderboardPageClient initialData={null} />
      <ProfileBottomNav
        userRole={user.role}
        dashboardRoute={dashboardRoute}
      />
    </div>
  );
}

