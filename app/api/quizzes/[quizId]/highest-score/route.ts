import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma/client";
import { getHighestScore } from "@/lib/utils/quizMessages";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const { quizId } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get highest score for this quiz
    const highest = await getHighestScore(user.id, quizId);

    return NextResponse.json(
      {
        success: true,
        data: {
          highestScore: highest,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[GET /api/quizzes/[quizId]/highest-score] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch highest score",
      },
      { status: 500 }
    );
  }
}

