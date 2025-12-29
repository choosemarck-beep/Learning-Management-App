"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User } from "lucide-react";
import styles from "./ProfileWorkTab.module.css";

export interface DirectManager {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: string;
  employeeNumber: string | null;
}

export interface ProfileWorkTabProps {
  company?: { name: string } | null;
  position?: { title: string } | null;
  department?: string | null;
  branch?: string | null;
  area?: string | null;
  region?: string | null;
  hireDate?: Date | null;
  createdAt: Date;
  userId?: string;
}

export const ProfileWorkTab: React.FC<ProfileWorkTabProps> = ({
  company,
  position,
  department,
  branch,
  area,
  region,
  hireDate,
  createdAt,
  userId,
}) => {
  const router = useRouter();
  const [directManager, setDirectManager] = useState<DirectManager | null>(null);
  const [isLoadingManager, setIsLoadingManager] = useState(false);

  useEffect(() => {
    if (userId) {
      setIsLoadingManager(true);
      fetch(`/api/user/direct-manager?userId=${userId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data) {
            setDirectManager(data.data);
          }
        })
        .catch((error) => {
          console.error("Error fetching direct manager:", error);
        })
        .finally(() => {
          setIsLoadingManager(false);
        });
    }
  }, [userId]);

  const handleManagerClick = (manager: DirectManager) => {
    // Determine the correct profile route based on manager role
    let profileRoute = `/employee/profile?id=${manager.id}`;
    
    if (manager.role === "REGIONAL_MANAGER") {
      profileRoute = `/employee/regional-manager/profile?id=${manager.id}`;
    } else if (manager.role === "AREA_MANAGER") {
      profileRoute = `/employee/area-manager/profile?id=${manager.id}`;
    } else if (manager.role === "TRAINER") {
      profileRoute = `/employee/trainer/profile?id=${manager.id}`;
    } else if (manager.role === "ADMIN" || manager.role === "SUPER_ADMIN") {
      // Admins don't have profile pages, redirect to admin dashboard
      return;
    }
    
    router.push(profileRoute);
  };
  const formatDate = (date: Date | null | undefined) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className={styles.container}>
        <div className={styles.infoGrid}>
          {company && (
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Company</span>
              <span className={styles.infoValue}>{company.name}</span>
            </div>
          )}
          {position && (
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Position</span>
              <span className={styles.infoValue}>{position.title}</span>
            </div>
          )}
          {department && (
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Department</span>
              <span className={styles.infoValue}>{department}</span>
            </div>
          )}
          {region && (
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Region</span>
              <span className={styles.infoValue}>{region}</span>
            </div>
          )}
          {area && (
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Area</span>
              <span className={styles.infoValue}>{area}</span>
            </div>
          )}
          {branch && (
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Branch</span>
              <span className={styles.infoValue}>{branch}</span>
            </div>
          )}
          {hireDate && (
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Hire Date</span>
              <span className={styles.infoValue}>{formatDate(hireDate)}</span>
            </div>
          )}
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Member Since</span>
            <span className={styles.infoValue}>{formatDate(createdAt)}</span>
          </div>
          {directManager && (
            <div className={styles.managerItem}>
              <span className={styles.infoLabel}>Direct Manager</span>
              <button
                className={styles.managerButton}
                onClick={() => handleManagerClick(directManager)}
              >
                <div className={styles.managerAvatar}>
                  {directManager.avatar ? (
                    <img
                      src={directManager.avatar}
                      alt={directManager.name}
                      className={styles.managerAvatarImage}
                      onError={(e) => {
                        // Fallback to placeholder on error
                        e.currentTarget.style.display = 'none';
                        const placeholder = e.currentTarget.nextElementSibling as HTMLElement;
                        if (placeholder && placeholder.classList.contains(styles.managerAvatarPlaceholder)) {
                          placeholder.style.display = 'flex';
                        }
                      }}
                    />
                  ) : null}
                  <div 
                    className={styles.managerAvatarPlaceholder}
                    style={{ display: directManager.avatar ? 'none' : 'flex' }}
                  >
                    {directManager.name.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div className={styles.managerInfo}>
                  <span className={styles.managerName}>{directManager.name}</span>
                  <span className={styles.managerRole}>
                    {directManager.role
                      .split("_")
                      .map(
                        (word) =>
                          word.charAt(0) + word.slice(1).toLowerCase()
                      )
                      .join(" ")}
                  </span>
                </div>
                <User size={16} className={styles.managerIcon} />
              </button>
            </div>
          )}
        </div>
    </div>
  );
};

