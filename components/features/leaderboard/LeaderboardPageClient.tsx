"use client";

import React, { useState, useEffect } from "react";
import { LeaderboardHeader } from "./LeaderboardHeader";
import { LeaderboardSearch } from "./LeaderboardSearch";
import { LeaderboardList } from "./LeaderboardList";
import { LeaderboardPagination } from "./LeaderboardPagination";
import { LeaderboardResponse } from "@/types/leaderboard";
import styles from "./LeaderboardPageClient.module.css";

interface LeaderboardPageClientProps {
  initialData: LeaderboardResponse | null;
}

export const LeaderboardPageClient: React.FC<LeaderboardPageClientProps> = ({
  initialData,
}) => {
  const [view, setView] = useState<"INDIVIDUAL" | "BRANCH" | "AREA" | "REGIONAL">("INDIVIDUAL");
  const [period, setPeriod] = useState<"DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY">("DAILY");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardResponse | null>(initialData);
  const [isLoading, setIsLoading] = useState(!initialData);

  // Fetch leaderboard data
  const fetchLeaderboard = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        view,
        period,
        page: page.toString(),
        limit: page === 1 ? "10" : "20",
        ...(search ? { search } : {}),
      });

      const response = await fetch(`/api/leaderboard?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setLeaderboardData(data.data);
      } else {
        console.error("[LeaderboardPageClient] Error fetching leaderboard:", data.error);
      }
    } catch (error) {
      console.error("[LeaderboardPageClient] Error fetching leaderboard:", error);
    } finally {
      setIsLoading(false);
    }
  }, [view, period, page, search]);

  // Fetch on mount and when filters change
  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  // Reset to page 1 when view, period, or search changes
  useEffect(() => {
    setPage(1);
  }, [view, period, search]);

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
      <LeaderboardHeader
        view={view}
        period={period}
        onViewChange={handleViewChange}
        onPeriodChange={handlePeriodChange}
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
  );
};

