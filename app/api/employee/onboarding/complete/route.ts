import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma/client";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Only mobile users (employees, managers, trainers) can complete onboarding
    // Admin and Super Admin don't use onboarding
    const allowedRoles = [
      "BRANCH_MANAGER",
      "EMPLOYEE",
      "TRAINER",
      "AREA_MANAGER",
      "REGIONAL_MANAGER",
    ];
    
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // Update onboarding status
    await prisma.user.update({
      where: { id: user.id },
      data: {
        onboardingCompleted: true,
      },
    });

    return NextResponse.json(
      { message: "Onboarding completed successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Onboarding completion error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

