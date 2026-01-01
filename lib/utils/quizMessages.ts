/**
 * Quiz Messages Utility
 * Provides behavioral science-based congratulatory messages and quiz helpers
 * Uses positive framing and celebrates progress
 */

export interface QuizMessageResult {
  title: string;
  message: string;
  encouragement: string;
  color: string;
}

/**
 * Get congratulatory message based on quiz score
 * Uses behavioral science principles: positive framing, celebration, progress recognition
 */
export function getQuizMessage(score: number, totalQuestions: number, correctAnswers: number): QuizMessageResult {
  const percentage = score;
  
  // Perfect score (100%)
  if (percentage === 100) {
    return {
      title: "Perfect Score!",
      message: "Outstanding achievement! You've mastered this material completely!",
      encouragement: "Your dedication to learning is truly stellar. Keep reaching for the stars!",
      color: "var(--color-status-success)",
    };
  }
  
  // Excellent (90-99%)
  if (percentage >= 90) {
    return {
      title: "Excellent Work!",
      message: `You scored ${correctAnswers} out of ${totalQuestions} correctly - that's exceptional!`,
      encouragement: "You're demonstrating mastery of this content. Your commitment to excellence shines through!",
      color: "var(--color-status-success)",
    };
  }
  
  // Great (75-89%)
  if (percentage >= 75) {
    return {
      title: "Great Job!",
      message: `You scored ${correctAnswers} out of ${totalQuestions} correctly - well done!`,
      encouragement: "You're making excellent progress! Every question you got right shows your growing understanding.",
      color: "var(--color-primary-purple)",
    };
  }
  
  // Good (60-74%)
  if (percentage >= 60) {
    return {
      title: "Good Effort!",
      message: `You scored ${correctAnswers} out of ${totalQuestions} correctly - keep going!`,
      encouragement: "You're on the right track! Each attempt helps you learn and improve. You've got this!",
      color: "var(--color-status-warning)",
    };
  }
  
  // Needs Improvement (below 60%)
  return {
    title: "Keep Learning!",
    message: `You scored ${correctAnswers} out of ${totalQuestions} correctly.`,
    encouragement: "Every expert was once a beginner. This is your learning journey, and you're taking important steps forward. Review the material and try again - you'll improve!",
    color: "var(--color-status-error)",
  };
}

/**
 * Get highest score from quiz attempts
 */
export async function getHighestScore(
  userId: string,
  quizId?: string,
  miniQuizId?: string
): Promise<number | null> {
  try {
    const { prisma } = await import("@/lib/prisma/client");
    
    if (quizId) {
      const attempts = await prisma.quizAttempt.findMany({
        where: {
          userId,
          quizId,
        },
        select: {
          score: true,
        },
        orderBy: {
          score: "desc",
        },
        take: 1,
      });
      
      return attempts.length > 0 ? attempts[0].score : null;
    }
    
    if (miniQuizId) {
      const attempts = await prisma.miniQuizAttempt.findMany({
        where: {
          userId,
          miniQuizId,
        },
        select: {
          score: true,
        },
        orderBy: {
          score: "desc",
        },
        take: 1,
      });
      
      return attempts.length > 0 ? attempts[0].score : null;
    }
    
    return null;
  } catch (error) {
    console.error("[getHighestScore] Error:", error);
    return null;
  }
}

/**
 * Get attempt count for a quiz
 */
export async function getAttemptCount(
  userId: string,
  quizId?: string,
  miniQuizId?: string
): Promise<number> {
  try {
    const { prisma } = await import("@/lib/prisma/client");
    
    if (quizId) {
      const count = await prisma.quizAttempt.count({
        where: {
          userId,
          quizId,
        },
      });
      return count;
    }
    
    if (miniQuizId) {
      const count = await prisma.miniQuizAttempt.count({
        where: {
          userId,
          miniQuizId,
        },
      });
      return count;
    }
    
    return 0;
  } catch (error) {
    console.error("[getAttemptCount] Error:", error);
    return 0;
  }
}

/**
 * Check if user has perfect score (100%)
 */
export function hasPerfectScore(score: number): boolean {
  return score === 100;
}

/**
 * Format attempt count for button text
 */
export function formatAttemptButtonText(attemptCount: number, maxAttempts?: number): string {
  if (attemptCount === 0) {
    return "Take Quiz";
  }
  
  const remaining = maxAttempts ? maxAttempts - attemptCount : null;
  
  if (remaining !== null && remaining <= 0) {
    return "Take Quiz (No attempts remaining)";
  }
  
  if (remaining !== null) {
    return `Take Quiz (${attemptCount} taken, ${remaining} remaining)`;
  }
  
  return `Take Quiz (${attemptCount} attempt${attemptCount !== 1 ? 's' : ''} taken)`;
}

