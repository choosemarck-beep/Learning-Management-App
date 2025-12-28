"use client";

import React, { useState, useRef, useEffect } from "react";
import { Bell } from "lucide-react";
import { UserProfileDropdown } from "@/components/features/admin/UserProfileDropdown";
import styles from "./AdminHeader.module.css";

interface AdminHeaderProps {
  userName: string;
  userEmail: string;
  userRole: "ADMIN" | "SUPER_ADMIN";
  userAvatar: string | null;
  pageTitle?: string;
  pageDescription?: string;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  userName,
  userEmail,
  userRole,
  userAvatar,
  pageTitle,
  pageDescription,
}) => {
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <header className={styles.header}>
      {/* Left Side - Page Title and Description */}
      {(pageTitle || pageDescription) && (
        <div className={styles.pageInfo}>
          {pageTitle && <h1 className={styles.pageTitle}>{pageTitle}</h1>}
          {pageDescription && (
            <p className={styles.pageDescription}>{pageDescription}</p>
          )}
        </div>
      )}

      {/* Right Side Actions */}
      <div className={styles.actions}>
        {/* Notifications */}
        <button
          className={styles.notificationButton}
          aria-label="Notifications"
          onClick={() => {
            // TODO: Implement notifications
            console.log("Notifications clicked");
          }}
        >
          <Bell size={20} />
          {notificationCount > 0 && (
            <span className={styles.notificationBadge}>{notificationCount}</span>
          )}
        </button>

        {/* User Profile Dropdown */}
        <div ref={dropdownRef} className={styles.profileWrapper}>
          <button
            className={styles.profileButton}
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            aria-label="User menu"
          >
            <div className={styles.profileAvatar}>
              {userAvatar ? (
                <img src={userAvatar} alt={userName} />
              ) : (
                <span>{userName.charAt(0).toUpperCase()}</span>
              )}
            </div>
          </button>

          {showProfileDropdown && (
            <UserProfileDropdown
              userName={userName}
              userEmail={userEmail}
              userRole={userRole}
              userAvatar={userAvatar}
            />
          )}
        </div>
      </div>
    </header>
  );
};
