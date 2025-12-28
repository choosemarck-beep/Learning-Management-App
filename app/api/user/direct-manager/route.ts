import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma/client";
import { UserRole } from "@prisma/client";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || currentUser.id;

    // Fetch the user to determine their role and location
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        branch: true,
        area: true,
        region: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    let directManager = null;

    // Determine direct manager based on hierarchy
    if (user.role === UserRole.EMPLOYEE) {
      // Employee's direct manager is Branch Manager of same branch
      if (user.branch) {
        directManager = await prisma.user.findFirst({
          where: {
            role: UserRole.BRANCH_MANAGER,
            branch: user.branch,
            status: "APPROVED",
          },
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
            employeeNumber: true,
          },
        });
      }
    } else if (user.role === UserRole.BRANCH_MANAGER) {
      // Branch Manager's direct manager is Area Manager of same area
      if (user.area) {
        directManager = await prisma.user.findFirst({
          where: {
            role: UserRole.AREA_MANAGER,
            area: user.area,
            status: "APPROVED",
          },
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
            employeeNumber: true,
          },
        });
      }
    } else if (user.role === UserRole.AREA_MANAGER) {
      // Area Manager's direct manager is Regional Manager of same region
      if (user.region) {
        directManager = await prisma.user.findFirst({
          where: {
            role: UserRole.REGIONAL_MANAGER,
            region: user.region,
            status: "APPROVED",
          },
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
            employeeNumber: true,
          },
        });
      }
    } else if (user.role === UserRole.REGIONAL_MANAGER) {
      // Regional Manager's direct manager is Admin (first available admin)
      directManager = await prisma.user.findFirst({
        where: {
          role: { in: [UserRole.ADMIN, UserRole.SUPER_ADMIN] },
          status: "APPROVED",
        },
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          role: true,
          employeeNumber: true,
        },
        orderBy: {
          createdAt: "asc", // Get the first admin
        },
      });
    }
    // TRAINER, ADMIN, SUPER_ADMIN don't have direct managers

    return NextResponse.json(
      { success: true, data: directManager },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching direct manager:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

