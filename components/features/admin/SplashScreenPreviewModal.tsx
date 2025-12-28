"use client";

import React from "react";
import { Modal } from "@/components/ui/Modal";
import styles from "./SplashScreenPreviewModal.module.css";

interface SplashScreenPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
}

export const SplashScreenPreviewModal: React.FC<SplashScreenPreviewModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Splash Screen Preview"
      showCloseButton={true}
      className={styles.modal}
    >
      <div className={styles.previewContent}>
        <p className={styles.previewDescription}>
          This is how the splash screen appears when users first open the app
        </p>
        {imageUrl ? (
          <div className={styles.imageWrapper}>
            <img
              src={imageUrl}
              alt="Splash screen preview"
              className={styles.previewImage}
            />
          </div>
        ) : (
          <div className={styles.noImage}>
            <p>No splash screen image set</p>
          </div>
        )}
      </div>
    </Modal>
  );
};

