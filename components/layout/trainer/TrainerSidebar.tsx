"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  FileQuestion,
  ClipboardCheck,
  Trophy,
  History,
} from "lucide-react";
import styles from "./TrainerSidebar.module.css";

interface TrainerSidebarProps {
  userName: string;
  userEmail: string;
}

export const TrainerSidebar: React.FC<TrainerSidebarProps> = ({
  userName,
  userEmail,
}) => {
  const pathname = usePathname();

  const navigationItems = [
    {
      href: "/employee/trainer/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      href: "/leaderboard",
      label: "Leaderboard",
      icon: Trophy,
    },
    {
      href: "/employee/trainer/workshop",
      label: "Workshop",
      icon: BookOpen,
    },
    {
      href: "/employee/trainer/logs",
      label: "View Logs",
      icon: History,
    },
  ];

  const isActive = (href: string) => {
    if (href === "/employee/trainer/dashboard") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <aside className={styles.sidebar} data-sidebar="collapsed">
      {/* Logo/Branding */}
      <div className={styles.brand}>
        <div className={styles.logo}>
          <span className={styles.logoText}>LM</span>
        </div>
        <h2 className={styles.brandText}>Learning Management</h2>
      </div>

      {/* Navigation */}
      <nav className={styles.nav}>
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navItem} ${active ? styles.active : ""}`}
            >
              <Icon size={20} className={styles.navIcon} />
              <span className={styles.navLabel}>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

