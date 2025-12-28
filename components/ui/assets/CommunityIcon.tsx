import React from "react";
import { Users } from "lucide-react";
import styles from "./CommunityIcon.module.css";

export interface CommunityIconProps {
  size?: number;
  className?: string;
}

export const CommunityIcon: React.FC<CommunityIconProps> = ({
  size = 48,
  className,
}) => {
  return (
    <div className={`${styles.communityWrapper} ${className || ""}`}>
      <Users
        size={size}
        className={styles.communityIcon}
        strokeWidth={2}
        aria-hidden="true"
      />
    </div>
  );
};

