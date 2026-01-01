"use client";

import React from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { CheckCircle2, X } from "lucide-react";
import styles from "./MessageDetailModal.module.css";

interface InboxItem {
  id: string;
  type: "notification" | "message" | "announcement";
  title: string;
  content: string;
  isRead: boolean;
  link?: string | null;
  sender?: {
    id: string;
    name: string;
    avatar: string | null;
  };
  createdAt: string;
}

interface MessageDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: InboxItem;
  onMarkAsRead?: () => void;
}

export const MessageDetailModal: React.FC<MessageDetailModalProps> = ({
  isOpen,
  onClose,
  item,
  onMarkAsRead,
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      const hours = Math.floor(diff / (1000 * 60 * 60));
      if (hours === 0) {
        const minutes = Math.floor(diff / (1000 * 60));
        return minutes <= 1 ? "Just now" : `${minutes} minutes ago`;
      }
      return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
    } else if (days === 1) {
      return "Yesterday";
    } else if (days < 7) {
      return `${days} days ago`;
    } else {
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
  };

  const handleMarkAsRead = () => {
    if (onMarkAsRead) {
      onMarkAsRead();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item.title}
      showCloseButton={true}
      closeOnBackdropClick={true}
      className={styles.modal}
    >
      <div className={styles.modalContent}>
        <div className={styles.messageHeader}>
          {item.sender && (
            <div className={styles.senderInfo}>
              {item.sender.avatar ? (
                <img
                  src={item.sender.avatar}
                  alt={item.sender.name}
                  className={styles.senderAvatar}
                />
              ) : (
                <div className={styles.senderAvatarPlaceholder}>
                  {item.sender.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className={styles.senderDetails}>
                <span className={styles.senderName}>{item.sender.name}</span>
                <span className={styles.messageDate}>{formatDate(item.createdAt)}</span>
              </div>
            </div>
          )}
          {!item.sender && (
            <div className={styles.messageDate}>{formatDate(item.createdAt)}</div>
          )}
        </div>

        <div className={styles.messageContent}>
          <p className={styles.contentText}>{item.content}</p>
        </div>

        {item.link && (
          <div className={styles.messageLink}>
            <Button
              variant="primary"
              onClick={() => {
                if (item.link) {
                  window.location.href = item.link;
                }
              }}
              className={styles.linkButton}
            >
              View Details
            </Button>
          </div>
        )}

        <div className={styles.modalActions}>
          {!item.isRead && onMarkAsRead && (item.type === "notification" || item.type === "message") && (
            <Button
              variant="outline"
              onClick={handleMarkAsRead}
              className={styles.markReadButton}
            >
              <CheckCircle2 size={16} />
              Mark as read
            </Button>
          )}
          <Button
            variant="primary"
            onClick={onClose}
            className={styles.closeButton}
          >
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

