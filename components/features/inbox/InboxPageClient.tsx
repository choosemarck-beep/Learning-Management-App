"use client";

import React, { useState, useEffect } from "react";
import { Bell, Mail, Megaphone, Inbox } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { InboxTab } from "./InboxTab";
import toast from "react-hot-toast";
import styles from "./InboxPageClient.module.css";

type TabType = "all" | "notifications" | "messages" | "announcements";

interface Notification {
  id: string;
  type: string;
  title: string;
  content: string;
  isRead: boolean;
  link: string | null;
  createdAt: string;
}

interface Message {
  id: string;
  senderId: string;
  subject: string | null;
  content: string;
  isRead: boolean;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    avatar: string | null;
  };
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: string;
  priority: number;
  createdAt: string;
}

export const InboxPageClient: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [unreadCounts, setUnreadCounts] = useState({
    notifications: 0,
    messages: 0,
    total: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchInboxData();
  }, []);

  const fetchInboxData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/inbox");
      const data = await response.json();

      if (data.success) {
        setNotifications(data.data.notifications);
        setMessages(data.data.messages);
        setAnnouncements(data.data.announcements);
        setUnreadCounts(data.data.unreadCounts);
      } else {
        toast.error(data.error || "Failed to load inbox");
      }
    } catch (error) {
      console.error("Error fetching inbox:", error);
      toast.error("Failed to load inbox");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string, type: "notification" | "message") => {
    try {
      const response = await fetch(`/api/inbox/${id}/read?type=${type}`, {
        method: "PATCH",
      });

      const data = await response.json();

      if (data.success) {
        // Update local state
        if (type === "notification") {
          setNotifications((prev) =>
            prev.map((n) =>
              n.id === id ? { ...n, isRead: true } : n
            )
          );
          setUnreadCounts((prev) => ({
            ...prev,
            notifications: Math.max(0, prev.notifications - 1),
            total: Math.max(0, prev.total - 1),
          }));
        } else {
          setMessages((prev) =>
            prev.map((m) => (m.id === id ? { ...m, isRead: true } : m))
          );
          setUnreadCounts((prev) => ({
            ...prev,
            messages: Math.max(0, prev.messages - 1),
            total: Math.max(0, prev.total - 1),
          }));
        }
      } else {
        toast.error(data.error || "Failed to mark as read");
      }
    } catch (error) {
      console.error("Error marking as read:", error);
      toast.error("Failed to mark as read");
    }
  };

  const tabs = [
    { id: "all" as TabType, label: "All", icon: Inbox },
    {
      id: "notifications" as TabType,
      label: "Notifications",
      icon: Bell,
      badge: unreadCounts.notifications,
    },
    {
      id: "messages" as TabType,
      label: "Messages",
      icon: Mail,
      badge: unreadCounts.messages,
    },
    {
      id: "announcements" as TabType,
      label: "Announcements",
      icon: Megaphone,
    },
  ];

  const getTabContent = () => {
    switch (activeTab) {
      case "notifications":
        return (
          <InboxTab
            items={notifications.map((n) => ({
              id: n.id,
              type: "notification",
              title: n.title,
              content: n.content,
              isRead: n.isRead,
              link: n.link,
              createdAt: n.createdAt,
            }))}
            onMarkAsRead={(id) => handleMarkAsRead(id, "notification")}
            emptyMessage="No notifications"
          />
        );
      case "messages":
        return (
          <InboxTab
            items={messages.map((m) => ({
              id: m.id,
              type: "message",
              title: m.subject || "No subject",
              content: m.content,
              isRead: m.isRead,
              sender: m.sender,
              createdAt: m.createdAt,
            }))}
            onMarkAsRead={(id) => handleMarkAsRead(id, "message")}
            emptyMessage="No messages"
          />
        );
      case "announcements":
        return (
          <InboxTab
            items={announcements.map((a) => ({
              id: a.id,
              type: "announcement",
              title: a.title,
              content: a.content,
              isRead: true, // Announcements are always "read"
              createdAt: a.createdAt,
            }))}
            emptyMessage="No announcements"
          />
        );
      default:
        // All tab - combine all items
        const allItems = [
          ...notifications.map((n) => ({
            id: n.id,
            type: "notification" as const,
            title: n.title,
            content: n.content,
            isRead: n.isRead,
            link: n.link,
            createdAt: n.createdAt,
          })),
          ...messages.map((m) => ({
            id: m.id,
            type: "message" as const,
            title: m.subject || "No subject",
            content: m.content,
            isRead: m.isRead,
            sender: m.sender,
            createdAt: m.createdAt,
          })),
          ...announcements.map((a) => ({
            id: a.id,
            type: "announcement" as const,
            title: a.title,
            content: a.content,
            isRead: true,
            createdAt: a.createdAt,
          })),
        ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        return (
          <InboxTab
            items={allItems}
            onMarkAsRead={(id, type) => {
              if (type === "notification" || type === "message") {
                handleMarkAsRead(id, type);
              }
            }}
            emptyMessage="No items in inbox"
          />
        );
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Inbox</h1>
        {unreadCounts.total > 0 && (
          <span className={styles.unreadBadge}>{unreadCounts.total}</span>
        )}
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              className={`${styles.tab} ${
                activeTab === tab.id ? styles.active : ""
              }`}
              onClick={() => setActiveTab(tab.id)}
              aria-label={tab.label}
              title={tab.label}
            >
              <Icon size={20} />
              {tab.badge && tab.badge > 0 && (
                <span className={styles.badge}>{tab.badge}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className={styles.content}>
        {isLoading ? (
          <div className={styles.loading}>
            <p>Loading...</p>
          </div>
        ) : (
          getTabContent()
        )}
      </div>
    </div>
  );
};

