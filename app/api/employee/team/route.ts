import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma/client";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const roleParam = searchParams.get("role");

    // Determine which role's team to fetch
    const userRole = roleParam || user.role;

    let teamMembers: any[] = [];
    let teamStats = {
      totalMembers: 0,
      averageProgress: 0,
      totalXP: 0,
    };

    if (userRole === "REGIONAL_MANAGER") {
      // Regional Managers manage Area Managers in their region
      if (user.role !== "REGIONAL_MANAGER" && user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
        return NextResponse.json(
          { success: false, error: "Forbidden" },
          { status: 403 }
        );
      }

      const regionalManager = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
          region: true,
        },
      });

      if (!regionalManager || !regionalManager.region) {
        return NextResponse.json(
          {
            success: true,
            data: {
              members: [],
              stats: teamStats,
            },
          },
          { status: 200 }
        );
      }

      // Fetch Area Managers in the same region
      teamMembers = await prisma.user.findMany({
        where: {
          region: regionalManager.region,
          role: "AREA_MANAGER",
          status: { in: ["APPROVED", "RESIGNED"] },
          id: {
            not: user.id,
          },
        },
        include: {
          courseProgresses: {
            select: {
              progress: true,
            },
          },
        },
        orderBy: {
          xp: "desc",
        },
      });
    } else if (userRole === "AREA_MANAGER") {
      // Area Managers manage Branch Managers in their area
      if (user.role !== "AREA_MANAGER" && user.role !== "REGIONAL_MANAGER" && user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
        return NextResponse.json(
          { success: false, error: "Forbidden" },
          { status: 403 }
        );
      }

      const areaManager = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
          area: true,
        },
      });

      if (!areaManager || !areaManager.area) {
        return NextResponse.json(
          {
            success: true,
            data: {
              members: [],
              stats: teamStats,
            },
          },
          { status: 200 }
        );
      }

      // Fetch Branch Managers in the same area
      teamMembers = await prisma.user.findMany({
        where: {
          area: areaManager.area,
          role: "BRANCH_MANAGER",
          status: { in: ["APPROVED", "RESIGNED"] },
          id: {
            not: user.id,
          },
        },
        include: {
          courseProgresses: {
            select: {
              progress: true,
            },
          },
        },
        orderBy: {
          xp: "desc",
        },
      });
    } else if (userRole === "BRANCH_MANAGER") {
      // Branch Managers manage Employees in their branch
      if (user.role !== "BRANCH_MANAGER" && user.role !== "AREA_MANAGER" && user.role !== "REGIONAL_MANAGER" && user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
        return NextResponse.json(
          { success: false, error: "Forbidden" },
          { status: 403 }
        );
      }

      const branchManager = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
          branch: true,
        },
      });

      if (!branchManager || !branchManager.branch) {
        return NextResponse.json(
          {
            success: true,
            data: {
              members: [],
              stats: teamStats,
            },
          },
          { status: 200 }
        );
      }

      // Fetch employees in the same branch
      teamMembers = await prisma.user.findMany({
        where: {
          branch: branchManager.branch,
          role: "EMPLOYEE",
          status: { in: ["APPROVED", "RESIGNED"] },
          id: {
            not: user.id,
          },
        },
        include: {
          courseProgresses: {
            select: {
              progress: true,
            },
          },
        },
        orderBy: {
          xp: "desc",
        },
      });
    } else {
      return NextResponse.json(
        { success: false, error: "Invalid role" },
        { status: 400 }
      );
    }

    // Calculate team stats
    const totalMembers = teamMembers.length;
    let totalXP = 0;
    let totalProgress = 0;
    let progressCount = 0;

    teamMembers.forEach((member) => {
      totalXP += member.xp;
      if (member.courseProgresses.length > 0) {
        const avgProgress =
          member.courseProgresses.reduce(
            (sum: number, cp: { progress: number }) => sum + cp.progress,
            0
          ) / member.courseProgresses.length;
        totalProgress += avgProgress;
        progressCount++;
      }
    });

    const averageProgress =
      progressCount > 0 ? totalProgress / progressCount : 0;

    // Format team members data
    const members = teamMembers.map((member) => {
      const avgProgress =
        member.courseProgresses.length > 0
          ? member.courseProgresses.reduce(
              (sum, cp) => sum + cp.progress,
              0
            ) / member.courseProgresses.length
          : 0;

      return {
        id: member.id,
        name: member.name,
        email: member.email,
        phone: member.phone,
        role: member.role,
        level: member.level,
        xp: member.xp,
        rank: member.rank,
        progress: avgProgress,
        branch: member.branch,
        area: member.area,
        region: member.region,
        employeeNumber: member.employeeNumber,
        hireDate: member.hireDate,
        status: member.status,
      };
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          members,
          stats: {
            totalMembers,
            averageProgress,
            totalXP,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Team data error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
