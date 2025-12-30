export type LeaderboardView = "INDIVIDUAL" | "BRANCH" | "AREA" | "REGIONAL";
export type LeaderboardPeriod = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";

export interface LeaderboardEntry {
  userId: string;
  name: string;
  avatar: string | null;
  rank: number;
  xp: number;
  level: number;
  rankName: string;
  streak: number;
  diamonds: number;
  xpEarned: number; // XP earned in selected period
  employeeNumber?: string | null;
}

export interface LeaderboardResponse {
  topUsers: LeaderboardEntry[];
  currentUserRank: number;
  currentUserEntry: LeaderboardEntry | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  totalUsers: number;
}

