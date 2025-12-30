import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma/client";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Get current user
    let user;
    try {
      user = await getCurrentUser();
    } catch (authError) {
      console.error("[Analytics Quizzes] Error getting current user:", authError);
      return NextResponse.json(
        { success: false, error: "Authentication error" },
        { status: 401 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is admin or super admin
    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    // Get date range from query params
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30", 10);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    try {
      // Quiz analytics
      const [
        totalQuizAttempts,
        totalMiniQuizAttempts,
        averageScore,
        averageMiniQuizScore,
        passRate,
        failRate,
        retakeRate,
        averageTimeSpent,
        quizPerformance,
        mostDifficultQuizzes,
        scoreDistribution,
      ] = await Promise.all([
        // Total quiz attempts
        prisma.quizAttempt.count({
          where: {
            completedAt: {
              gte: startDate,
            },
          },
        }),
        // Total mini quiz attempts
        prisma.miniQuizAttempt.count({
          where: {
            completedAt: {
              gte: startDate,
            },
          },
        }),
        // Average quiz score
        prisma.quizAttempt.aggregate({
          where: {
            completedAt: {
              gte: startDate,
            },
          },
          _avg: {
            score: true,
          },
        }).then(result => Math.round(result._avg.score || 0)),
        // Average mini quiz score
        prisma.miniQuizAttempt.aggregate({
          where: {
            completedAt: {
              gte: startDate,
            },
          },
          _avg: {
            score: true,
          },
        }).then(result => Math.round(result._avg.score || 0)),
        // Pass rate
        Promise.all([
          prisma.quizAttempt.count({
            where: {
              completedAt: { gte: startDate },
              passed: true,
            },
          }),
          prisma.miniQuizAttempt.count({
            where: {
              completedAt: { gte: startDate },
              passed: true,
            },
          }),
          prisma.quizAttempt.count({
            where: {
              completedAt: { gte: startDate },
            },
          }),
          prisma.miniQuizAttempt.count({
            where: {
              completedAt: { gte: startDate },
            },
          }),
        ]).then(([quizPassed, miniPassed, quizTotal, miniTotal]) => {
          const totalPassed = quizPassed + miniPassed;
          const totalAttempts = quizTotal + miniTotal;
          return totalAttempts > 0 ? Math.round((totalPassed / totalAttempts) * 100) : 0;
        }),
        // Fail rate
        Promise.all([
          prisma.quizAttempt.count({
            where: {
              completedAt: { gte: startDate },
              passed: false,
            },
          }),
          prisma.miniQuizAttempt.count({
            where: {
              completedAt: { gte: startDate },
              passed: false,
            },
          }),
          prisma.quizAttempt.count({
            where: {
              completedAt: { gte: startDate },
            },
          }),
          prisma.miniQuizAttempt.count({
            where: {
              completedAt: { gte: startDate },
            },
          }),
        ]).then(([quizFailed, miniFailed, quizTotal, miniTotal]) => {
          const totalFailed = quizFailed + miniFailed;
          const totalAttempts = quizTotal + miniTotal;
          return totalAttempts > 0 ? Math.round((totalFailed / totalAttempts) * 100) : 0;
        }),
        // Retake rate (users who took quiz more than once)
        Promise.all([
          prisma.quizAttempt.groupBy({
            by: ["userId", "quizId"],
            _count: {
              id: true,
            },
            where: {
              completedAt: { gte: startDate },
            },
          }),
          prisma.miniQuizAttempt.groupBy({
            by: ["userId", "miniQuizId"],
            _count: {
              id: true,
            },
            where: {
              completedAt: { gte: startDate },
            },
          }),
        ]).then(([quizGroups, miniGroups]) => {
          const quizRetakes = quizGroups.filter(g => g._count.id > 1).length;
          const miniRetakes = miniGroups.filter(g => g._count.id > 1).length;
          const totalRetakes = quizRetakes + miniRetakes;
          const totalUnique = quizGroups.length + miniGroups.length;
          return totalUnique > 0 ? Math.round((totalRetakes / totalUnique) * 100) : 0;
        }),
        // Average time spent
        Promise.all([
          prisma.quizAttempt.aggregate({
            where: {
              completedAt: { gte: startDate },
              timeSpent: { not: null },
            },
            _avg: {
              timeSpent: true,
            },
          }),
          prisma.miniQuizAttempt.aggregate({
            where: {
              completedAt: { gte: startDate },
              timeSpent: { not: null },
            },
            _avg: {
              timeSpent: true,
            },
          }),
        ]).then(([quizAvg, miniAvg]) => {
          const quizTime = quizAvg._avg.timeSpent || 0;
          const miniTime = miniAvg._avg.timeSpent || 0;
          return Math.round((quizTime + miniTime) / 2);
        }),
        // Quiz performance by quiz
        prisma.quiz.findMany({
          select: {
            id: true,
            title: true,
            passingScore: true,
            quizAttempts: {
              where: {
                completedAt: { gte: startDate },
              },
              select: {
                score: true,
                passed: true,
              },
            },
          },
        }).then(quizzes =>
          quizzes.map(quiz => {
            const attempts = quiz.quizAttempts;
            const total = attempts.length;
            const passed = attempts.filter(a => a.passed).length;
            const avgScore = total > 0
              ? Math.round(attempts.reduce((sum, a) => sum + a.score, 0) / total)
              : 0;
            return {
              quizId: quiz.id,
              title: quiz.title,
              passingScore: quiz.passingScore,
              totalAttempts: total,
              passed,
              failed: total - passed,
              passRate: total > 0 ? Math.round((passed / total) * 100) : 0,
              averageScore: avgScore,
            };
          })
        ),
        // Most difficult quizzes (lowest average scores)
        prisma.quiz.findMany({
          select: {
            id: true,
            title: true,
            passingScore: true,
            quizAttempts: {
              where: {
                completedAt: { gte: startDate },
              },
              select: {
                score: true,
                passed: true,
              },
            },
          },
        }).then(quizzes => {
          const quizStats = quizzes
            .map(quiz => {
              const attempts = quiz.quizAttempts;
              const total = attempts.length;
              if (total === 0) return null;
              const avgScore = attempts.reduce((sum, a) => sum + a.score, 0) / total;
              return {
                quizId: quiz.id,
                title: quiz.title,
                passingScore: quiz.passingScore,
                averageScore: Math.round(avgScore),
                totalAttempts: total,
                passRate: total > 0
                  ? Math.round((attempts.filter(a => a.passed).length / total) * 100)
                  : 0,
              };
            })
            .filter(q => q !== null && q.totalAttempts > 0)
            .sort((a, b) => a!.averageScore - b!.averageScore)
            .slice(0, 10);
          return quizStats;
        }),
        // Score distribution
        Promise.all([
          // 0-50%
          Promise.all([
            prisma.quizAttempt.count({
              where: {
                completedAt: { gte: startDate },
                score: { gte: 0, lt: 50 },
              },
            }),
            prisma.miniQuizAttempt.count({
              where: {
                completedAt: { gte: startDate },
                score: { gte: 0, lt: 50 },
              },
            }),
          ]).then(([quiz, miniQuiz]) => quiz + miniQuiz),
          // 50-70%
          Promise.all([
            prisma.quizAttempt.count({
              where: {
                completedAt: { gte: startDate },
                score: { gte: 50, lt: 70 },
              },
            }),
            prisma.miniQuizAttempt.count({
              where: {
                completedAt: { gte: startDate },
                score: { gte: 50, lt: 70 },
              },
            }),
          ]).then(([quiz, miniQuiz]) => quiz + miniQuiz),
          // 70-85%
          Promise.all([
            prisma.quizAttempt.count({
              where: {
                completedAt: { gte: startDate },
                score: { gte: 70, lt: 85 },
              },
            }),
            prisma.miniQuizAttempt.count({
              where: {
                completedAt: { gte: startDate },
                score: { gte: 70, lt: 85 },
              },
            }),
          ]).then(([quiz, miniQuiz]) => quiz + miniQuiz),
          // 85-100%
          Promise.all([
            prisma.quizAttempt.count({
              where: {
                completedAt: { gte: startDate },
                score: { gte: 85, lte: 100 },
              },
            }),
            prisma.miniQuizAttempt.count({
              where: {
                completedAt: { gte: startDate },
                score: { gte: 85, lte: 100 },
              },
            }),
          ]).then(([quiz, miniQuiz]) => quiz + miniQuiz),
        ]).then(([range0_50, range50_70, range70_85, range85_100]) => ({
          "0-50%": range0_50,
          "50-70%": range50_70,
          "70-85%": range70_85,
          "85-100%": range85_100,
        })),
      ]);

      return NextResponse.json(
        {
          success: true,
          data: {
            totalQuizAttempts: totalQuizAttempts + totalMiniQuizAttempts,
            quizAttempts: totalQuizAttempts,
            miniQuizAttempts: totalMiniQuizAttempts,
            averageScore: Math.round((averageScore + averageMiniQuizScore) / 2),
            quizAverageScore: averageScore,
            miniQuizAverageScore: averageMiniQuizScore,
            passRate,
            failRate,
            retakeRate,
            averageTimeSpent, // in seconds
            quizPerformance,
            mostDifficultQuizzes,
            scoreDistribution,
            dateRange: {
              days,
              startDate: startDate.toISOString(),
              endDate: new Date().toISOString(),
            },
          },
        },
        { status: 200 }
      );
    } catch (dbError) {
      console.error("[Analytics Quizzes] Database error:", dbError);
      return NextResponse.json(
        { success: false, error: "Failed to fetch quiz analytics" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("[Analytics Quizzes] Unexpected error:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

