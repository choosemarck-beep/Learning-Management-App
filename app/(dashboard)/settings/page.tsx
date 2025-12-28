import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/utils";
import { ProfileBottomNav } from "@/components/layout/ProfileBottomNav";
import {
  User,
  Bell,
  Shield,
  Palette,
  Info,
  HelpCircle,
  ChevronRight,
} from "lucide-react";
import styles from "./page.module.css";

export default async function SettingsPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  const getDashboardRoute = () => {
    switch (currentUser.role) {
      case "BRANCH_MANAGER":
        return "/employee/branch-manager/dashboard";
      case "AREA_MANAGER":
        return "/employee/area-manager/dashboard";
      case "REGIONAL_MANAGER":
        return "/employee/regional-manager/dashboard";
      case "TRAINER":
        return "/employee/trainer/dashboard";
      case "EMPLOYEE":
      default:
        return "/employee/staff/dashboard";
    }
  };

  const dashboardRoute = getDashboardRoute();

  // Settings menu items
  const settingsMenuItems = [
    {
      id: "account",
      icon: User,
      label: "Account",
      description: "Manage your profile and account settings",
    },
    {
      id: "notifications",
      icon: Bell,
      label: "Notifications",
      description: "Configure notification preferences",
    },
    {
      id: "privacy",
      icon: Shield,
      label: "Privacy & Security",
      description: "Manage privacy and security settings",
    },
    {
      id: "preferences",
      icon: Palette,
      label: "App Preferences",
      description: "Customize app appearance and behavior",
    },
    {
      id: "about",
      icon: Info,
      label: "About",
      description: "App version and information",
    },
    {
      id: "help",
      icon: HelpCircle,
      label: "Help & Support",
      description: "Get help and contact support",
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.title}>Settings</h1>
        <p className={styles.subtitle}>Manage your account and preferences</p>

        <div className={styles.menuList}>
          {settingsMenuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={styles.menuItem}
                aria-label={item.label}
              >
                <div className={styles.menuItemIcon}>
                  <Icon size={20} />
                </div>
                <div className={styles.menuItemContent}>
                  <span className={styles.menuItemLabel}>{item.label}</span>
                  <span className={styles.menuItemDescription}>
                    {item.description}
                  </span>
                </div>
                <ChevronRight size={20} className={styles.menuItemArrow} />
              </button>
            );
          })}
        </div>
      </div>
      <ProfileBottomNav userRole={currentUser.role} dashboardRoute={dashboardRoute} />
    </div>
  );
}

