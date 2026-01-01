"use client";

import React from "react";
import { AdminSidebar } from "./AdminSidebar";
import { AdminHeader } from "./AdminHeader";
import { ConditionalGalaxyBackground } from "@/components/ui/ConditionalGalaxyBackground";
import styles from "./AdminLayout.module.css";

interface AdminLayoutProps {
  children: React.ReactNode;
  userRole: "ADMIN" | "SUPER_ADMIN";
  userName: string;
  userEmail: string;
  userAvatar: string | null;
  pageTitle?: string;
  pageDescription?: string;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  userRole,
  userName,
  userEmail,
  userAvatar,
  pageTitle,
  pageDescription,
}) => {
  return (
    <div className={styles.layout} data-admin-layout="true">
      <ConditionalGalaxyBackground starCount={150} meteorCount={3} />
      <AdminSidebar
        userRole={userRole}
        userName={userName}
        userEmail={userEmail}
      />
      <div className={styles.mainContent}>
        <AdminHeader
          userName={userName}
          userEmail={userEmail}
          userRole={userRole}
          userAvatar={userAvatar}
          pageTitle={pageTitle}
          pageDescription={pageDescription}
        />
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
};
