"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Edit, Trash2, Eye, FileText, Plus } from "lucide-react";
import styles from "./UserTableContextMenu.module.css";

interface ContextMenuOption {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: "default" | "danger";
}

interface UserTableContextMenuProps {
  isOpen: boolean;
  x: number;
  y: number;
  onClose: () => void;
  options: ContextMenuOption[];
}

export const UserTableContextMenu: React.FC<UserTableContextMenuProps> = ({
  isOpen,
  x,
  y,
  onClose,
  options,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Set mounted immediately on client side
    if (typeof window !== 'undefined') {
      setMounted(true);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  // Calculate position to appear beside the name element with viewport boundary checking
  const offsetX = 10; // 10px to the right of name element
  const offsetY = 0; // Align with top of name element (no vertical offset)
  
  useEffect(() => {
    if (!isOpen || !menuRef.current) {
      return;
    }

    const menu = menuRef.current;
    
    // Set initial position (hidden) to calculate dimensions
    menu.style.visibility = 'hidden';
    menu.style.display = 'block';
    menu.style.left = `${x + offsetX}px`;
    menu.style.top = `${y + offsetY}px`;
    
    // Use requestAnimationFrame to ensure layout is calculated
    requestAnimationFrame(() => {
      if (!menuRef.current || !isOpen) return;
      
      const menuRect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let finalX = x + offsetX; // Right edge of button + 10px offset
      let finalY = y + offsetY; // Top edge of button (aligned)

      // Check right boundary - if menu would overflow, show to the left of button
      if (finalX + menuRect.width > viewportWidth - 10) {
        finalX = x - menuRect.width - offsetX; // Show to the left of button
      }

      // Check bottom boundary - if menu would overflow, adjust vertically
      if (finalY + menuRect.height > viewportHeight - 10) {
        finalY = viewportHeight - menuRect.height - 10; // Move up to fit
      }

      // Ensure menu stays within viewport bounds
      finalX = Math.max(10, Math.min(finalX, viewportWidth - menuRect.width - 10));
      finalY = Math.max(10, Math.min(finalY, viewportHeight - menuRect.height - 10));

      if (menuRef.current && isOpen) {
        menuRef.current.style.left = `${finalX}px`;
        menuRef.current.style.top = `${finalY}px`;
        menuRef.current.style.visibility = 'visible';
      }
    });
  }, [isOpen, x, y, offsetX, offsetY]);

  if (!isOpen) return null;

  const menuContent = (
    <div
      ref={menuRef}
      className={styles.contextMenu}
      style={{
        position: "fixed",
        left: `${x + offsetX}px`, // Initial position, will be adjusted by useEffect
        top: `${y + offsetY}px`, // Initial position, will be adjusted by useEffect
        visibility: 'hidden', // Hidden initially, will be shown after positioning calculation
        zIndex: 99999, // Ensure it's above table container
      }}
    >
      {options.map((option, index) => (
        <button
          key={index}
          className={`${styles.menuItem} ${
            option.variant === "danger" ? styles.danger : ""
          }`}
          onClick={() => {
            option.onClick();
            onClose();
          }}
        >
          <span className={styles.icon}>{option.icon}</span>
          <span className={styles.label}>{option.label}</span>
        </button>
      ))}
    </div>
  );

  // Render using portal to document.body to ensure it's outside any positioning context
  // Only use portal if we're in the browser and body exists
  if (typeof window !== 'undefined' && document.body) {
    return createPortal(menuContent, document.body);
  }
  
  // Fallback to regular rendering if portal isn't available
  return menuContent;
};

