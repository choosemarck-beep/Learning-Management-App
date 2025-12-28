import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";

export async function GET(request: NextRequest) {
  try {
    const now = new Date();

    // Get active announcements that haven't expired, ordered by priority and date
    const announcements = await prisma.announcement.findMany({
      where: {
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: now } },
        ],
      },
      include: {
        trainer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        { priority: "desc" },
        { createdAt: "desc" },
      ],
      take: 20, // Limit to 20 most recent
    });

    // Transform data to include trainer name
    const formattedAnnouncements = announcements.map((announcement) => ({
      id: announcement.id,
      title: announcement.title,
      content: announcement.content,
      type: announcement.type,
      trainerId: announcement.trainerId,
      trainerName: announcement.trainer?.name || null,
      createdAt: announcement.createdAt.toISOString(),
      expiresAt: announcement.expiresAt?.toISOString() || null,
    }));

    return NextResponse.json(
      { success: true, data: formattedAnnouncements },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching announcements:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

