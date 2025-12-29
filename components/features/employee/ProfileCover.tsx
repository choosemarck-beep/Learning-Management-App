import React from "react";
import { Badge } from "@/components/ui/Badge";
import styles from "./ProfileCover.module.css";

export interface ProfileCoverProps {
  name: string;
  employeeNumber?: string | null;
  avatar?: string | null;
  role: string;
  level: number;
  xp: number;
  rank: string;
  streak: number;
}

export const ProfileCover: React.FC<ProfileCoverProps> = ({
  name,
  employeeNumber,
  avatar,
  role,
  level,
  xp,
  rank,
  streak,
}) => {
  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case "REGIONAL_MANAGER":
        return "Regional Manager";
      case "AREA_MANAGER":
        return "Area Manager";
      case "BRANCH_MANAGER":
        return "Branch Manager";
      case "EMPLOYEE":
        return "Employee";
      case "TRAINER":
        return "Trainer";
      default:
        return role;
    }
  };

  return (
    <div className={styles.container}>
      {/* Profile Picture */}
      <div className={styles.profilePictureContainer}>
        {avatar ? (
          <img 
            src={avatar} 
            alt={name} 
            className={styles.profilePicture}
            onError={(e) => {
              // Fallback to placeholder on error
              e.currentTarget.style.display = 'none';
              const placeholder = e.currentTarget.nextElementSibling as HTMLElement;
              if (placeholder && placeholder.classList.contains(styles.profilePicturePlaceholder)) {
                placeholder.style.display = 'flex';
              }
            }}
          />
          <div 
            className={styles.profilePicturePlaceholder}
            style={{ display: avatar ? 'none' : 'flex' }}
          >
            {name.charAt(0).toUpperCase()}
          </div>
        ) : (
          <div className={styles.profilePicturePlaceholder}>
            {name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Profile Info */}
      <div className={styles.profileInfo}>
        <h1 className={styles.name}>{name}</h1>
        {employeeNumber && (
          <p className={styles.employeeNumber}>{employeeNumber}</p>
        )}
        <div className={styles.roleBadge}>
          <Badge variant="default">{getRoleDisplayName(role)}</Badge>
        </div>

        {/* Quick Stats Grid */}
        <div className={styles.statsGrid}>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Level</span>
            <span className={styles.statValue}>{level}</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>XP</span>
            <span className={styles.statValue}>{xp}</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Rank</span>
            <Badge variant="default">{rank}</Badge>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Streak</span>
            <span className={styles.statValue}>{streak} days</span>
          </div>
        </div>
      </div>
    </div>
  );
};

