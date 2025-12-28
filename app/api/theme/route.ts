import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";

export const dynamic = 'force-dynamic';

// GET - Fetch current theme (public endpoint, no auth required)
export async function GET(request: NextRequest) {
  try {
    // Get theme settings
    let settings;
    try {
      settings = await prisma.themeSettings.findFirst({
        orderBy: {
          updatedAt: 'desc', // Get the most recently updated settings
        },
      });
    } catch (error) {
      console.error("Error accessing themeSettings model:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorName = error instanceof Error ? error.name : 'UnknownError';
      
      // Log detailed error for debugging
      console.error("Theme API Error Details:", {
        name: errorName,
        message: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
      });

      // Check if it's a Prisma client issue
      if (errorMessage.includes('Unknown argument') || errorMessage.includes('does not exist')) {
        console.error("⚠️ Prisma client may be out of sync. Run: npx prisma generate");
      }

      // Return empty object instead of error to prevent breaking the UI
      // The app will use default theme values from globals.css
      return NextResponse.json(
        { success: true, data: {} },
        { status: 200 }
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
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Theme API Outer Error:", {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Return empty object instead of error to prevent breaking the UI
    return NextResponse.json(
      { success: true, data: {} },
      { status: 200 }
    );
  }
}

