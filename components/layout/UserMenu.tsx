"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  FileText,
  Video,
  BookOpen,
  Inbox,
  Settings,
  LogOut,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import styles from "./UserMenu.module.css";

export interface UserMenuProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: string;
  dashboardRoute: string;
}

export const UserMenu: React.FC<UserMenuProps> = ({
  isOpen,
  onClose,
  userRole,
  dashboardRoute,
}) => {
  const router = useRouter();
  const { data: session } = useSession();

  const userAvatar = session?.user?.avatar;
  const userName = session?.user?.name || "User";
  const userEmployeeNumber = session?.user?.employeeNumber || null;

  // Get profile route based on role
  const getProfileRoute = () => {
    switch (userRole) {
      case "REGIONAL_MANAGER":
        return "/employee/regional-manager/profile";
      case "AREA_MANAGER":
        return "/employee/area-manager/profile";
      case "TRAINER":
        return "/employee/trainer/profile";
      case "BRANCH_MANAGER":
      case "EMPLOYEE":
      default:
        return "/employee/profile";
    }
  };

  const handleProfileClick = () => {
    const profileRoute = getProfileRoute();
    router.push(profileRoute);
    onClose();
  };

  const handleMenuClick = (route: string) => {
    router.push(route);
    onClose();
  };

  const handleLogout = async () => {
    onClose();
    // Sign out without redirect to bypass NextAuth's NEXTAUTH_URL dependency
    await signOut({ redirect: false });
    
    // Hard redirect to login using current origin (works in both dev and production)
    if (typeof window !== "undefined") {
      window.location.href = `${window.location.origin}/login`;
    }
  };

  const [mounted, setMounted] = useState(false);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Close menu on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Ensure component is mounted before using portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Menu items with icons only
  const menuItems = [
    {
      id: "dashboard",
      icon: LayoutDashboard,
      route: dashboardRoute,
      label: "Dashboard",
    },
    {
      id: "training-passport",
      icon: FileText,
      route: "/employee/training-passport",
      label: "Training Passport",
    },
    {
      id: "reels",
      icon: Video,
      route: "/reels",
      label: "Reels",
    },
    {
      id: "courses",
      icon: BookOpen,
      route: "/courses",
      label: "Courses",
    },
    {
      id: "inbox",
      icon: Inbox,
      route: "/inbox",
      label: "Inbox",
    },
    {
      id: "settings",
      icon: Settings,
      route: "/settings",
      label: "Settings",
    },
  ];

  if (!mounted) return null;

  const menuContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className={styles.backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          {/* Menu Panel */}
          <motion.div
            className={styles.menuPanel}
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
          >
            {/* Close Button */}
            <button
              className={styles.closeButton}
              onClick={onClose}
              aria-label="Close menu"
            >
              <X size={24} />
            </button>

            {/* User Profile Section */}
            <button
              className={styles.profileSection}
              onClick={handleProfileClick}
              aria-label="View profile"
            >
              <div className={styles.profileAvatar}>
                {userAvatar ? (
                  <img
                    src={userAvatar}
                    alt={userName}
                    className={styles.profileAvatarImage}
                  />
                ) : (
                  <div className={styles.profileAvatarPlaceholder}>
                    {userName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className={styles.profileInfo}>
                <h2 className={styles.profileName}>{userName}</h2>
                <p className={styles.profileEmployeeNumber}>
                  {userEmployeeNumber || "Employee"}
                </p>
              </div>
            </button>

            {/* Menu Items */}
            <div className={styles.menuItems}>
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    className={styles.menuItem}
                    onClick={() => handleMenuClick(item.route)}
                    aria-label={item.label}
                    title={item.label}
                  >
                    <Icon size={24} className={styles.menuIcon} />
                  </button>
                );
              })}
            </div>

            {/* Logout Button */}
            <div className={styles.logoutSection}>
              <button
                className={styles.logoutButton}
                onClick={handleLogout}
                aria-label="Logout"
              >
                <LogOut size={24} className={styles.logoutIcon} />
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  // Render using React Portal at document.body level to cover everything
  return createPortal(menuContent, document.body);
};

