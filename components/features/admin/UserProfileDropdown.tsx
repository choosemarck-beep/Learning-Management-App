"use client";

import React from "react";
import { useSession, signOut } from "next-auth/react";
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
  userAvatar: propAvatar,
}) => {
  const { data: session } = useSession();
  
  // Use session avatar if available (real-time updates), fallback to prop (SSR)
  const userAvatar = session?.user?.avatar || propAvatar || null;

  const handleLogout = async () => {
    // Clear remembered user from localStorage
    if (typeof window !== "undefined") {
      localStorage.removeItem("rememberedUser");
    }
    // Sign out without redirect to bypass NextAuth's NEXTAUTH_URL dependency
    await signOut({ redirect: false });
    
    // Hard redirect to login using current origin (works in both dev and production)
    if (typeof window !== "undefined") {
      window.location.href = `${window.location.origin}/login`;
    }
  };

  return (
    <div className={styles.dropdown}>
      {/* User Info Header */}
      <div className={styles.userHeader}>
        <div className={styles.avatar}>
          {userAvatar ? (
            <>
              <img 
                key={userAvatar}
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

