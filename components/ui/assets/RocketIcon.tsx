import React from "react";
import { Rocket } from "lucide-react";
import styles from "./RocketIcon.module.css";

export interface RocketIconProps {
  size?: number;
  className?: string;
}

export const RocketIcon: React.FC<RocketIconProps> = ({
  size = 48,
  className,
}) => {
  return (
    <div className={`${styles.rocketWrapper} ${className || ""}`}>
      <Rocket
        size={size}
        className={styles.rocketIcon}
        strokeWidth={2}
        aria-hidden="true"
      />
    </div>
  );
};

