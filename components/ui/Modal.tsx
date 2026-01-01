"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { Button } from "./Button";
import { cn } from "@/lib/utils/cn";
import styles from "./Modal.module.css";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  showCloseButton?: boolean;
  closeOnBackdropClick?: boolean;
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  showCloseButton = true,
  closeOnBackdropClick = true,
  className,
}) => {
  const [mounted, setMounted] = useState(false);
  const [isDesktopLayout, setIsDesktopLayout] = useState(false);

  // Ensure we're in the browser before rendering portal
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Check if we're in admin or trainer layout (both have sidebars)
  useEffect(() => {
    if (!mounted) return;
    
    const checkDesktopLayout = () => {
      const adminLayout = document.querySelector('[data-admin-layout="true"]');
      const trainerLayout = document.querySelector('[data-trainer-layout="true"]');
      setIsDesktopLayout(!!(adminLayout || trainerLayout));
    };
    
    checkDesktopLayout();
    // Check periodically in case layout changes
    const interval = setInterval(checkDesktopLayout, 100);
    return () => clearInterval(interval);
  }, [mounted]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen && mounted) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen, mounted]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen || !mounted) return;
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose, mounted]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnBackdropClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen || !mounted || typeof window === "undefined") return null;

  // Render modal using React Portal at document.body level
  const modalContent = (
    <div
      className={cn(styles.backdrop, isDesktopLayout && styles.backdropDesktop)}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
    >
      <div className={cn(styles.modal, className)}>
        {/* Header */}
        {(title || showCloseButton) && (
          <div className={styles.header}>
            {title && (
              <h2 id="modal-title" className={styles.title}>
                {title}
              </h2>
            )}
            {showCloseButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className={styles.closeButton}
                aria-label="Close modal"
              >
                <X size={20} />
              </Button>
            )}
          </div>
        )}

        {/* Content */}
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );

  // Use React Portal to render at document.body level
  return createPortal(modalContent, document.body);
};

