/**
 * Gamification Constants
 * Duolingo-inspired mechanics
 */

export const GAMIFICATION = {
  // XP System
  XP_PER_TASK: 10,
  XP_PER_LESSON: 50,
  XP_PER_MODULE: 200,
  XP_PER_COURSE: 1000,

  // Levels
  XP_PER_LEVEL: 1000,
  MAX_LEVEL: 100,

  // Streaks
  STREAK_BONUS_MULTIPLIER: 1.5,
  MAX_STREAK_DAYS: 365,

  // Rewards
  REWARD_CRYSTALS_PER_XP: 0.1, // 1 energy crystal per 10 XP
  DAILY_REWARD_CRYSTALS: 50,

  // Leaderboard
  LEADERBOARD_UPDATE_INTERVAL: 3600000, // 1 hour in ms

  // Ranks (Pixel Galaxy Theme)
  RANKS: [
    { level: 1, name: "Stellar Cadet", minXP: 0 },
    { level: 5, name: "Space Explorer", minXP: 5000 },
    { level: 10, name: "Nebula Navigator", minXP: 10000 },
    { level: 15, name: "Star Seeker", minXP: 15000 },
    { level: 20, name: "Galaxy Guardian", minXP: 20000 },
    { level: 25, name: "Stellar Master", minXP: 25000 },
    { level: 30, name: "Cosmic Commander", minXP: 30000 },
    { level: 40, name: "Galaxy Master", minXP: 40000 },
    { level: 50, name: "Universal Legend", minXP: 50000 },
  ],

  // Badges
  BADGE_TYPES: [
    "first_task",
    "first_lesson",
    "first_module",
    "first_course",
    "streak_7",
    "streak_30",
    "streak_100",
    "perfect_week",
    "top_10_leaderboard",
    "level_10",
    "level_25",
    "level_50",
  ],
} as const;

export type RankName = (typeof GAMIFICATION.RANKS)[number]["name"];
export type BadgeType = (typeof GAMIFICATION.BADGE_TYPES)[number];

