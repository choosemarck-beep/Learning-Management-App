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
    try {
      console.log("[ProfileHeader] Avatar upload complete, updating session...");
      
      // Trigger session update - this will cause JWT callback to fetch latest user data from database
      // In NextAuth v5, calling update() triggers the JWT callback with trigger === "update"
      await update();
      
      console.log("[ProfileHeader] Session update triggered, waiting for JWT callback to complete...");
      
      // Wait longer for JWT callback to complete and fetch new avatar from database
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Trigger another update to ensure session propagates to all components
      await update();
      
      console.log("[ProfileHeader] Second session update triggered, waiting for propagation...");
      
      // Wait for session to propagate to all components
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Force a router refresh to update server-rendered components with new avatar
      router.refresh();
      
      // Additional refresh after a short delay to ensure all components update
      setTimeout(() => {
        router.refresh();
      }, 300);
      
      console.log("[ProfileHeader] Session update and router refresh completed");
    } catch (error) {
      console.error("[ProfileHeader] Error updating session after avatar upload:", error);
      // Still refresh router even if update fails
      router.refresh();
      // Retry update after error
      setTimeout(async () => {
        try {
          await update();
          router.refresh();
        } catch (retryError) {
          console.error("[ProfileHeader] Retry update failed:", retryError);
        }
      }, 500);
    }
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
              key={`avatar-${session?.user?.avatar || currentAvatar}`}
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

