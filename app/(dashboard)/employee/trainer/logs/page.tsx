import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma/client";
import { TrainerLayout } from "@/components/layout/trainer/TrainerLayout";
import { ViewLogsClient } from "@/components/features/trainer/ViewLogsClient";
import styles from "./page.module.css";

export default async function TrainerLogsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Role check - only TRAINER can access
  if (user.role !== "TRAINER") {
    if (user.role === "REGIONAL_MANAGER") {
      redirect("/employee/regional-manager/dashboard");
    } else if (user.role === "AREA_MANAGER") {
      redirect("/employee/area-manager/dashboard");
    } else if (user.role === "BRANCH_MANAGER") {
      redirect("/employee/branch-manager/dashboard");
    } else if (user.role === "EMPLOYEE") {
      redirect("/employee/staff/dashboard");
    } else if (user.role === "SUPER_ADMIN") {
      redirect("/super-admin/dashboard");
    } else if (user.role === "ADMIN") {
      redirect("/admin/dashboard");
    } else {
      redirect("/login");
    }
  }

  // Fetch full user data from database
  const userData = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
    },
  });

  if (!userData) {
    redirect("/login");
  }

  return (
    <TrainerLayout
      userName={userData.name}
      userEmail={userData.email}
      userAvatar={userData.avatar}
      pageTitle="View Logs"
      pageDescription="View all system activity logs organized by role"
    >
      <div className={styles.container}>
        <ViewLogsClient />
      </div>
    </TrainerLayout>
  );
}

