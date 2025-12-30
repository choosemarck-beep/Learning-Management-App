"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Settings,
  Shield,
  Image as ImageIcon,
} from "lucide-react";
import styles from "./AdminSidebar.module.css";

interface AdminSidebarProps {
  userRole: "ADMIN" | "SUPER_ADMIN";
  userName: string;
  userEmail: string;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  userRole,
  userName,
  userEmail,
}) => {
  const pathname = usePathname();

  const navigationItems = [
    {
      href: userRole === "SUPER_ADMIN" ? "/super-admin/dashboard" : "/admin/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      href: userRole === "SUPER_ADMIN" ? "/super-admin/users" : "/admin/users",
      label: "Users Management",
      icon: Users,
    },
    {
      href: userRole === "SUPER_ADMIN" ? "/super-admin/media" : "/admin/media",
      label: "Multimedia Management",
      icon: ImageIcon,
    },
    ...(userRole === "SUPER_ADMIN"
      ? [
          {
            href: "/super-admin/admins",
            label: "Admin Management",
            icon: Shield,
          },
        ]
      : []),
    {
      href: userRole === "SUPER_ADMIN" ? "/super-admin/settings" : "/admin/settings",
      label: "Settings",
      icon: Settings,
    },
  ];

  const isActive = (href: string) => {
    if (href === "/admin/dashboard" || href === "/super-admin/dashboard") {
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

