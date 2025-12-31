import { prisma } from "@/lib/prisma/client";
import { GAMIFICATION } from "@/lib/constants/gamification";

/**
 * Calculate rank name based on level and XP
 * Uses GAMIFICATION.RANKS to determine the appropriate rank
 * 
 * @param level - User's current level
 * @param xp - User's total XP
 * @returns Rank name string (e.g., "Stellar Cadet", "Space Explorer")
 */
export function getRankName(level: number, xp: number): string {
  // Sort ranks by level descending to find the highest rank the user qualifies for
  const sortedRanks = [...GAMIFICATION.RANKS].sort((a, b) => b.level - a.level);
  
  // Find the highest rank the user qualifies for based on level and XP
  for (const rank of sortedRanks) {
    if (level >= rank.level && xp >= rank.minXP) {
      return rank.name;
    }
  }
  
  // Default to first rank if user doesn't qualify for any
  return GAMIFICATION.RANKS[0].name;
}

/**
 * Calculate level from XP
 * Formula: level = floor(xp / XP_PER_LEVEL) + 1
 * 
 * @param xp - Total XP
 * @returns Level number
 */
export function calculateLevel(xp: number): number {
  return Math.floor(xp / GAMIFICATION.XP_PER_LEVEL) + 1;
}

/**
 * Calculate XP needed for next level
 * 
 * @param currentXP - Current total XP
 * @returns XP needed to reach next level
 */
export function getXPForNextLevel(currentXP: number): number {
  const currentLevel = calculateLevel(currentXP);
  const nextLevel = currentLevel + 1;
  const xpForNextLevel = (nextLevel - 1) * GAMIFICATION.XP_PER_LEVEL;
  return Math.max(0, xpForNextLevel - currentXP);
}

/**
 * Calculate progress percentage to next level
 * 
 * @param currentXP - Current total XP
 * @returns Progress percentage (0-100)
 */
export function getLevelProgress(currentXP: number): number {
  const currentLevel = calculateLevel(currentXP);
  const xpForCurrentLevel = (currentLevel - 1) * GAMIFICATION.XP_PER_LEVEL;
  const xpForNextLevel = currentLevel * GAMIFICATION.XP_PER_LEVEL;
  const progressXP = currentXP - xpForCurrentLevel;
  const levelRange = xpForNextLevel - xpForCurrentLevel;
  
  if (levelRange === 0) return 100;
  
  return Math.min(100, Math.max(0, (progressXP / levelRange) * 100));
}

/**
 * Update all gamification stats for a user based on their current XP
 * This ensures level, rank, and other stats are always in sync
 * 
 * @param userId - User ID
 * @param newXP - New total XP (if not provided, will fetch from database)
 * @returns Updated user with all gamification stats
 */
export async function updateGamificationStats(
  userId: string,
  newXP?: number
): Promise<{
  xp: number;
  level: number;
  rank: string;
  diamonds: number;
}> {
  // Get current user data
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { xp: true, diamonds: true },
  });

  if (!currentUser) {
    throw new Error("User not found");
  }

  // Determine new total XP
  const currentXP = newXP !== undefined ? newXP : currentUser.xp;
  
  // Calculate XP increase (for diamonds increment)
  const xpIncrease = currentXP - (currentUser.xp || 0);

  // Calculate new level
  const newLevel = calculateLevel(currentXP);
  
  // Calculate new rank
  const newRank = getRankName(newLevel, currentXP);
  
  // Calculate diamonds increment (only if XP increased)
  // Diamonds are awarded incrementally (0.1 per XP earned), not recalculated from total
  const diamondsIncrement = xpIncrease > 0 
    ? Math.floor(xpIncrease * GAMIFICATION.REWARD_CRYSTALS_PER_XP)
    : 0;
  const newDiamonds = (currentUser.diamonds || 0) + diamondsIncrement;

  // Update user with all gamification stats
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      xp: currentXP,
      level: newLevel,
      rank: newRank,
      diamonds: newDiamonds,
    },
    select: {
      xp: true,
      level: true,
      rank: true,
      diamonds: true,
    },
  });

  return updatedUser;
}

