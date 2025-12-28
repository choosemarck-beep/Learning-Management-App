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
    const publishedOnly = searchParams.get("published") === "true";
    const search = searchParams.get("search") || "";
    const sortBy = searchParams.get("sortBy") || "newest"; // newest, popular, progress

    const where: any = {};
    if (publishedOnly) {
      where.isPublished = true;
    }

    // Search functionality
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    // Determine orderBy based on sortBy parameter
    let orderBy: any = { createdAt: "desc" };
    if (sortBy === "popular") {
      // For now, use createdAt as popularity proxy
      // Can be enhanced with view count or enrollment count later
      orderBy = { createdAt: "desc" };
    } else if (sortBy === "newest") {
      orderBy = { createdAt: "desc" };
    } else if (sortBy === "oldest") {
      orderBy = { createdAt: "asc" };
    }

    const courses = await prisma.course.findMany({
      where,
      select: {
        id: true,
        title: true,
        description: true,
        thumbnail: true,
        totalXP: true,
        isPublished: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy,
    });

    return NextResponse.json(
      {
        success: true,
        data: { courses },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching courses:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch courses",
      },
      { status: 500 }
    );
  }
}

