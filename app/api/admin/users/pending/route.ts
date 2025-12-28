import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma/client";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is admin or super admin
    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

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
  } catch (error) {
    console.error("Error fetching pending users:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch pending users",
      },
      { status: 500 }
    );
  }
}

