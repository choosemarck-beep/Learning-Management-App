import React, { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma/client";
import { TrainerLayout } from "@/components/layout/trainer/TrainerLayout";
import { ViewLogsClient } from "@/components/features/trainer/ViewLogsClient";
import styles from "./page.module.css";

// Trainer Logs Page - View all system activity logs

export const dynamic = 'force-dynamic';

export default async function TrainerLogsPage() {
  try {
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
    let userData;
    try {
      userData = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
        },
      });
    } catch (dbError) {
      console.error("[TrainerLogsPage] Database error:", {
        userId: user.id,
        error: dbError,
      });
      throw new Error("Failed to load user data");
    }

    if (!userData) {
      redirect("/login");
    }

    // Validate required fields
    if (!userData.name || !userData.email) {
      throw new Error("User data incomplete");
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
          <Suspense fallback={
            <div className={styles.loading}>
              <p>Loading activity logs...</p>
            </div>
          }>
            <ViewLogsClient />
          </Suspense>
        </div>
      </TrainerLayout>
    );
  } catch (error) {
    console.error("[TrainerLogsPage] Error:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Show error UI instead of redirecting to prevent loops
    return (
      <div className={styles.container}>
        <div className={styles.errorContainer}>
          <h2>Error Loading Logs</h2>
          <p>An error occurred while loading the logs page. Please try again later.</p>
        </div>
      </div>
    );
  }
}

