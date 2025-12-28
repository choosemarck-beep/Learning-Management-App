"use client";

import React from "react";
import styles from "./CarouselPlaceholder.module.css";

export const CarouselPlaceholder: React.FC = () => {
  return (
    <div className={styles.placeholder}>
      <div className={styles.placeholderContent}>
        <div className={styles.placeholderText}>
          <p className={styles.label}>Carousel Banner</p>
          <p className={styles.dimensions}>16:9 Aspect Ratio • Max Height: 200px</p>
          <p className={styles.modes}>Supports: Photo Carousel (4 photos) or Video (looping)</p>
        </div>
      </div>
    </div>
  );
};

