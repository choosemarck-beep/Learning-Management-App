import React from "react";
import styles from "./ProfileContactTab.module.css";

export interface ProfileContactTabProps {
  email: string;
  phone?: string | null;
}

export const ProfileContactTab: React.FC<ProfileContactTabProps> = ({
  email,
  phone,
}) => {
  return (
    <div className={styles.container}>
      <div className={styles.infoGrid}>
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>Email</span>
          <span className={styles.infoValue}>{email}</span>
        </div>
        {phone && (
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Phone</span>
            <span className={styles.infoValue}>{phone}</span>
          </div>
        )}
      </div>
    </div>
  );
};

