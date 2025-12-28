import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/utils";
import { AdminLayout } from "@/components/layout/admin/AdminLayout";
import { MediaManagement } from "@/components/features/admin/MediaManagement";
import styles from "./page.module.css";

export default async function AdminMediaPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
    redirect("/admin/dashboard");
  }

  return (
    <AdminLayout
      userRole={user.role as "ADMIN" | "SUPER_ADMIN"}
      userName={user.name}
      userEmail={user.email}
      userAvatar={user.avatar}
      pageTitle="Multimedia Management"
      pageDescription="Manage carousel banners and splash screen images for the app."
    >
      <div className={styles.container}>
        <MediaManagement />
      </div>
    </AdminLayout>
  );
}

