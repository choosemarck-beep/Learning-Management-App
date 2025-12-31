import React from "react";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma/client";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Flame } from "lucide-react";
import { DashboardCoursesSection } from "@/components/features/dashboard/DashboardCoursesSection";
import styles from "./page.module.css";

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return null;
    }

    // Fetch full user data from database to get stats
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        level: true,
        xp: true,
        rank: true,
        streak: true,
      },
    });

    const userLevel = userData?.level || 1;
    const userXP = userData?.xp || 0;
    const userRank = userData?.rank || "Stellar Cadet";
    const userStreak = userData?.streak || 0;

    // Calculate XP for next level (simplified - 1000 XP per level)
    const xpForCurrentLevel = (userLevel - 1) * 1000;
    const xpForNextLevel = userLevel * 1000;
    const xpInCurrentLevel = userXP - xpForCurrentLevel;
    const xpNeededForNextLevel = xpForNextLevel - xpForCurrentLevel;
    const progressToNextLevel = Math.min(
      (xpInCurrentLevel / xpNeededForNextLevel) * 100,
      100
    );

    // Fetch user's enrolled courses with progress data
    const enrolledCourses = await prisma.course.findMany({
      where: {
        courseProgresses: {
          some: {
            userId: user.id,
          },
        },
        isPublished: true,
      },
      include: {
        courseProgresses: {
          where: {
            userId: user.id,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    // Format courses for DashboardCoursesSection component
    const coursesWithProgress = enrolledCourses.map((course) => {
      const progress = course.courseProgresses[0];
      return {
        id: course.id,
        title: course.title,
        description: course.description || "",
        thumbnail: course.thumbnail,
        totalXP: course.totalXP,
        progress: progress ? progress.progress : 0,
        isCompleted: progress ? progress.isCompleted : false,
      };
    });

    return (
      <div className={styles.container}>
        <h1 className={styles.title}>Welcome, {user.name || "Explorer"}!</h1>

        <Card className={styles.statsCard}>
          <CardHeader>
            <h2 className={styles.cardTitle}>Your Stats</h2>
          </CardHeader>
          <CardBody>
            <div className={styles.statsGrid}>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Level</span>
                <span className={styles.statValue}>{userLevel}</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>XP</span>
                <span className={styles.statValue}>{userXP}</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Rank</span>
                <Badge variant="default">{userRank}</Badge>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Streak</span>
                <span className={styles.statValue}>
                  <Flame size={16} className={styles.streakIcon} />
                  {userStreak} days
                </span>
              </div>
            </div>
            <div className={styles.progressSection}>
              <ProgressBar
                value={progressToNextLevel}
                showPercentage
                label="Progress to Next Level"
              />
            </div>
          </CardBody>
        </Card>

        <DashboardCoursesSection courses={coursesWithProgress} />
      </div>
    );
  } catch (error) {
    console.error("[DashboardPage] Error rendering dashboard:", error);
    // Return a simple error message instead of crashing
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>Welcome!</h1>
        <Card className={styles.statsCard}>
          <CardBody>
            <p>Unable to load dashboard. Please try refreshing the page.</p>
          </CardBody>
        </Card>
      </div>
    );
  }
}

