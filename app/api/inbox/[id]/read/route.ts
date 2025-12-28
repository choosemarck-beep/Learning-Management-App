import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma/client";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params in Next.js 14+ App Router
    const { id } = await params;
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // "notification" or "message"

    if (type === "notification") {
      // Mark notification as read
      const notification = await prisma.notification.findUnique({
        where: { id },
      });

      if (!notification || notification.userId !== currentUser.id) {
        return NextResponse.json(
          { success: false, error: "Notification not found" },
          { status: 404 }
        );
      }

      await prisma.notification.update({
        where: { id },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });
    } else if (type === "message") {
      // Mark message as read
      const message = await prisma.message.findUnique({
        where: { id },
      });

      if (!message || message.recipientId !== currentUser.id) {
        return NextResponse.json(
          { success: false, error: "Message not found" },
          { status: 404 }
        );
      }

      await prisma.message.update({
        where: { id },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });
    } else {
      return NextResponse.json(
        { success: false, error: "Invalid type parameter" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Marked as read" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error marking item as read:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to mark item as read",
      },
      { status: 500 }
    );
  }
}

