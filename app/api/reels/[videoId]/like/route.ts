import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma/client";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { videoId } = await params;

    // Check if user already liked this video
    const existingLike = await prisma.reelLike.findUnique({
      where: {
        userId_videoId: {
          userId: user.id,
          videoId: videoId,
        },
      },
    });

    if (existingLike) {
      // Unlike: Delete the like
      await prisma.reelLike.delete({
        where: {
          id: existingLike.id,
        },
      });

      return NextResponse.json(
        { success: true, liked: false, message: "Video unliked" },
        { status: 200 }
      );
    } else {
      // Like: Create the like
      await prisma.reelLike.create({
        data: {
          userId: user.id,
          videoId: videoId,
        },
      });

      return NextResponse.json(
        { success: true, liked: true, message: "Video liked" },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("[ReelLike] Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

