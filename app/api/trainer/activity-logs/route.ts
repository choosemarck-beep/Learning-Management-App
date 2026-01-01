import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma/client";

export const dynamic = 'force-dynamic';

// GET - Fetch activity logs (trainer-only)
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (user.role !== "TRAINER") {
      return NextResponse.json(
        { success: false, error: "Forbidden - Trainer access only" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role") || "all"; // all, EMPLOYEE, TRAINER, ADMIN, SUPER_ADMIN
    const type = searchParams.get("type") || "all"; // all, TRAINING_CREATED, TRAINING_UPDATED, etc.
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const where: any = {};

    // Filter by activity type
    if (type !== "all") {
      where.type = type;
    }

    // Filter by user role
    if (role !== "all") {
      where.user = {
        role: role,
      };
    }

    try {
      const [logs, total] = await Promise.all([
        prisma.activityLog.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: limit,
          skip: offset,
        }),
        prisma.activityLog.count({ where }),
      ]);

      // Serialize Date objects to ISO strings
      const serializedLogs = logs.map((log) => ({
        id: log.id,
        type: log.type,
        description: log.description,
        metadata: log.metadata,
        targetId: log.targetId,
        targetType: log.targetType,
        createdAt: log.createdAt.toISOString(),
        user: log.user,
      }));

      return NextResponse.json(
        {
          success: true,
          data: {
            logs: serializedLogs,
            total,
            limit,
            offset,
          },
        },
        { status: 200 }
      );
    } catch (dbError) {
      console.error("Database error fetching activity logs:", dbError);
      return NextResponse.json(
        { success: false, error: "Failed to fetch activity logs" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Unexpected error in GET /api/trainer/activity-logs:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

