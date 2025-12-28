import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";

export const dynamic = 'force-dynamic';

// GET - Fetch splash screen image URL (public endpoint)
export async function GET(request: NextRequest) {
  try {
    // Get splash screen settings (public endpoint, no auth required)
    let settings;
    try {
      settings = await prisma.splashScreenSettings.findFirst({
        orderBy: {
          updatedAt: 'desc', // Get the most recently updated settings
        },
      });
    } catch (error) {
      console.error("Error accessing splashScreenSettings model:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorName = error instanceof Error ? error.name : 'UnknownError';
      
      // Log detailed error for debugging
      console.error("Splash Screen API Error Details:", {
        name: errorName,
        message: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
      });

      // Check if it's a Prisma client issue
      if (errorMessage.includes('Unknown argument') || errorMessage.includes('does not exist')) {
        console.error("⚠️ Prisma client may be out of sync. Run: npx prisma generate");
      }

      // Return null instead of error to prevent breaking the UI
      // The app will use default gradient
      return NextResponse.json(
        { 
          success: true, 
          data: {
            imageUrl: null,
          }
        },
        { status: 200 }
      );
    }

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
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Splash Screen API Outer Error:", {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Return null instead of error to prevent breaking the UI
    return NextResponse.json(
      { 
        success: true, 
        data: {
          imageUrl: null,
        }
      },
      { status: 200 }
    );
  }
}

