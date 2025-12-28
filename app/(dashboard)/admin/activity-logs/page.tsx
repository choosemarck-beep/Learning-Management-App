import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/utils";
import { ActivityLogsClient } from "@/components/features/admin/ActivityLogsClient";
import styles from "./page.module.css";

export default async function ActivityLogsPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  // Only ADMIN and SUPER_ADMIN can access
  if (currentUser.role !== "ADMIN" && currentUser.role !== "SUPER_ADMIN") {
    redirect("/admin/dashboard");
  }

  return (
    <div className={styles.container}>
      <ActivityLogsClient />
    </div>
  );
}

