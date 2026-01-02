import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma/client";
import { UserRole, UserStatus } from "@prisma/client";
import { getRankName } from "@/lib/utils/gamification";
import { LeaderboardView, LeaderboardPeriod } from "@/types/leaderboard";

export const dynamic = 'force-dynamic';

/**
 * GET /api/leaderboard
 * 
 * Query Parameters:
 * - view: "INDIVIDUAL" | "BRANCH" | "AREA" | "REGIONAL"
 * - period: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY"
 * - page: number (default: 1)
 * - limit: number (default: 10 for first page)
 * - search: string (optional, search by name/email)
 */
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Fetch full user data from database to get branch, area, region, and role fields
    const userData = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: {
        id: true,
        branch: true,
        area: true,
        region: true,
        role: true,
      },
    });

    if (!userData) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const userRole = userData.role;

    const { searchParams } = new URL(request.url);
    const view = (searchParams.get("view") || "INDIVIDUAL") as LeaderboardView;
    const period = (searchParams.get("period") || "DAILY") as LeaderboardPeriod;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || (page === 1 ? "10" : "20"));
    const search = searchParams.get("search") || "";

    // Calculate date range based on period (for future XP history tracking)
    const now = new Date();
    let dateFrom: Date;
    
    switch (period) {
      case "DAILY":
        dateFrom = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case "WEEKLY":
        dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "MONTHLY":
        dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "YEARLY":
        dateFrom = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        dateFrom = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    // Build where clause based on view
    // Exclude ADMIN, SUPER_ADMIN, and TRAINER from appearing in leaderboards
    // But allow them to VIEW the leaderboard
    const whereClause: any = {
      role: {
        notIn: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.TRAINER],
      },
      status: UserStatus.APPROVED,
    };

    // Filter by view (Branch, Area, Regional)
    // Trainers and Admins see ALL employees regardless of branch/area/region
    // Employees see filtered by their branch/area/region
    if (userRole === UserRole.TRAINER || userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN) {
      // Trainers and Admins see all employees - no branch/area/region filtering
      // They can still use the view selector to filter if needed, but it won't apply to them
      // For now, show all employees in INDIVIDUAL view
      if (view !== "INDIVIDUAL") {
        // For BRANCH/AREA/REGIONAL views, trainers/admins can still filter
        // But we'll need to get the filter value from query params or show all
        // For MVP, just show all employees regardless of view for trainers/admins
      }
    } else {
      // Employees: Filter by their branch/area/region based on view
      if (view === "BRANCH" && userData.branch) {
        whereClause.branch = userData.branch;
      } else if (view === "AREA" && userData.area) {
        whereClause.area = userData.area;
      } else if (view === "REGIONAL" && userData.region) {
        whereClause.region = userData.region;
      }
      // INDIVIDUAL view shows all users (no additional filter for employees too)
    }

    // Add search filter if provided
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { employeeNumber: { contains: search, mode: "insensitive" } },
      ];
    }

    // Get total count for pagination
    const totalUsers = await prisma.user.count({ where: whereClause });

    // Get users sorted by XP (descending)
    const skip = (page - 1) * limit;
    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        avatar: true,
        xp: true,
        level: true,
        streak: true,
        diamonds: true,
        employeeNumber: true,
      },
      orderBy: { xp: "desc" },
      skip,
      take: limit,
    });

    // Calculate rank for each user
    // Rank is based on position in sorted list (by XP)
    // We need to get all users sorted by XP to calculate accurate ranks
    const allUsersSorted = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        xp: true,
      },
      orderBy: { xp: "desc" },
    });

    // Create a map of userId -> rank
    const rankMap = new Map<string, number>();
    allUsersSorted.forEach((user, index) => {
      rankMap.set(user.id, index + 1);
    });

    // Build leaderboard entries
    const topUsers = users.map((user) => {
      const rank = rankMap.get(user.id) || 0;
      const rankName = getRankName(user.level, user.xp);
      
      return {
        userId: user.id,
        name: user.name,
        avatar: user.avatar,
        rank,
        xp: user.xp,
        level: user.level,
        rankName,
        streak: user.streak,
        diamonds: user.diamonds,
        xpEarned: user.xp, // For MVP, use total XP (can refine later with XP history)
        employeeNumber: user.employeeNumber || null,
      };
    });

    // Find current user's rank and entry
    // Only show current user entry if they're an employee (not trainer/admin)
    const currentUserRank = rankMap.get(currentUser.id) || 0;
    let currentUserEntry = null;

    // Only show current user entry for employees (trainers/admins don't appear in leaderboard)
    if (userRole !== UserRole.TRAINER && userRole !== UserRole.ADMIN && userRole !== UserRole.SUPER_ADMIN) {
      // If current user is not in top users, get their entry
      if (!topUsers.find((u) => u.userId === currentUser.id)) {
        const currentUserData = await prisma.user.findUnique({
          where: { id: currentUser.id },
          select: {
            id: true,
            name: true,
            avatar: true,
            xp: true,
            level: true,
            streak: true,
            diamonds: true,
            employeeNumber: true,
          },
        });

        if (currentUserData) {
          const rankName = getRankName(currentUserData.level, currentUserData.xp);
          currentUserEntry = {
            userId: currentUserData.id,
            name: currentUserData.name,
            avatar: currentUserData.avatar,
            rank: currentUserRank,
            xp: currentUserData.xp,
            level: currentUserData.level,
            rankName,
            streak: currentUserData.streak,
            diamonds: currentUserData.diamonds,
            xpEarned: currentUserData.xp,
            employeeNumber: currentUserData.employeeNumber || null,
          };
        }
      }
    }

    const totalPages = Math.ceil(totalUsers / limit);

    return NextResponse.json(
      {
        success: true,
        data: {
          topUsers,
          currentUserRank,
          currentUserEntry,
          pagination: {
            page,
            limit,
            total: totalUsers,
            totalPages,
          },
          totalUsers,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[API] /api/leaderboard error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

