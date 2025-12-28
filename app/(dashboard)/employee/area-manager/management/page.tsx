import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/utils";
import { ManagementPage } from "@/components/features/management/ManagementPage";
import { ProfileBottomNav } from "@/components/layout/ProfileBottomNav";

export default async function AreaManagerManagementPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  if (currentUser.role !== "AREA_MANAGER") {
    redirect("/employee/area-manager/dashboard");
  }

  return (
    <>
      <ManagementPage managerRole="AREA_MANAGER" />
      <ProfileBottomNav
        userRole="AREA_MANAGER"
        dashboardRoute="/employee/area-manager/dashboard"
      />
    </>
  );
}

