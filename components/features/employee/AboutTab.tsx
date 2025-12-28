import React from "react";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import styles from "./AboutTab.module.css";

export interface AboutTabProps {
  user: {
    name: string;
    email: string;
    employeeNumber?: string | null;
    company?: { name: string } | null;
    position?: { title: string } | null;
    department?: string | null;
    branch?: string | null;
    hireDate?: Date | null;
    createdAt: Date;
  };
  gamification: {
    level: number;
    xp: number;
    rank: string;
    streak: number;
    diamonds: number;
    progressToNextLevel: number;
  };
}

export const AboutTab: React.FC<AboutTabProps> = ({ user, gamification }) => {
  const formatDate = (date: Date | null | undefined) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className={styles.container}>
      {/* Bio Section */}
      <Card className={styles.card}>
        <CardHeader>
          <h2 className={styles.cardTitle}>About</h2>
        </CardHeader>
        <CardBody>
          <div className={styles.bioSection}>
            <p className={styles.bioText}>
              Member since {formatDate(user.createdAt)}
            </p>
          </div>
        </CardBody>
      </Card>

      {/* Employee Information */}
      <Card className={styles.card}>
        <CardHeader>
          <h2 className={styles.cardTitle}>Employee Information</h2>
        </CardHeader>
        <CardBody>
          <div className={styles.infoGrid}>
            {user.company && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Company</span>
                <span className={styles.infoValue}>{user.company.name}</span>
              </div>
            )}
            {user.position && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Position</span>
                <span className={styles.infoValue}>{user.position.title}</span>
              </div>
            )}
            {user.department && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Department</span>
                <span className={styles.infoValue}>{user.department}</span>
              </div>
            )}
            {user.branch && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Branch</span>
                <span className={styles.infoValue}>{user.branch}</span>
              </div>
            )}
            {user.employeeNumber && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Employee Number</span>
                <span className={styles.infoValue}>{user.employeeNumber}</span>
              </div>
            )}
            {user.hireDate && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Hire Date</span>
                <span className={styles.infoValue}>
                  {formatDate(user.hireDate)}
                </span>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Gamification Stats */}
      <Card className={styles.card}>
        <CardHeader>
          <h2 className={styles.cardTitle}>Your Progress</h2>
        </CardHeader>
        <CardBody>
          <div className={styles.statsSection}>
            <div className={styles.statsGrid}>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Level</span>
                <span className={styles.statValue}>{gamification.level}</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Total XP</span>
                <span className={styles.statValue}>{gamification.xp}</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Rank</span>
                <Badge variant="default">{gamification.rank}</Badge>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Streak</span>
                <span className={styles.statValue}>
                  {gamification.streak} days
                </span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Energy Crystals</span>
                <span className={styles.statValue}>
                  {gamification.diamonds}
                </span>
              </div>
            </div>

            <div className={styles.progressSection}>
              <ProgressBar
                value={gamification.progressToNextLevel}
                showPercentage
                label="Progress to Next Level"
              />
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

