"use client";

import React from "react";
import { Modal } from "@/components/ui/Modal";
import { CarouselHeader } from "@/components/features/dashboard/CarouselHeader";
import styles from "./CarouselPreviewModal.module.css";

export interface CarouselImage {
  id: string;
  imageUrl: string;
  title?: string | null;
  description?: string | null;
}

type CarouselMode = "PHOTO_CAROUSEL" | "VIDEO";

interface CarouselPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: CarouselMode;
  images: CarouselImage[];
  videoUrl: string | null;
}

export const CarouselPreviewModal: React.FC<CarouselPreviewModalProps> = ({
  isOpen,
  onClose,
  mode,
  images,
  videoUrl,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Carousel Preview"
      showCloseButton={true}
      className={styles.modal}
    >
      <div className={styles.previewContent}>
        <p className={styles.previewDescription}>
          This is how the carousel appears on staff dashboards
        </p>
        <div className={styles.carouselWrapper}>
          {mode === "VIDEO" && videoUrl ? (
            <CarouselHeader
              mode="VIDEO"
              images={[]}
              videoUrl={videoUrl}
              autoPlayInterval={5000}
            />
          ) : images.length > 0 ? (
            <CarouselHeader
              mode={mode}
              images={images}
              autoPlayInterval={5000}
            />
          ) : (
            <div className={styles.noContent}>
              <p>No carousel content to preview</p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

