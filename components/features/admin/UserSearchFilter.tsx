"use client";

import React, { useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/Input";
import styles from "./UserSearchFilter.module.css";

interface UserSearchFilterProps {
  onSearch: (query: string) => void;
  onClear?: () => void;
  isLoading?: boolean;
}

export const UserSearchFilter: React.FC<UserSearchFilterProps> = ({
  onSearch,
  onClear,
  isLoading = false,
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim());
    }
  };

  const handleClear = () => {
    setSearchQuery("");
    onClear?.();
  };

  return (
    <div className={styles.container}>
      <form onSubmit={handleSubmit} className={styles.searchForm}>
        <div className={styles.searchInputWrapper}>
          <Search className={styles.searchIcon} size={20} />
          <Input
            type="text"
            placeholder="Search users with natural language... (e.g., 'employees in Manila branch', 'direct hires')"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (searchQuery.trim()) {
                  onSearch(searchQuery.trim());
                }
              }
            }}
            className={styles.searchInput}
            disabled={isLoading}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={handleClear}
              className={styles.clearButton}
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

