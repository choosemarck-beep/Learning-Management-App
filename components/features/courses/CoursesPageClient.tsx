"use client";

import React, { useState, useMemo } from "react";
import { Search, Filter, ArrowUpDown } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { CourseCard } from "@/components/features/courses/CourseCard";
import styles from "./CoursesPageClient.module.css";

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail?: string | null;
  totalXP: number;
  progress: number;
  isCompleted: boolean;
  isEnrolled: boolean;
}

interface CoursesPageClientProps {
  initialCourses: Course[];
}

export const CoursesPageClient: React.FC<CoursesPageClientProps> = ({
  initialCourses,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "popular">("newest");
  const [showFilters, setShowFilters] = useState(false);

  // Filter and sort courses
  const filteredAndSortedCourses = useMemo(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log("[CoursesPageClient] useMemo called for filteredAndSortedCourses");
    }
    let filtered = initialCourses;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (course) =>
          course.title.toLowerCase().includes(query) ||
          course.description.toLowerCase().includes(query)
      );
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === "newest") {
        return 0; // Already sorted by newest from server
      } else if (sortBy === "oldest") {
        return 0; // Would need createdAt from server to sort properly
      } else {
        // Popular - sort by totalXP as proxy
        return b.totalXP - a.totalXP;
      }
    });

    return sorted;
  }, [initialCourses, searchQuery, sortBy]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Courses</h1>
      </div>

      {/* Search and Filter Bar */}
      <div className={styles.searchBar}>
        <div className={styles.searchInputWrapper}>
          <Search size={20} className={styles.searchIcon} />
          <Input
            type="text"
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <div className={styles.filterButtons}>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className={styles.filterButton}
          >
            <Filter size={18} />
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              const options: ("newest" | "oldest" | "popular")[] = [
                "newest",
                "oldest",
                "popular",
              ];
              const currentIndex = options.indexOf(sortBy);
              setSortBy(options[(currentIndex + 1) % options.length]);
            }}
            className={styles.sortButton}
          >
            <ArrowUpDown size={18} />
          </Button>
        </div>
      </div>

      {/* Sort indicator */}
      {showFilters && (
        <div className={styles.filterPanel}>
          <p className={styles.filterLabel}>Sort by: {sortBy}</p>
        </div>
      )}

      {/* Courses List */}
      <div className={styles.coursesList}>
        {filteredAndSortedCourses.length === 0 ? (
          <Card className={styles.emptyCard}>
            <CardBody>
              <div className={styles.emptyState}>
                <p className={styles.emptyMessage}>
                  {searchQuery
                    ? "No courses found matching your search."
                    : "No courses available."}
                </p>
              </div>
            </CardBody>
          </Card>
        ) : (
          filteredAndSortedCourses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))
        )}
      </div>
    </div>
  );
};

