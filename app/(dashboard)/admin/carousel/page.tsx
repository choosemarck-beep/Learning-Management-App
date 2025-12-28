import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/utils";
import { CarouselManagement } from "@/components/features/admin/CarouselManagement";
import styles from "./page.module.css";

export default async function AdminCarouselPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
    redirect("/admin/dashboard");
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Carousel Management</h1>
      <p className={styles.description}>
        Upload and manage carousel images displayed on employee dashboards.
      </p>
      <CarouselManagement />
    </div>
  );
}

