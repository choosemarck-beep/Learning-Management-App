"use client";

import React, { useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import styles from "./LeaderboardSearch.module.css";

interface LeaderboardSearchProps {
  search: string;
  onSearchChange: (query: string) => void;
  onSearchSubmit: () => void;
}

export const LeaderboardSearch: React.FC<LeaderboardSearchProps> = ({
  search,
  onSearchChange,
  onSearchSubmit,
}) => {
  const [localSearch, setLocalSearch] = useState(search);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(localSearch);
    }, 300);

    return () => clearTimeout(timer);
  }, [localSearch, onSearchChange]);

  const handleClear = () => {
    setLocalSearch("");
    onSearchChange("");
  };

  return (
    <div className={styles.container}>
      <div className={styles.searchInputWrapper}>
        <Search size={18} className={styles.searchIcon} />
        <input
          id="leaderboard-search"
          name="leaderboardSearch"
          type="text"
          placeholder="Search by name, email, or employee number..."
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onSearchSubmit();
            }
          }}
          className={styles.searchInput}
        />
        {localSearch && (
          <button
            onClick={handleClear}
            className={styles.clearButton}
            aria-label="Clear search"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

