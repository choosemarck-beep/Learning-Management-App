import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/utils";
import { ProfileBottomNav } from "@/components/layout/ProfileBottomNav";
import { TrainingPassportClient } from "@/components/features/training-passport/TrainingPassportClient";
import styles from "./page.module.css";

export default async function TrainingPassportPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

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

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <TrainingPassportClient />
      </div>
      <ProfileBottomNav userRole={currentUser.role} dashboardRoute={dashboardRoute} />
    </div>
  );
}

