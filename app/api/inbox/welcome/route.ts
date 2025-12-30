import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/utils";
import { createWelcomeMessage } from "@/lib/utils/onboarding";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Create welcome message
    const created = await createWelcomeMessage(user.id, user.name || "User");

    if (!created) {
      return NextResponse.json(
        { success: false, error: "Welcome message already exists" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Welcome message created successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("[WelcomeMessage] Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

