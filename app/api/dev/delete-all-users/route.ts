import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";

/**
 * Development-only endpoint to delete all users
 * WARNING: Only use this in development!
 * 
 * Usage: POST /api/dev/delete-all-users
 */
export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "This endpoint is only available in development" },
      { status: 403 }
    );
  }

  try {
    // Count users before deletion
    const userCount = await prisma.user.count();

    if (userCount === 0) {
      return NextResponse.json({
        success: true,
        message: "No users to delete. Database is already empty.",
        deletedCount: 0,
      });
    }

    // Delete all users
    // Note: This will also delete related records due to cascade deletes
    const result = await prisma.user.deleteMany({});

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${result.count} user(s)`,
      deletedCount: result.count,
    });
  } catch (error) {
    console.error("Error deleting users:", error);
    // Don't expose error details to client (security best practice)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete users",
      },
      { status: 500 }
    );
  }
}

