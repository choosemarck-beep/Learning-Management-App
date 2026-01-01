import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/utils";
import { TrainerLayout } from "@/components/layout/trainer/TrainerLayout";
import { SettingsPage } from "@/components/features/admin/SettingsPage";

export const dynamic = 'force-dynamic';

export default async function TrainerSettingsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Role check - only TRAINER can access
  if (user.role !== "TRAINER") {
    redirect("/login");
  }

  const safeUserName = String(user.name || 'Trainer');
  const safeUserEmail = String(user.email || '');
  const safeUserAvatar = user.avatar ? String(user.avatar) : null;

  return (
    <TrainerLayout
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
    </TrainerLayout>
  );
}

