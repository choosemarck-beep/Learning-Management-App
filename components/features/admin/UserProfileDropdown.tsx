"use client";

import React from "react";
import { signOut } from "next-auth/react";
import { User, Settings, LogOut } from "lucide-react";
import styles from "./UserProfileDropdown.module.css";

interface UserProfileDropdownProps {
  userName: string;
  userEmail: string;
  userRole: "ADMIN" | "SUPER_ADMIN" | "TRAINER";
  userAvatar: string | null;
}

export const UserProfileDropdown: React.FC<UserProfileDropdownProps> = ({
  userName,
  userEmail,
  userRole,
  userAvatar,
}) => {
  const handleLogout = async () => {
    // Use absolute URL to prevent redirecting to localhost
    const loginUrl = typeof window !== "undefined" 
      ? `${window.location.origin}/login`
      : "/login";
    await signOut({ callbackUrl: loginUrl });
  };

  return (
    <div className={styles.dropdown}>
      {/* User Info Header */}
      <div className={styles.userHeader}>
        <div className={styles.avatar}>
          {userAvatar ? (
            <img src={userAvatar} alt={userName} />
          ) : (
            <span>{userName.charAt(0).toUpperCase()}</span>
          )}
        </div>
        <div className={styles.userDetails}>
          <p className={styles.name}>{userName}</p>
          <p className={styles.email}>{userEmail}</p>
          <span className={styles.role}>
            {userRole === "SUPER_ADMIN"
              ? "Super Admin"
              : userRole === "ADMIN"
              ? "Admin"
              : "Trainer"}
          </span>
        </div>
      </div>

      {/* Menu Items */}
      <div className={styles.menu}>
        <button className={styles.menuItem} disabled>
          <User size={18} />
          <span>Profile</span>
          <span className={styles.comingSoon}>Coming soon</span>
        </button>
        <button className={styles.menuItem} disabled>
          <Settings size={18} />
          <span>Settings</span>
          <span className={styles.comingSoon}>Coming soon</span>
        </button>
        <div className={styles.divider} />
        <button className={`${styles.menuItem} ${styles.logoutItem}`} onClick={handleLogout}>
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

