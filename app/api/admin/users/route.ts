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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const role = searchParams.get("role");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "1000", 10); // Default to large number for client-side pagination

    // Build where clause
    const where: any = {};

    // Handle status filter
    // "ALL" means show only APPROVED users (for "All Users" tab)
    if (status === "ALL") {
      where.status = "APPROVED";
    } else if (status) {
      where.status = status;
    }

    // Role-based filtering: Regular admins cannot see other admins or super admins
    // This applies to "ALL" (which is APPROVED) and "APPROVED" status
    if (user.role === "ADMIN" && (status === "ALL" || status === "APPROVED" || !status)) {
      // Filter out ADMIN and SUPER_ADMIN roles for regular admins
      where.role = {
        notIn: ["ADMIN", "SUPER_ADMIN"],
      };
    } else if (role) {
      // If a specific role filter is provided, use it
      where.role = role;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { employeeNumber: { contains: search, mode: "insensitive" } },
      ];
    }

    // Wrap Prisma queries in try-catch
    let total, users;
    try {
      // Get total count for pagination
      total = await prisma.user.count({ where });

      // Calculate pagination
      const skip = (page - 1) * limit;
      const totalPages = Math.ceil(total / limit);

      // Fetch users with related data
      users = await prisma.user.findMany({
        where,
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
        skip,
        take: limit,
      });

      // Return success response
      return NextResponse.json(
        {
          success: true,
          data: users,
          pagination: {
            page,
            limit,
            total,
            totalPages,
          },
        },
        { status: 200 }
      );
    } catch (dbError) {
      console.error("Database error fetching users:", dbError);
      return NextResponse.json(
        { success: false, error: "Failed to fetch users" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Unexpected error in GET /api/admin/users:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

