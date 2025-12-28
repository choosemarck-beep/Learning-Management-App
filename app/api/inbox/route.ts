import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma/client";

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
    const type = searchParams.get("type") || "all"; // all, notifications, messages, announcements

    // Fetch notifications
    const notifications = await prisma.notification.findMany({
      where: {
        userId: currentUser.id,
      },
      select: {
        id: true,
        type: true,
        title: true,
        content: true,
        isRead: true,
        link: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: type === "notifications" || type === "all" ? 50 : 0,
    });

    // Fetch messages
    const messages = await prisma.message.findMany({
      where: {
        recipientId: currentUser.id,
      },
      select: {
        id: true,
        senderId: true,
        subject: true,
        content: true,
        isRead: true,
        createdAt: true,
        sender: {
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
      take: type === "messages" || type === "all" ? 50 : 0,
    });

    // Fetch announcements
    const announcements = await prisma.announcement.findMany({
      where: {
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      select: {
        id: true,
        title: true,
        content: true,
        type: true,
        priority: true,
        createdAt: true,
      },
      orderBy: [
        { priority: "desc" },
        { createdAt: "desc" },
      ],
      take: type === "announcements" || type === "all" ? 50 : 0,
    });

    // Count unread items
    const unreadNotifications = notifications.filter((n) => !n.isRead).length;
    const unreadMessages = messages.filter((m) => !m.isRead).length;

    return NextResponse.json(
      {
        success: true,
        data: {
          notifications,
          messages,
          announcements,
          unreadCounts: {
            notifications: unreadNotifications,
            messages: unreadMessages,
            total: unreadNotifications + unreadMessages,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching inbox items:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch inbox items",
      },
      { status: 500 }
    );
  }
}

