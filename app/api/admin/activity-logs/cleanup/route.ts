import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma/client";

export const dynamic = 'force-dynamic';

// POST - Cleanup old activity logs (admin-only or cron job)
export async function POST(request: NextRequest) {
  try {
    // Check if this is a cron job request
    // Vercel Cron sends x-vercel-cron header, or we can use authorization header
    const vercelCronHeader = request.headers.get("x-vercel-cron");
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    const isCronJob = vercelCronHeader === "1" || (cronSecret && authHeader === `Bearer ${cronSecret}`);

    // If not a cron job, require admin authentication
    if (!isCronJob) {
      const user = await getCurrentUser();

      if (!user) {
        return NextResponse.json(
          { success: false, error: "Unauthorized" },
          { status: 401 }
        );
      }

      if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
        return NextResponse.json(
          { success: false, error: "Forbidden - Admin access only" },
          { status: 403 }
        );
      }
    }

    // Get retention settings from environment variables
    const retentionDays = parseInt(process.env.ACTIVITY_LOG_RETENTION_DAYS || "90");
    const maxLogCount = parseInt(process.env.ACTIVITY_LOG_MAX_COUNT || "100000");

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    let deletedByDate = 0;
    let deletedByCount = 0;

    try {
      // First, delete logs older than retention period
      const dateResult = await prisma.activityLog.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate,
          },
        },
      });
      deletedByDate = dateResult.count;

      // Then, check if we still exceed max count
      const currentCount = await prisma.activityLog.count();

      if (currentCount > maxLogCount) {
        // Get the oldest logs to delete
        const logsToDelete = await prisma.activityLog.findMany({
          orderBy: {
            createdAt: "asc",
          },
          take: currentCount - maxLogCount,
          select: {
            id: true,
          },
        });

        if (logsToDelete.length > 0) {
          const idsToDelete = logsToDelete.map((log) => log.id);
          const countResult = await prisma.activityLog.deleteMany({
            where: {
              id: {
                in: idsToDelete,
              },
            },
          });
          deletedByCount = countResult.count;
        }
      }

      const totalDeleted = deletedByDate + deletedByCount;
      const remainingCount = await prisma.activityLog.count();

      return NextResponse.json(
        {
          success: true,
          data: {
            deletedByDate,
            deletedByCount,
            totalDeleted,
            remainingCount,
            retentionDays,
            maxLogCount,
            cutoffDate: cutoffDate.toISOString(),
          },
        },
        { status: 200 }
      );
    } catch (dbError) {
      console.error("Database error during cleanup:", dbError);
      return NextResponse.json(
        { success: false, error: "Failed to cleanup activity logs" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Unexpected error in POST /api/admin/activity-logs/cleanup:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

