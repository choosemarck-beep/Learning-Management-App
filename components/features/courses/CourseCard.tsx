"use client";

import React from "react";
import Link from "next/link";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Play, CheckCircle2 } from "lucide-react";
import { Course } from "./CoursesPageClient";
import styles from "./CourseCard.module.css";

interface CourseCardProps {
  course: Course;
}

export const CourseCard: React.FC<CourseCardProps> = ({ course }) => {
  return (
    <Link href={`/courses/${course.id}`} className={styles.link}>
      <Card className={styles.card}>
        <CardBody>
          <div className={styles.content}>
            {course.thumbnail && (
              <div className={styles.thumbnailContainer}>
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  className={styles.thumbnail}
                />
                {course.isCompleted && (
                  <div className={styles.completedBadge}>
                    <CheckCircle2 size={20} />
                  </div>
                )}
              </div>
            )}
            <div className={styles.info}>
              <h3 className={styles.title}>{course.title}</h3>
              <p className={styles.description}>{course.description}</p>
              <div className={styles.meta}>
                <span className={styles.xp}>{course.totalXP} XP</span>
                {course.isEnrolled && (
                  <div className={styles.progress}>
                    <ProgressBar
                      value={course.progress}
                      className={styles.progressBar}
                    />
                    <span className={styles.progressText}>
                      {Math.round(course.progress)}%
                    </span>
                  </div>
                )}
              </div>
              <Button
                variant={course.isEnrolled ? "primary" : "outline"}
                className={styles.actionButton}
                onClick={(e) => {
                  // Navigation handled by Link
                }}
              >
                {course.isCompleted ? (
                  <>
                    <CheckCircle2 size={18} />
                    Completed
                  </>
                ) : course.isEnrolled ? (
                  <>
                    <Play size={18} />
                    Continue
                  </>
                ) : (
                  <>
                    <Play size={18} />
                    Start
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>
    </Link>
  );
};

