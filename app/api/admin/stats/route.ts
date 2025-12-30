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

    // Build where clause based on role
    const where: any = {};
    
    // Role-based filtering: Regular admins cannot see other admins or super admins
    if (user.role === "ADMIN") {
      where.role = {
        notIn: ["ADMIN", "SUPER_ADMIN"],
      };
    }

    try {
      // Get counts for different statuses
      const [totalUsers, pendingUsers, rejectedUsers, approvedUsers] = await Promise.all([
        prisma.user.count({ 
          where: { 
            ...where,
            status: "APPROVED" 
          } 
        }),
        prisma.user.count({ 
          where: { 
            ...where,
            status: "PENDING" 
          } 
        }),
        prisma.user.count({ 
          where: { 
            ...where,
            status: "REJECTED" 
          } 
        }),
        prisma.user.count({ 
          where: { 
            ...where,
            status: "APPROVED" 
          } 
        }),
      ]);

      // For super admin, also get admin count
      let adminCount = 0;
      if (user.role === "SUPER_ADMIN") {
        adminCount = await prisma.user.count({
          where: {
            role: { in: ["ADMIN", "SUPER_ADMIN"] },
          },
        });
      }

      return NextResponse.json(
        {
          success: true,
          data: {
            totalUsers,
            pendingUsers,
            rejectedUsers,
            approvedUsers,
            ...(user.role === "SUPER_ADMIN" && { adminCount }),
          },
        },
        { status: 200 }
      );
    } catch (dbError) {
      console.error("Database error fetching stats:", dbError);
      return NextResponse.json(
        { success: false, error: "Failed to fetch stats" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Unexpected error in GET /api/admin/stats:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

