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

    // Handle search - Prisma automatically ANDs conditions, so OR can coexist
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { employeeNumber: { contains: search, mode: "insensitive" } },
      ];
    }

    // Log where clause for debugging
    console.log("[Users API] Where clause:", JSON.stringify(where, null, 2));
    console.log("[Users API] Query params:", { status, role, search, page, limit });

    // Wrap Prisma queries in try-catch
    let total, users;
    try {
      // Validate where clause is not empty (should have at least status or role filter)
      if (Object.keys(where).length === 0) {
        console.warn("[Users API] Empty where clause - this should not happen");
        // Default to showing only APPROVED users if no filter
        where.status = "APPROVED";
      }

      // Get total count for pagination
      total = await prisma.user.count({ where });
      console.log("[Users API] Total users found:", total);

      // If no users match, return empty array early
      if (total === 0) {
        console.log("[Users API] No users match criteria, returning empty array");
        return NextResponse.json(
          {
            success: true,
            data: [],
            pagination: {
              page,
              limit,
              total: 0,
              totalPages: 0,
            },
          },
          { status: 200 }
        );
      }

      // Calculate pagination
      const skip = (page - 1) * limit;
      const totalPages = Math.ceil(total / limit);

      // Fetch users with related data
      // Use select at top level instead of include to avoid Prisma validation issues
      users = await prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          employeeNumber: true,
          phone: true,
          hireType: true,
          department: true,
          branch: true,
          hireDate: true,
          status: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          approvedAt: true,
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
      
      console.log("[Users API] Users fetched:", users.length);
      console.log("[Users API] First user sample:", users[0] ? {
        id: users[0].id,
        name: users[0].name,
        email: users[0].email,
        status: users[0].status,
        role: users[0].role,
        hasCompany: !!users[0].company,
        hasPosition: !!users[0].position,
      } : "No users");

      // Serialize Date objects to ISO strings for JSON response
      // Explicitly construct the response object to avoid serialization issues
      // Validate all fields exist before serialization
      const serializedUsers = users.map((user) => {
        try {
          return {
            id: String(user.id || ''),
            name: String(user.name || ''),
            email: String(user.email || ''),
            employeeNumber: user.employeeNumber ? String(user.employeeNumber) : null,
            phone: user.phone ? String(user.phone) : null,
            hireType: user.hireType ? String(user.hireType) : null,
            department: user.department ? String(user.department) : null,
            branch: user.branch ? String(user.branch) : null,
            hireDate: user.hireDate instanceof Date ? user.hireDate.toISOString() : null,
            status: String(user.status || ''),
            role: String(user.role || ''),
            createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : new Date().toISOString(),
            updatedAt: user.updatedAt instanceof Date ? user.updatedAt.toISOString() : new Date().toISOString(),
            approvedAt: user.approvedAt instanceof Date ? user.approvedAt.toISOString() : null,
            company: user.company ? {
              id: String(user.company.id || ''),
              name: String(user.company.name || ''),
              type: String(user.company.type || ''),
            } : null,
            position: user.position ? {
              id: String(user.position.id || ''),
              title: String(user.position.title || ''),
              role: String(user.position.role || ''),
            } : null,
          };
        } catch (serializeError) {
          console.error("[Users API] Error serializing user:", user.id, serializeError);
          // Return minimal safe object if serialization fails for one user
          return {
            id: String(user.id || ''),
            name: String(user.name || 'Unknown'),
            email: String(user.email || ''),
            employeeNumber: null,
            phone: null,
            hireType: null,
            department: null,
            branch: null,
            hireDate: null,
            status: String(user.status || ''),
            role: String(user.role || ''),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            approvedAt: null,
            company: null,
            position: null,
          };
        }
      });

      // Validate serialized data before sending
      console.log("[Users API] Serialized users count:", serializedUsers.length);
      if (serializedUsers.length > 0) {
        console.log("[Users API] Sample serialized user:", JSON.stringify(serializedUsers[0], null, 2));
      }

      // Return success response - wrap in try-catch to catch JSON serialization errors
      try {
        const response = NextResponse.json(
          {
            success: true,
            data: serializedUsers,
            pagination: {
              page,
              limit,
              total,
              totalPages,
            },
          },
          { status: 200 }
        );
        console.log("[Users API] Successfully created response");
        return response;
      } catch (jsonError) {
        console.error("[Users API] Error creating JSON response:", jsonError);
        console.error("[Users API] Attempted to serialize:", {
          usersCount: serializedUsers.length,
          firstUser: serializedUsers[0],
        });
        // Return error response
        return NextResponse.json(
          {
            success: false,
            error: "Failed to serialize response",
            details: process.env.NODE_ENV === "development" 
              ? (jsonError instanceof Error ? jsonError.message : String(jsonError))
              : undefined,
          },
          { status: 500 }
        );
      }
    } catch (dbError) {
      console.error("Database error fetching users:", dbError);
      const errorMessage = dbError instanceof Error ? dbError.message : String(dbError);
      const errorCode = dbError && typeof dbError === "object" && "code" in dbError ? (dbError as any).code : undefined;
      const errorName = dbError instanceof Error ? dbError.name : undefined;
      console.error("Database error details:", {
        message: errorMessage,
        code: errorCode,
        name: errorName,
        where: JSON.stringify(where, null, 2),
        stack: dbError instanceof Error ? dbError.stack : undefined,
      });
      
      // Return detailed error for debugging
      return NextResponse.json(
        { 
          success: false, 
          error: "Failed to fetch users",
          details: process.env.NODE_ENV === "development" 
            ? `${errorName || "Error"}: ${errorMessage}${errorCode ? ` (Code: ${errorCode})` : ""}`
            : undefined,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Unexpected error in GET /api/admin/users:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorName = error instanceof Error ? error.name : undefined;
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error("Unexpected error details:", {
      message: errorMessage,
      name: errorName,
      stack: errorStack,
    });
    return NextResponse.json(
      { 
        success: false, 
        error: "An unexpected error occurred",
        details: process.env.NODE_ENV === "development" 
          ? `${errorName || "Error"}: ${errorMessage}`
          : undefined,
      },
      { status: 500 }
    );
  }
}

