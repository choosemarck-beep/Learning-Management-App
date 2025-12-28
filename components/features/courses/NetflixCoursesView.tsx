"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Course } from "./NetflixCoursesPageClient";
import { NetflixCourseCard } from "./NetflixCourseCard";
import styles from "./NetflixCoursesView.module.css";

interface NetflixCoursesViewProps {
  courses: Course[];
  onCourseClick?: (courseId: string) => void;
}

export const NetflixCoursesView: React.FC<NetflixCoursesViewProps> = ({
  courses,
  onCourseClick,
}) => {
  // Group courses by categories (for now, just show all courses in one row)
  // Future: Can group by category, progress, etc.
  const allCourses = courses;
  const enrolledCourses = courses.filter((c) => c.isEnrolled);
  const availableCourses = courses.filter((c) => !c.isEnrolled);
  const completedCourses = courses.filter((c) => c.isCompleted);

  if (courses.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyContent}>
          <p className={styles.emptyMessage}>No courses available.</p>
          <p className={styles.emptySubmessage}>
            Courses will appear here once they are published by administrators.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Continue Learning - Enrolled courses */}
      {enrolledCourses.length > 0 && (
        <div className={styles.courseRow}>
          <div className={styles.courseRowHeader}>
            <h2 className={styles.courseRowTitle}>Continue Learning</h2>
          </div>
          <HorizontalScrollContainer>
            {enrolledCourses.map((course) => (
              <NetflixCourseCard key={course.id} course={course} />
            ))}
          </HorizontalScrollContainer>
        </div>
      )}

      {/* All Courses - Main catalog */}
      {allCourses.length > 0 && (
        <div className={styles.courseRow}>
          <div className={styles.courseRowHeader}>
            <h2 className={styles.courseRowTitle}>All Courses</h2>
          </div>
          <HorizontalScrollContainer>
            {allCourses.map((course) => (
              <NetflixCourseCard key={course.id} course={course} />
            ))}
          </HorizontalScrollContainer>
        </div>
      )}

      {/* Available Courses - Not enrolled */}
      {availableCourses.length > 0 && enrolledCourses.length > 0 && (
        <div className={styles.courseRow}>
          <div className={styles.courseRowHeader}>
            <h2 className={styles.courseRowTitle}>Explore More</h2>
          </div>
          <HorizontalScrollContainer>
            {availableCourses.map((course) => (
              <NetflixCourseCard key={course.id} course={course} />
            ))}
          </HorizontalScrollContainer>
        </div>
      )}

      {/* Completed Courses */}
      {completedCourses.length > 0 && completedCourses.length < allCourses.length && (
        <div className={styles.courseRow}>
          <div className={styles.courseRowHeader}>
            <h2 className={styles.courseRowTitle}>Completed</h2>
          </div>
          <HorizontalScrollContainer>
            {completedCourses.map((course) => (
              <NetflixCourseCard key={course.id} course={course} />
            ))}
          </HorizontalScrollContainer>
        </div>
      )}
    </div>
  );
};

// Horizontal Scroll Container Component
export interface HorizontalScrollContainerProps {
  children: React.ReactNode;
}

export const HorizontalScrollContainer: React.FC<HorizontalScrollContainerProps> = ({
  children,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const checkScrollPosition = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScrollPosition();
    const scrollElement = scrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener("scroll", checkScrollPosition);
      return () => scrollElement.removeEventListener("scroll", checkScrollPosition);
    }
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      const currentScroll = scrollRef.current.scrollLeft;
      const targetScroll =
        direction === "left"
          ? currentScroll - scrollAmount
          : currentScroll + scrollAmount;

      scrollRef.current.scrollTo({
        left: targetScroll,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className={styles.horizontalScrollWrapper}>
      {showLeftArrow && (
        <button
          className={styles.scrollArrowLeft}
          onClick={() => scroll("left")}
          aria-label="Scroll left"
        >
          <ChevronLeft size={24} />
        </button>
      )}
      <div
        ref={scrollRef}
        className={styles.horizontalScroll}
        onScroll={checkScrollPosition}
      >
        {children}
      </div>
      {showRightArrow && (
        <button
          className={styles.scrollArrowRight}
          onClick={() => scroll("right")}
          aria-label="Scroll right"
        >
          <ChevronRight size={24} />
        </button>
      )}
    </div>
  );
};

