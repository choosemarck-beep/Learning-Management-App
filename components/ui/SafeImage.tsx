"use client";

import React, { useState } from "react";
import { Image as ImageIcon } from "lucide-react";
import styles from "./SafeImage.module.css";

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string | null | undefined;
  alt: string;
  fallbackIcon?: React.ReactNode;
  className?: string;
}

/**
 * SafeImage component with automatic fallback to placeholder on error
 * Prevents broken image icons and maintains layout stability
 */
export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt,
  fallbackIcon,
  className = "",
  ...props
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // If no src or error occurred, show placeholder
  if (!src || hasError) {
    return (
      <div className={`${styles.placeholder} ${className}`} {...props}>
        {fallbackIcon || <ImageIcon size={24} className={styles.placeholderIcon} />}
      </div>
    );
  }

  return (
    <>
      {isLoading && (
        <div className={`${styles.loadingPlaceholder} ${className}`} {...props}>
          {fallbackIcon || <ImageIcon size={24} className={styles.placeholderIcon} />}
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={className}
        onError={() => {
          setHasError(true);
          setIsLoading(false);
        }}
        onLoad={() => setIsLoading(false)}
        style={{ display: isLoading ? "none" : "block" }}
        {...props}
      />
    </>
  );
};

