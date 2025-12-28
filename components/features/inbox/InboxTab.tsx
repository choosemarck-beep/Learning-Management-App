"use client";

import React from "react";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Circle, CheckCircle2 } from "lucide-react";
import styles from "./InboxTab.module.css";

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

interface InboxTabProps {
  items: InboxItem[];
  onMarkAsRead?: (id: string, type?: "notification" | "message" | "announcement") => void;
  emptyMessage: string;
}

export const InboxTab: React.FC<InboxTabProps> = ({
  items,
  onMarkAsRead,
  emptyMessage,
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return "Today";
    } else if (days === 1) {
      return "Yesterday";
    } else if (days < 7) {
      return `${days} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (items.length === 0) {
    return (
      <Card className={styles.emptyCard}>
        <CardBody>
          <div className={styles.emptyState}>
            <p className={styles.emptyMessage}>{emptyMessage}</p>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className={styles.itemsList}>
      {items.map((item) => (
        <Card
          key={item.id}
          className={`${styles.itemCard} ${!item.isRead ? styles.unread : ""}`}
        >
          <CardBody>
            <div className={styles.itemContent}>
              <div className={styles.itemHeader}>
                <div className={styles.itemTitleRow}>
                  {!item.isRead && (
                    <Circle size={8} className={styles.unreadDot} />
                  )}
                  <h3 className={styles.itemTitle}>{item.title}</h3>
                </div>
                {item.sender && (
                  <div className={styles.sender}>
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
                    <span className={styles.senderName}>{item.sender.name}</span>
                  </div>
                )}
              </div>
              <p className={styles.itemText}>{item.content}</p>
              <div className={styles.itemFooter}>
                <span className={styles.itemDate}>{formatDate(item.createdAt)}</span>
                {!item.isRead &&
                  onMarkAsRead &&
                  (item.type === "notification" || item.type === "message") && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onMarkAsRead(item.id, item.type)}
                      className={styles.markReadButton}
                    >
                      <CheckCircle2 size={16} />
                      Mark as read
                    </Button>
                  )}
              </div>
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  );
};

