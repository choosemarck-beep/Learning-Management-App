import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma/client";
import { UserRole } from "@prisma/client";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is a trainer
    if (currentUser.role !== UserRole.TRAINER) {
      return NextResponse.json(
        { success: false, error: "Forbidden - Trainer access required" },
        { status: 403 }
      );
    }

    // Get date range from query params
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30", 10);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get trainer's trainings
    const trainerTrainings = await prisma.training.findMany({
      where: {
        createdBy: currentUser.id,
      },
      select: {
        id: true,
        title: true,
      },
    });

    const trainingIds = trainerTrainings.map(t => t.id);

    // Get quizzes for trainer's trainings
    const quizzes = await prisma.quiz.findMany({
      where: {
        trainingId: { in: trainingIds },
      },
      select: {
        id: true,
        title: true,
        trainingId: true,
      },
    });

    const miniQuizzes = await prisma.miniQuiz.findMany({
      where: {
        miniTraining: {
          trainingId: { in: trainingIds },
        },
      },
      select: {
        id: true,
        title: true,
        miniTrainingId: true,
      },
    });

    const quizIds = quizzes.map(q => q.id);
    const miniQuizIds = miniQuizzes.map(q => q.id);

    // Calculate quiz analytics
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
          quizId: { in: quizIds },
          completedAt: {
            gte: startDate,
          },
        },
      }),
      // Total mini quiz attempts
      prisma.miniQuizAttempt.count({
        where: {
          miniQuizId: { in: miniQuizIds },
          completedAt: {
            gte: startDate,
          },
        },
      }),
      // Average quiz score
      prisma.quizAttempt.aggregate({
        where: {
          quizId: { in: quizIds },
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
          miniQuizId: { in: miniQuizIds },
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
            quizId: { in: quizIds },
            completedAt: { gte: startDate },
            passed: true,
          },
        }),
        prisma.quizAttempt.count({
          where: {
            quizId: { in: quizIds },
            completedAt: { gte: startDate },
          },
        }),
        prisma.miniQuizAttempt.count({
          where: {
            miniQuizId: { in: miniQuizIds },
            completedAt: { gte: startDate },
            passed: true,
          },
        }),
        prisma.miniQuizAttempt.count({
          where: {
            miniQuizId: { in: miniQuizIds },
            completedAt: { gte: startDate },
          },
        }),
      ]).then(([quizPassed, quizTotal, miniPassed, miniTotal]) => {
        const totalPassed = quizPassed + miniPassed;
        const total = quizTotal + miniTotal;
        return total > 0 ? Math.round((totalPassed / total) * 100) : 0;
      }),
      // Fail rate
      Promise.all([
        prisma.quizAttempt.count({
          where: {
            quizId: { in: quizIds },
            completedAt: { gte: startDate },
            passed: false,
          },
        }),
        prisma.quizAttempt.count({
          where: {
            quizId: { in: quizIds },
            completedAt: { gte: startDate },
          },
        }),
        prisma.miniQuizAttempt.count({
          where: {
            miniQuizId: { in: miniQuizIds },
            completedAt: { gte: startDate },
            passed: false,
          },
        }),
        prisma.miniQuizAttempt.count({
          where: {
            miniQuizId: { in: miniQuizIds },
            completedAt: { gte: startDate },
          },
        }),
      ]).then(([quizFailed, quizTotal, miniFailed, miniTotal]) => {
        const totalFailed = quizFailed + miniFailed;
        const total = quizTotal + miniTotal;
        return total > 0 ? Math.round((totalFailed / total) * 100) : 0;
      }),
      // Retake rate (users who attempted more than once)
      Promise.all([
        prisma.quizAttempt.groupBy({
          by: ['userId', 'quizId'],
          where: {
            quizId: { in: quizIds },
            completedAt: { gte: startDate },
          },
          _count: true,
        }),
        prisma.miniQuizAttempt.groupBy({
          by: ['userId', 'miniQuizId'],
          where: {
            miniQuizId: { in: miniQuizIds },
            completedAt: { gte: startDate },
          },
          _count: true,
        }),
      ]).then(([quizGroups, miniGroups]) => {
        const retakes = [...quizGroups, ...miniGroups].filter(g => g._count > 1).length;
        const total = quizGroups.length + miniGroups.length;
        return total > 0 ? Math.round((retakes / total) * 100) : 0;
      }),
      // Average time spent
      Promise.all([
        prisma.quizAttempt.aggregate({
          where: {
            quizId: { in: quizIds },
            completedAt: { gte: startDate },
          },
          _avg: {
            timeSpent: true,
          },
        }),
        prisma.miniQuizAttempt.aggregate({
          where: {
            miniQuizId: { in: miniQuizIds },
            completedAt: { gte: startDate },
          },
          _avg: {
            timeSpent: true,
          },
        }),
      ]).then(([quizAvg, miniAvg]) => {
        const total = (quizAvg._avg.timeSpent || 0) + (miniAvg._avg.timeSpent || 0);
        return Math.round(total / 2);
      }),
      // Quiz performance (average score per quiz)
      Promise.all(
        quizzes.map(async (quiz) => {
          const attempts = await prisma.quizAttempt.findMany({
            where: {
              quizId: quiz.id,
              completedAt: { gte: startDate },
            },
            select: {
              score: true,
            },
          });
          const avgScore = attempts.length > 0
            ? Math.round(attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length)
            : 0;
          return {
            quizId: quiz.id,
            title: quiz.title,
            averageScore: avgScore,
            totalAttempts: attempts.length,
          };
        })
      ),
      // Most difficult quizzes (lowest average scores)
      Promise.all(
        quizzes.map(async (quiz) => {
          const attempts = await prisma.quizAttempt.findMany({
            where: {
              quizId: quiz.id,
              completedAt: { gte: startDate },
            },
            select: {
              score: true,
            },
          });
          const avgScore = attempts.length > 0
            ? Math.round(attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length)
            : 0;
          return {
            quizId: quiz.id,
            title: quiz.title,
            averageScore: avgScore,
            totalAttempts: attempts.length,
          };
        })
      ).then(results => results.sort((a, b) => a.averageScore - b.averageScore)),
      // Score distribution
      Promise.all([
        prisma.quizAttempt.count({
          where: {
            quizId: { in: quizIds },
            completedAt: { gte: startDate },
            score: { gte: 0, lt: 50 },
          },
        }),
        prisma.quizAttempt.count({
          where: {
            quizId: { in: quizIds },
            completedAt: { gte: startDate },
            score: { gte: 50, lt: 70 },
          },
        }),
        prisma.quizAttempt.count({
          where: {
            quizId: { in: quizIds },
            completedAt: { gte: startDate },
            score: { gte: 70, lt: 85 },
          },
        }),
        prisma.quizAttempt.count({
          where: {
            quizId: { in: quizIds },
            completedAt: { gte: startDate },
            score: { gte: 85, lte: 100 },
          },
        }),
        prisma.miniQuizAttempt.count({
          where: {
            miniQuizId: { in: miniQuizIds },
            completedAt: { gte: startDate },
            score: { gte: 0, lt: 50 },
          },
        }),
        prisma.miniQuizAttempt.count({
          where: {
            miniQuizId: { in: miniQuizIds },
            completedAt: { gte: startDate },
            score: { gte: 50, lt: 70 },
          },
        }),
        prisma.miniQuizAttempt.count({
          where: {
            miniQuizId: { in: miniQuizIds },
            completedAt: { gte: startDate },
            score: { gte: 70, lt: 85 },
          },
        }),
        prisma.miniQuizAttempt.count({
          where: {
            miniQuizId: { in: miniQuizIds },
            completedAt: { gte: startDate },
            score: { gte: 85, lte: 100 },
          },
        }),
      ]).then(([q0, q50, q70, q85, m0, m50, m70, m85]) => ({
        "0-50%": q0 + m0,
        "50-70%": q50 + m50,
        "70-85%": q70 + m70,
        "85-100%": q85 + m85,
      })),
    ]);

    return NextResponse.json(
      {
        success: true,
        data: {
          totalQuizAttempts,
          totalMiniQuizAttempts,
          totalAttempts: totalQuizAttempts + totalMiniQuizAttempts,
          averageScore,
          averageMiniQuizScore,
          overallAverageScore: Math.round((averageScore + averageMiniQuizScore) / 2),
          passRate,
          failRate,
          retakeRate,
          averageTimeSpent,
          quizPerformance: quizPerformance.sort((a, b) => b.averageScore - a.averageScore),
          mostDifficultQuizzes: mostDifficultQuizzes.slice(0, 10),
          scoreDistribution,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[API] /api/trainer/analytics/quizzes error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

