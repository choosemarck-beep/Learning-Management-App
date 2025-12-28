"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import styles from "./TablePagination.module.css";

interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

export const TablePagination: React.FC<TablePaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
}) => {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const handlePrevious = () => {
    if (currentPage > 1 && totalPages > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages && totalPages > 1) {
      onPageChange(currentPage + 1);
    }
  };

  // Pagination is disabled when there's only one page or no items
  const isPaginationDisabled = totalPages <= 1 || totalItems === 0;

  return (
    <div className={`${styles.pagination} ${isPaginationDisabled ? styles.disabled : ''}`}>
      <div className={styles.info}>
        <span className={styles.text}>
          Showing {startItem}-{endItem} of {totalItems}
        </span>
        <span className={styles.pageInfo}>
          Page {currentPage} of {totalPages}
        </span>
      </div>
      <div className={styles.controls}>
        <Button
          variant="secondary"
          size="sm"
          onClick={handlePrevious}
          disabled={currentPage === 1 || isPaginationDisabled}
          className={styles.button}
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
          Previous
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleNext}
          disabled={currentPage === totalPages || isPaginationDisabled}
          className={styles.button}
          aria-label="Next page"
        >
          Next
          <ChevronRight size={16} />
        </Button>
      </div>
    </div>
  );
};

