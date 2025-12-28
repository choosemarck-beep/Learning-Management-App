import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/utils";
import { ManagementPage } from "@/components/features/management/ManagementPage";
import { ProfileBottomNav } from "@/components/layout/ProfileBottomNav";

export default async function BranchManagerManagementPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  if (currentUser.role !== "BRANCH_MANAGER") {
    redirect("/employee/branch-manager/dashboard");
  }

  return (
    <>
      <ManagementPage managerRole="BRANCH_MANAGER" />
      <ProfileBottomNav
        userRole="BRANCH_MANAGER"
        dashboardRoute="/employee/branch-manager/dashboard"
      />
    </>
  );
}

