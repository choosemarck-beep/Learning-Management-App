"use client";

import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { AlertCircle, BookOpen, Trophy, Megaphone } from "lucide-react";
import styles from "./TrainerAnnouncementsSection.module.css";

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: "GENERAL" | "QUIZ" | "NEW_TRAINING" | "IMPORTANT";
  trainerId: string | null;
  trainerName?: string | null;
  createdAt: string;
  expiresAt: string | null;
}

export interface TrainerAnnouncementsSectionProps {
  limit?: number;
}

export const TrainerAnnouncementsSection: React.FC<
  TrainerAnnouncementsSectionProps
> = ({ limit = 5 }) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/announcements");
        const data = await response.json();

        if (data.success) {
          setAnnouncements(data.data.slice(0, limit));
        } else {
          setError(data.error || "Failed to load announcements");
        }
      } catch (err) {
        setError("Something went wrong. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnnouncements();
  }, [limit]);

  const getTypeIcon = (type: Announcement["type"]) => {
    switch (type) {
      case "QUIZ":
        return <Trophy size={16} className={styles.typeIcon} />;
      case "NEW_TRAINING":
        return <BookOpen size={16} className={styles.typeIcon} />;
      case "IMPORTANT":
        return <AlertCircle size={16} className={styles.typeIcon} />;
      default:
        return <Megaphone size={16} className={styles.typeIcon} />;
    }
  };

  const getTypeBadgeVariant = (type: Announcement["type"]) => {
    switch (type) {
      case "QUIZ":
        return "default";
      case "NEW_TRAINING":
        return "default";
      case "IMPORTANT":
        return "error";
      default:
        return "default";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <Card className={styles.card}>
        <CardHeader>
          <h2 className={styles.cardTitle}>Announcements</h2>
        </CardHeader>
        <CardBody>
          <p className={styles.loadingText}>Loading announcements...</p>
        </CardBody>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={styles.card}>
        <CardHeader>
          <h2 className={styles.cardTitle}>Announcements</h2>
        </CardHeader>
        <CardBody>
          <p className={styles.errorText}>{error}</p>
        </CardBody>
      </Card>
    );
  }

  if (announcements.length === 0) {
    return (
      <Card className={styles.card}>
        <CardHeader>
          <h2 className={styles.cardTitle}>Announcements</h2>
        </CardHeader>
        <CardBody>
          <p className={styles.emptyText}>No announcements at this time.</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className={styles.card}>
      <CardHeader>
        <h2 className={styles.cardTitle}>Announcements</h2>
      </CardHeader>
      <CardBody className={styles.compactBody}>
        <div className={styles.announcementsList}>
          {announcements.map((announcement) => (
            <div key={announcement.id} className={styles.announcementItem}>
              <div className={styles.announcementHeader}>
                <div className={styles.announcementType}>
                  {getTypeIcon(announcement.type)}
                  <Badge variant={getTypeBadgeVariant(announcement.type)}>
                    {announcement.type.replace("_", " ")}
                  </Badge>
                </div>
                <span className={styles.announcementDate}>
                  {formatDate(announcement.createdAt)}
                </span>
              </div>
              <h3 className={styles.announcementTitle}>{announcement.title}</h3>
              <p className={styles.announcementContent}>{announcement.content}</p>
              {announcement.trainerName && (
                <p className={styles.announcementTrainer}>
                  From: {announcement.trainerName}
                </p>
              )}
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
};

