import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";

// GET - Fetch current logo (public endpoint, no auth required)
export async function GET(request: NextRequest) {
  try {
    // Get logo settings
    let settings;
    try {
      settings = await prisma.appLogoSettings.findFirst();
    } catch (error) {
      console.error("Error accessing appLogoSettings model:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return NextResponse.json(
        { success: false, error: `Database error: ${errorMessage}. Please restart the dev server after regenerating Prisma client.` },
        { status: 500 }
      );
    }

    // If no settings exist, return null (use default text logo)
    if (!settings) {
      return NextResponse.json(
        { success: true, data: { imageUrl: null } },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { success: true, data: settings },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching logo:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch logo" },
      { status: 500 }
    );
  }
}

