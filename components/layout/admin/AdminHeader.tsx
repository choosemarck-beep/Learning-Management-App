"use client";

import React, { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
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
  userAvatar: propAvatar,
  pageTitle,
  pageDescription,
}) => {
  const { data: session } = useSession();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Use session avatar if available (real-time updates), fallback to prop (SSR)
  const userAvatar = session?.user?.avatar || propAvatar || null;

  // Fetch unread notification count
  useEffect(() => {
    const fetchNotificationCount = async () => {
      try {
        const response = await fetch("/api/inbox");
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data?.unreadCounts) {
            setNotificationCount(data.data.unreadCounts.total || 0);
          }
        }
      } catch (error) {
        console.error("[AdminHeader] Error fetching notification count:", error);
      }
    };

    fetchNotificationCount();
    // Poll every 30 seconds for updates
    const interval = setInterval(fetchNotificationCount, 30000);
    return () => clearInterval(interval);
  }, []);

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
            <span className={styles.notificationBadge}>
              {notificationCount > 99 ? '99+' : notificationCount}
            </span>
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
                <>
                  <img 
                    key={`avatar-${session?.user?.avatar || userAvatar}`}
                    src={userAvatar} 
                    alt={userName}
                    onError={(e) => {
                      // Fallback to placeholder on error
                      e.currentTarget.style.display = 'none';
                      const placeholder = e.currentTarget.nextElementSibling as HTMLElement;
                      if (placeholder && placeholder.classList.contains('avatar-placeholder')) {
                        placeholder.style.display = 'flex';
                      }
                    }}
                  />
                  <div 
                    className="avatar-placeholder"
                    style={{ 
                      display: userAvatar ? 'none' : 'flex',
                      width: '100%',
                      height: '100%',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'var(--color-primary-purple)',
                      borderRadius: '50%',
                      color: 'white',
                      fontSize: '14px',
                      fontWeight: 'bold'
                    }}
                  >
                    {userName.charAt(0).toUpperCase()}
                  </div>
                </>
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
