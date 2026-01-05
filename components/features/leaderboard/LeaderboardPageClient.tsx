"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { LeaderboardHeader } from "./LeaderboardHeader";
import { LeaderboardSearch } from "./LeaderboardSearch";
import { LeaderboardList } from "./LeaderboardList";
import { LeaderboardPagination } from "./LeaderboardPagination";
import { LeaderboardResponse } from "@/types/leaderboard";
import { UserRole } from "@prisma/client";
import styles from "./LeaderboardPageClient.module.css";

interface LeaderboardPageClientProps {
  initialData: LeaderboardResponse | null;
  userRole: UserRole;
}

export const LeaderboardPageClient: React.FC<LeaderboardPageClientProps> = ({
  initialData,
  userRole,
}) => {
  // Determine default view based on role
  // Employees: Show their branch by default
  // Trainers/Admins: Show all employees (INDIVIDUAL) by default
  // Use function initializer to call getDefaultView only once
  const [view, setView] = useState<"INDIVIDUAL" | "BRANCH" | "AREA" | "REGIONAL">(() => {
    if (userRole === UserRole.TRAINER || userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN) {
      return "INDIVIDUAL"; // Trainers/Admins see all employees
    }
    return "BRANCH"; // Employees see their branch by default
  });
  const [period, setPeriod] = useState<"DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY">("DAILY");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardResponse | null>(initialData);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);

  // Mount guard to prevent state updates after unmount - set immediately to avoid race condition
  const isMountedRef = useRef(true);
  // Ref to store current page to avoid dependency issues
  const pageRef = useRef(page);
  // Track if this is the initial mount
  const isInitialMountRef = useRef(true);

  // Update pageRef when page changes
  useEffect(() => {
    pageRef.current = page;
  }, [page]);

  // Fetch leaderboard data - use ref for page to prevent dependency loop
  const fetchLeaderboard = useCallback(async () => {
    if (!isMountedRef.current) return; // Guard: Don't proceed if unmounted
    
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        view,
        period,
        page: pageRef.current.toString(),
        limit: pageRef.current === 1 ? "10" : "20",
        ...(search ? { search } : {}),
      });

      const response = await fetch(`/api/leaderboard?${params.toString()}`);
      
      if (!isMountedRef.current) return; // Guard: Check again before setting state
      
      const data = await response.json();

      if (data.success) {
        if (isMountedRef.current) {
          setLeaderboardData(data.data);
          setError(null); // Clear any previous errors
        }
      } else {
        const errorMessage = data.error || "Failed to fetch leaderboard";
        console.error("[LeaderboardPageClient] Error fetching leaderboard:", errorMessage);
        if (isMountedRef.current) {
          setError(errorMessage);
        }
      }
    } catch (error) {
      if (!isMountedRef.current) return; // Guard: Check before error handling
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch leaderboard";
      console.error("[LeaderboardPageClient] Error fetching leaderboard:", error);
      if (isMountedRef.current) {
        setError(errorMessage);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [view, period, search]); // Removed page from dependencies - using ref instead

  // Cleanup mount guard on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false; // Mark as unmounted in cleanup
    };
  }, []);

  // Fetch on initial mount if no initial data - this runs first
  useEffect(() => {
    if (initialData === null) {
      fetchLeaderboard();
      isInitialMountRef.current = false;
    } else {
      isInitialMountRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Reset to page 1 when view, period, or search changes, then fetch - but skip on initial mount
  useEffect(() => {
    if (isInitialMountRef.current) {
      // Skip on initial mount - initial fetch effect already handled it
      return;
    }
    
    if (!isMountedRef.current) return; // Guard: Don't proceed if unmounted
    
    // Reset page to 1 when filters change
    if (pageRef.current !== 1) {
      setPage(1);
      pageRef.current = 1; // Update ref immediately
    }
    
    // Fetch with current filters (page will be 1)
    fetchLeaderboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, period, search]);

  // Fetch when page changes (user clicks pagination) - but not on initial mount
  useEffect(() => {
    if (isInitialMountRef.current) {
      // Skip on initial mount - initial fetch effect already handled it
      return;
    }
    
    if (!isMountedRef.current) return; // Guard: Don't proceed if unmounted
    
    // Fetch when page changes (pagination)
    fetchLeaderboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleViewChange = (newView: "INDIVIDUAL" | "BRANCH" | "AREA" | "REGIONAL") => {
    setView(newView);
  };

  const handlePeriodChange = (newPeriod: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY") => {
    setPeriod(newPeriod);
  };

  const handleSearchChange = (query: string) => {
    setSearch(query);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  return (
    <div className={styles.container}>
      <div className={styles.contentWrapper}>
        <LeaderboardHeader
          view={view}
          period={period}
          onViewChange={handleViewChange}
          onPeriodChange={handlePeriodChange}
          userRole={userRole}
        />

        <LeaderboardSearch
          search={search}
          onSearchChange={handleSearchChange}
          onSearchSubmit={() => fetchLeaderboard()}
        />

        {error && (
          <div className={styles.errorMessage}>
            Error: {error}
          </div>
        )}

        <LeaderboardList
          topUsers={leaderboardData?.topUsers || []}
          currentUserEntry={leaderboardData?.currentUserEntry || null}
          currentUserRank={leaderboardData?.currentUserRank || 0}
          isLoading={isLoading}
        />

        {leaderboardData && leaderboardData.pagination.totalPages > 1 && (
          <LeaderboardPagination
            pagination={leaderboardData.pagination}
            onPageChange={handlePageChange}
            isLoading={isLoading}
          />
        )}
      </div>
    </div>
  );
};

