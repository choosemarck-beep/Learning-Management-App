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
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";

    const where: any = {
      isActive: true,
    };

    // Search functionality
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    // Category filter
    if (category) {
      where.category = category;
    }

    const videos = await prisma.video.findMany({
      where,
      select: {
        id: true,
        title: true,
        description: true,
        videoUrl: true,
        thumbnail: true,
        duration: true,
        category: true,
        views: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Get unique categories for filter options
    const categories = await prisma.video.findMany({
      where: { isActive: true },
      select: { category: true },
      distinct: ["category"],
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          videos,
          categories: categories
            .map((c) => c.category)
            .filter((c): c is string => c !== null),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching videos:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch videos",
      },
      { status: 500 }
    );
  }
}

