import React from "react";
import styles from "./EnergyCrystal.module.css";

export interface EnergyCrystalProps {
  size?: number;
  className?: string;
}

export const EnergyCrystal: React.FC<EnergyCrystalProps> = ({
  size = 48,
  className,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${styles.crystal} ${className || ""}`}
      aria-hidden="true"
    >
      {/* Crystal shape with gradient effect */}
      <path
        d="M24 4L32 16L40 20L32 28L24 44L16 28L8 20L16 16L24 4Z"
        fill="url(#crystalGradient)"
        className={styles.crystalFill}
      />
      <path
        d="M24 4L32 16L40 20L32 28L24 44L16 28L8 20L16 16L24 4Z"
        stroke="url(#crystalStroke)"
        strokeWidth="1.5"
        className={styles.crystalStroke}
      />
      <defs>
        <linearGradient id="crystalGradient" x1="24" y1="4" x2="24" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#A78BFA" />
          <stop offset="50%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#4C1D95" />
        </linearGradient>
        <linearGradient id="crystalStroke" x1="24" y1="4" x2="24" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#C084FC" />
          <stop offset="100%" stopColor="#6366F1" />
        </linearGradient>
      </defs>
    </svg>
  );
};

