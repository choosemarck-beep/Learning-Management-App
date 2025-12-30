import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/utils";
import { AdminLayout } from "@/components/layout/admin/AdminLayout";
import { SettingsPage } from "@/components/features/admin/SettingsPage";

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Role check - only ADMIN and SUPER_ADMIN can access
  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
    redirect("/login");
  }

  const safeUserName = String(user.name || 'Admin');
  const safeUserEmail = String(user.email || '');
  const safeUserAvatar = user.avatar ? String(user.avatar) : null;
  const safeUserRole = (user.role === "ADMIN" || user.role === "SUPER_ADMIN") 
    ? user.role as "ADMIN" | "SUPER_ADMIN"
    : "ADMIN";

  return (
    <AdminLayout
      userRole={safeUserRole}
      userName={safeUserName}
      userEmail={safeUserEmail}
      userAvatar={safeUserAvatar}
      pageTitle="Settings"
      pageDescription="Manage your account settings, preferences, and security options."
    >
      <SettingsPage
        user={{
          name: safeUserName,
          email: safeUserEmail,
          avatar: safeUserAvatar,
        }}
      />
    </AdminLayout>
  );
}

