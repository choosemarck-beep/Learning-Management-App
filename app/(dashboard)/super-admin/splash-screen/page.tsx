import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/utils";
import { SplashScreenManagement } from "@/components/features/admin/SplashScreenManagement";
import styles from "./page.module.css";

export default async function SuperAdminSplashScreenPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "SUPER_ADMIN") {
    redirect("/super-admin/dashboard");
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Splash Screen Management</h1>
      <p className={styles.description}>
        Upload and manage the splash screen background image displayed when users first open the app.
      </p>
      <SplashScreenManagement />
    </div>
  );
}

