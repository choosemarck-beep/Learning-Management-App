import React from "react";
import { Sparkles } from "lucide-react";
import styles from "./StarCluster.module.css";

export interface StarClusterProps {
  size?: number;
  className?: string;
}

export const StarCluster: React.FC<StarClusterProps> = ({
  size = 48,
  className,
}) => {
  return (
    <div className={`${styles.clusterWrapper} ${className || ""}`}>
      <Sparkles
        size={size}
        className={styles.clusterIcon}
        strokeWidth={2}
        aria-hidden="true"
      />
    </div>
  );
};

