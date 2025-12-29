import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma/client";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Wrap getCurrentUser in try-catch
    let user;
    try {
      user = await getCurrentUser();
    } catch (authError) {
      console.error("Error getting current user:", authError);
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

    // Wrap Prisma queries in try-catch
    try {
      // Fetch pending users with related data
      const pendingUsers = await prisma.user.findMany({
        where: {
          status: "PENDING",
        },
        include: {
          company: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
          position: {
            select: {
              id: true,
              title: true,
              role: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return NextResponse.json(
        {
          success: true,
          data: pendingUsers,
        },
        { status: 200 }
      );
    } catch (dbError) {
      console.error("Database error fetching pending users:", dbError);
      return NextResponse.json(
        { success: false, error: "Failed to fetch pending users" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Unexpected error in GET /api/admin/users/pending:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

