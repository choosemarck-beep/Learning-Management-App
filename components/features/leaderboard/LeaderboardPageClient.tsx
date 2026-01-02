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

  // Mount guard to prevent state updates after unmount
  const isMountedRef = useRef(false);
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
        }
      } else {
        console.error("[LeaderboardPageClient] Error fetching leaderboard:", data.error);
      }
    } catch (error) {
      if (!isMountedRef.current) return; // Guard: Check before error handling
      console.error("[LeaderboardPageClient] Error fetching leaderboard:", error);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [view, period, search]); // Removed page from dependencies - using ref instead

  // Initialize mount guard
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false; // Mark as unmounted in cleanup
    };
  }, []);

  // Reset to page 1 when view, period, or search changes, then fetch
  useEffect(() => {
    if (!isMountedRef.current) return; // Guard: Don't proceed if unmounted
    
    // Reset page to 1 when filters change (but not on initial mount if page is already 1)
    if (pageRef.current !== 1) {
      setPage(1);
      pageRef.current = 1; // Update ref immediately
    }
    
    // Fetch with current filters (page will be 1)
    // Don't include fetchLeaderboard in deps to prevent loop - it's stable due to ref usage
    fetchLeaderboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, period, search]);

  // Fetch when page changes (user clicks pagination) - but not on initial mount
  useEffect(() => {
    if (!isMountedRef.current) return; // Guard: Don't proceed if unmounted
    if (isInitialMountRef.current) {
      // Skip on initial mount - filter effect will handle it
      isInitialMountRef.current = false;
      return;
    }
    
    // Fetch when page changes (pagination)
    // Don't include fetchLeaderboard in deps to prevent loop - it's stable due to ref usage
    fetchLeaderboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // Fetch on initial mount if no initial data
  useEffect(() => {
    if (initialData === null && isMountedRef.current) {
      fetchLeaderboard();
      isInitialMountRef.current = false; // Mark as no longer initial mount
    } else {
      isInitialMountRef.current = false; // Mark as no longer initial mount even if we have data
    }
  }, []); // Only run on mount

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

