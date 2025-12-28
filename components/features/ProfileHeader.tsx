"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardBody } from "@/components/ui/Card";
import { AvatarUploadModal } from "@/components/features/profile/AvatarUploadModal";
import { useSession } from "next-auth/react";
import styles from "./ProfileHeader.module.css";

export interface ProfileHeaderProps {
  name: string;
  avatar?: string | null;
  employeeNumber?: string | null;
  userId?: string;
  isViewingOwnProfile?: boolean;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  name,
  avatar,
  employeeNumber,
  userId,
  isViewingOwnProfile = false,
}) => {
  const router = useRouter();
  const { data: session, update } = useSession();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  // Use session avatar if viewing own profile, otherwise use prop avatar
  const currentAvatar = isViewingOwnProfile 
    ? session?.user?.avatar || avatar 
    : avatar;

  // Sync with session when it updates
  useEffect(() => {
    if (isViewingOwnProfile && session?.user?.avatar) {
      // Avatar will be updated via session
    }
  }, [session?.user?.avatar, isViewingOwnProfile]);

  const handleAvatarClick = () => {
    if (isViewingOwnProfile) {
      setIsUploadModalOpen(true);
    }
  };

  const handleUploadComplete = async (avatarUrl: string) => {
    // Trigger session update - this will cause JWT callback to fetch latest user data from database
    await update();
    // Refresh router to update server-rendered components with new avatar
    router.refresh();
  };

  return (
    <>
      <div className={styles.container}>
        <div
          className={styles.avatarContainer}
          onClick={handleAvatarClick}
          style={{
            cursor: isViewingOwnProfile ? "pointer" : "default",
          }}
        >
          {currentAvatar ? (
            <img
              src={currentAvatar}
              alt={name}
              className={styles.avatar}
            />
          ) : (
            <div className={styles.avatarPlaceholder}>
              {name.charAt(0).toUpperCase()}
            </div>
          )}
          {isViewingOwnProfile && (
            <div className={styles.uploadOverlay}>
              <span className={styles.uploadText}>Change</span>
            </div>
          )}
        </div>
        <div className={styles.info}>
          <h1 className={styles.name}>{name}</h1>
          {employeeNumber && (
            <p className={styles.employeeNumber}>#{employeeNumber}</p>
          )}
        </div>
      </div>

      {isViewingOwnProfile && (
        <AvatarUploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          currentAvatar={currentAvatar}
          onUploadComplete={handleUploadComplete}
        />
      )}
    </>
  );
};

