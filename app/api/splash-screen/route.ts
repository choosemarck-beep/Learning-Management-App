import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";

// GET - Fetch splash screen image URL (public endpoint)
export async function GET(request: NextRequest) {
  try {
    // Get splash screen settings (public endpoint, no auth required)
    const settings = await prisma.splashScreenSettings.findFirst();

    // Return the image URL or null if no image is set
    return NextResponse.json(
      { 
        success: true, 
        data: {
          imageUrl: settings?.imageUrl || null,
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching splash screen image:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch splash screen image" },
      { status: 500 }
    );
  }
}

