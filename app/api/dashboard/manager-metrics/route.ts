import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma/client";
import { UserRole } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch full user data to get branch, area, region fields
    const userData = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: {
        branch: true,
        area: true,
        region: true,
      },
    });

    if (!userData) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role") as UserRole;

    if (
      role !== "BRANCH_MANAGER" &&
      role !== "AREA_MANAGER" &&
      role !== "REGIONAL_MANAGER"
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid manager role" },
        { status: 400 }
      );
    }

    // Get team members based on manager role
    type TeamMember = {
      id: string;
      name: string;
      xp: number | null;
      courseProgresses: Array<{
        progress: number;
        isCompleted: boolean;
      }>;
    };
    let teamMembers: TeamMember[] = [];

    if (role === "BRANCH_MANAGER") {
      teamMembers = await prisma.user.findMany({
        where: {
          role: "EMPLOYEE",
          branch: userData.branch,
          status: "APPROVED",
        },
        include: {
          courseProgresses: {
            select: {
              progress: true,
              isCompleted: true,
            },
          },
        },
      });
    } else if (role === "AREA_MANAGER") {
      teamMembers = await prisma.user.findMany({
        where: {
          role: "BRANCH_MANAGER",
          area: userData.area,
          status: "APPROVED",
        },
        include: {
          courseProgresses: {
            select: {
              progress: true,
              isCompleted: true,
            },
          },
        },
      });
    } else if (role === "REGIONAL_MANAGER") {
      teamMembers = await prisma.user.findMany({
        where: {
          role: "AREA_MANAGER",
          region: userData.region,
          status: "APPROVED",
        },
        include: {
          courseProgresses: {
            select: {
              progress: true,
              isCompleted: true,
            },
          },
        },
      });
    }

    const teamSize = teamMembers.length;

    if (teamSize === 0) {
      return NextResponse.json({
        success: true,
        data: {
          teamSize: 0,
          averageProgress: 0,
          completionRate: 0,
          topPerformers: [],
          totalTeamXP: 0,
        },
      });
    }

    // Calculate metrics
    let totalProgress = 0;
    let totalCompleted = 0;
    let totalStarted = 0;
    let totalTeamXP = 0;

    teamMembers.forEach((member) => {
      member.courseProgresses.forEach((cp: { progress: number; isCompleted: boolean }) => {
        totalProgress += cp.progress;
        totalStarted++;
        if (cp.isCompleted) {
          totalCompleted++;
        }
      });
      totalTeamXP += member.xp || 0;
    });

    const averageProgress = totalStarted > 0 ? totalProgress / totalStarted : 0;
    const completionRate = totalStarted > 0 ? (totalCompleted / totalStarted) * 100 : 0;

    // Get top performers
    const topPerformers = teamMembers
      .map((member) => ({
        id: member.id,
        name: member.name,
        xp: member.xp || 0,
        coursesCompleted: member.courseProgresses.filter(
          (cp: { progress: number; isCompleted: boolean }) => cp.isCompleted
        ).length,
      }))
      .sort((a, b) => {
        if (b.xp !== a.xp) return b.xp - a.xp;
        return b.coursesCompleted - a.coursesCompleted;
      })
      .slice(0, 5);

    const metrics = {
      teamSize,
      averageProgress,
      completionRate,
      topPerformers,
      totalTeamXP,
    };

    return NextResponse.json(
      { success: true, data: metrics },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching manager metrics:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

