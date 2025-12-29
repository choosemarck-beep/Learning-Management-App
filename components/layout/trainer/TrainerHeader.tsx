"use client";

import React, { useState, useRef, useEffect } from "react";
import { Bell } from "lucide-react";
import { UserProfileDropdown } from "@/components/features/admin/UserProfileDropdown";
import styles from "./TrainerHeader.module.css";

interface TrainerHeaderProps {
  userName: string;
  userEmail: string;
  userAvatar: string | null;
  pageTitle?: string;
  pageDescription?: string;
}

export const TrainerHeader: React.FC<TrainerHeaderProps> = ({
  userName,
  userEmail,
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
                <img 
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
              ) : (
                <span>{userName.charAt(0).toUpperCase()}</span>
              )}
            </div>
          </button>

          {showProfileDropdown && (
            <UserProfileDropdown
              userName={userName}
              userEmail={userEmail}
              userRole={"TRAINER" as "ADMIN" | "SUPER_ADMIN" | "TRAINER"}
              userAvatar={userAvatar}
            />
          )}
        </div>
      </div>
    </header>
  );
};

