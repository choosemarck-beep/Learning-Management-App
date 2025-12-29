import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { z } from "zod";

const checkApprovalSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = checkApprovalSchema.parse(body);

    // Normalize email to lowercase for case-insensitive lookup
    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        status: true,
      },
    });

    if (!user) {
      // User doesn't exist - don't reveal this for security
      return NextResponse.json(
        { status: "UNKNOWN" },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { status: user.status },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error checking approval status:", error);
    return NextResponse.json(
      { error: "Failed to check approval status" },
      { status: 500 }
    );
  }
}

