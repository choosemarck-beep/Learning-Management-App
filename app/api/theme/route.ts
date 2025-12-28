import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";

export const dynamic = 'force-dynamic';

// GET - Fetch current theme (public endpoint, no auth required)
export async function GET(request: NextRequest) {
  try {
    // Get theme settings
    let settings;
    try {
      settings = await prisma.themeSettings.findFirst();
    } catch (error) {
      console.error("Error accessing themeSettings model:", error);
      // Don't expose database error details to client
      return NextResponse.json(
        { success: false, error: "Failed to fetch theme settings" },
        { status: 500 }
      );
    }

    // If no settings exist, return empty object (use defaults from globals.css)
    if (!settings) {
      return NextResponse.json(
        { success: true, data: {} },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { success: true, data: settings },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching theme:", error);
    // Don't expose error details to client
    return NextResponse.json(
      { success: false, error: "Failed to fetch theme settings" },
      { status: 500 }
    );
  }
}

