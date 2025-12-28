import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/utils";
import { AnnouncementManagement } from "@/components/features/admin/AnnouncementManagement";
import styles from "./page.module.css";

export default async function AdminAnnouncementsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
    redirect("/admin/dashboard");
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Announcement Management</h1>
      <p className={styles.description}>
        Create and manage trainer announcements displayed on employee dashboards.
      </p>
      <AnnouncementManagement />
    </div>
  );
}

