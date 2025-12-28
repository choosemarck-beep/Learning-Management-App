import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/utils";
import { ManagementPage } from "@/components/features/management/ManagementPage";
import { ProfileBottomNav } from "@/components/layout/ProfileBottomNav";

export default async function RegionalManagerManagementPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  if (currentUser.role !== "REGIONAL_MANAGER") {
    redirect("/employee/regional-manager/dashboard");
  }

  return (
    <>
      <ManagementPage managerRole="REGIONAL_MANAGER" />
      <ProfileBottomNav
        userRole="REGIONAL_MANAGER"
        dashboardRoute="/employee/regional-manager/dashboard"
      />
    </>
  );
}

