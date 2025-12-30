import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma/client";
import { z } from "zod";

const createCommentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty").max(500, "Comment is too long"),
});

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
    const body = await request.json();
    const { content } = createCommentSchema.parse(body);

    // Create comment
    const comment = await prisma.reelComment.create({
      data: {
        userId: user.id,
        videoId: videoId,
        content: content.trim(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: comment.id,
          content: comment.content,
          createdAt: comment.createdAt,
          user: {
            id: comment.user.id,
            name: comment.user.name,
            avatar: comment.user.avatar,
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error("[ReelComment] Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const { videoId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    // Get comments with pagination
    const [comments, totalCount] = await Promise.all([
      prisma.reelComment.findMany({
        where: {
          videoId: videoId,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.reelComment.count({
        where: {
          videoId: videoId,
        },
      }),
    ]);

    return NextResponse.json(
      {
        success: true,
        data: {
          comments: comments.map((comment) => ({
            id: comment.id,
            content: comment.content,
            createdAt: comment.createdAt,
            user: {
              id: comment.user.id,
              name: comment.user.name,
              avatar: comment.user.avatar,
            },
          })),
          pagination: {
            page,
            limit,
            total: totalCount,
            totalPages: Math.ceil(totalCount / limit),
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[ReelComments] Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

