"use client";

import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { BookOpen, Sparkles, Target } from "lucide-react";
import Link from "next/link";
import styles from "./SuggestedTrainingSection.module.css";

export interface SuggestedCourse {
  id: string;
  title: string;
  description: string;
  thumbnail: string | null;
  totalXP: number;
  progress?: number;
  isCompleted?: boolean;
  category: "NEW" | "RECOMMENDED" | "ASSIGNED";
}

export interface SuggestedTrainingSectionProps {
  limitPerCategory?: number;
}

export const SuggestedTrainingSection: React.FC<
  SuggestedTrainingSectionProps
> = ({ limitPerCategory = 3 }) => {
  const [courses, setCourses] = useState<SuggestedCourse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSuggestedTraining = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/dashboard/suggested-training");
        const data = await response.json();

        if (data.success) {
          setCourses(data.data);
        } else {
          setError(data.error || "Failed to load suggested training");
        }
      } catch (err) {
        setError("Something went wrong. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuggestedTraining();
  }, []);

  const newCourses = courses.filter((c) => c.category === "NEW").slice(0, limitPerCategory);
  const recommendedCourses = courses
    .filter((c) => c.category === "RECOMMENDED")
    .slice(0, limitPerCategory);
  const assignedCourses = courses
    .filter((c) => c.category === "ASSIGNED")
    .slice(0, limitPerCategory);

  const renderCourseCard = (course: SuggestedCourse) => (
    <div key={course.id} className={styles.courseCard}>
      {course.thumbnail ? (
        <img
          src={course.thumbnail}
          alt={course.title}
          className={styles.courseThumbnail}
        />
      ) : (
        <div className={styles.courseThumbnailPlaceholder}>
          <BookOpen size={24} />
        </div>
      )}
      <div className={styles.courseInfo}>
        <h3 className={styles.courseTitle}>{course.title}</h3>
        <p className={styles.courseDescription}>{course.description}</p>
        <div className={styles.courseMeta}>
          <span className={styles.courseXP}>{course.totalXP} XP</span>
          {course.progress !== undefined && (
            <div className={styles.courseProgress}>
              <ProgressBar value={course.progress} showPercentage />
            </div>
          )}
        </div>
        <Link href={`/courses/${course.id}`} className={styles.courseButton}>
          <Button
            variant={course.isCompleted ? "outline" : "primary"}
            size="sm"
            className={styles.button}
          >
            {course.isCompleted
              ? "Review"
              : course.progress && course.progress > 0
              ? "Continue"
              : "Start Course"}
          </Button>
        </Link>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <Card className={styles.card}>
        <CardHeader>
          <h2 className={styles.cardTitle}>Suggested Training</h2>
        </CardHeader>
        <CardBody>
          <p className={styles.loadingText}>Loading suggested training...</p>
        </CardBody>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={styles.card}>
        <CardHeader>
          <h2 className={styles.cardTitle}>Suggested Training</h2>
        </CardHeader>
        <CardBody>
          <p className={styles.errorText}>{error}</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className={styles.card}>
      <CardHeader>
        <h2 className={styles.cardTitle}>Suggested Training</h2>
      </CardHeader>
      <CardBody className={styles.compactBody}>
        <div className={styles.sections}>
          {/* New Courses */}
          {newCourses.length > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <Sparkles size={18} className={styles.sectionIcon} />
                <h3 className={styles.sectionTitle}>New Courses</h3>
              </div>
              <div className={styles.coursesList}>
                {newCourses.map(renderCourseCard)}
              </div>
            </div>
          )}

          {/* Recommended Courses */}
          {recommendedCourses.length > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <Target size={18} className={styles.sectionIcon} />
                <h3 className={styles.sectionTitle}>Recommended for You</h3>
              </div>
              <div className={styles.coursesList}>
                {recommendedCourses.map(renderCourseCard)}
              </div>
            </div>
          )}

          {/* Assigned Courses */}
          {assignedCourses.length > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <BookOpen size={18} className={styles.sectionIcon} />
                <h3 className={styles.sectionTitle}>Assigned by Manager</h3>
              </div>
              <div className={styles.coursesList}>
                {assignedCourses.map(renderCourseCard)}
              </div>
            </div>
          )}

          {courses.length === 0 && (
            <p className={styles.emptyText}>No suggested training available at this time.</p>
          )}
        </div>
      </CardBody>
    </Card>
  );
};

