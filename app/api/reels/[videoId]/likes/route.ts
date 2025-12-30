import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma/client";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const user = await getCurrentUser();
    const { videoId } = await params;

    // Get total like count
    const likeCount = await prisma.reelLike.count({
      where: {
        videoId: videoId,
      },
    });

    // Check if current user has liked this video
    let userLiked = false;
    if (user) {
      const userLike = await prisma.reelLike.findUnique({
        where: {
          userId_videoId: {
            userId: user.id,
            videoId: videoId,
          },
        },
      });
      userLiked = !!userLike;
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          likeCount,
          userLiked,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[ReelLikes] Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

