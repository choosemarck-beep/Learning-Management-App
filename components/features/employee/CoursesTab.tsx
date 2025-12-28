import React from "react";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Button } from "@/components/ui/Button";
import { BookOpen } from "lucide-react";
import styles from "./CoursesTab.module.css";

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail?: string | null;
  totalXP: number;
  progress: number;
  isCompleted: boolean;
}

export interface CoursesTabProps {
  courses: Course[];
}

export const CoursesTab: React.FC<CoursesTabProps> = ({ courses }) => {
  if (courses.length === 0) {
    return (
      <Card className={styles.emptyCard}>
        <CardBody>
          <div className={styles.emptyState}>
            <BookOpen size={48} className={styles.emptyIcon} />
            <p className={styles.emptyText}>
              No courses yet. Start your learning journey!
            </p>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className={styles.container}>
      {courses.map((course) => (
        <Card key={course.id} className={styles.courseCard}>
          <CardBody>
            <div className={styles.courseContent}>
              {course.thumbnail ? (
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  className={styles.thumbnail}
                />
              ) : (
                <div className={styles.thumbnailPlaceholder}>
                  <BookOpen size={24} />
                </div>
              )}

              <div className={styles.courseInfo}>
                <h3 className={styles.courseTitle}>{course.title}</h3>
                <p className={styles.courseDescription}>{course.description}</p>

                <div className={styles.progressSection}>
                  <ProgressBar
                    value={course.progress}
                    showPercentage
                    label={`${course.progress}% Complete`}
                  />
                </div>

                <div className={styles.courseFooter}>
                  <span className={styles.xpBadge}>
                    {course.totalXP} XP available
                  </span>
                  <Button
                    variant={course.progress > 0 ? "secondary" : "primary"}
                    size="sm"
                    onClick={() => {
                      // Navigate to course detail (future)
                      window.location.href = `/courses/${course.id}`;
                    }}
                  >
                    {course.isCompleted
                      ? "Review"
                      : course.progress > 0
                      ? "Continue"
                      : "Start"}
                  </Button>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  );
};

