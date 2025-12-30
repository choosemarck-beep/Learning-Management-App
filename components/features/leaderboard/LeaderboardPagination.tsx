"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { LeaderboardResponse } from "@/types/leaderboard";
import styles from "./LeaderboardPagination.module.css";

interface LeaderboardPaginationProps {
  pagination: LeaderboardResponse["pagination"];
  onPageChange: (page: number) => void;
  isLoading: boolean;
}

export const LeaderboardPagination: React.FC<LeaderboardPaginationProps> = ({
  pagination,
  onPageChange,
  isLoading,
}) => {
  const { page, totalPages, total } = pagination;

  const handlePrevious = () => {
    if (page > 1) {
      onPageChange(page - 1);
    }
  };

  const handleNext = () => {
    if (page < totalPages) {
      onPageChange(page + 1);
    }
  };

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.info}>
        <span className={styles.pageInfo}>
          Page {page} of {totalPages}
        </span>
        <span className={styles.totalInfo}>
          {total} total users
        </span>
      </div>

      <div className={styles.controls}>
        <button
          onClick={handlePrevious}
          disabled={page === 1 || isLoading}
          className={styles.button}
          aria-label="Previous page"
        >
          <ChevronLeft size={20} />
          <span>Previous</span>
        </button>

        <button
          onClick={handleNext}
          disabled={page >= totalPages || isLoading}
          className={styles.button}
          aria-label="Next page"
        >
          <span>Next</span>
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
};

