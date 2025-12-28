import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const positions = await prisma.position.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        title: "asc",
      },
      select: {
        id: true,
        title: true,
        role: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: positions,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching positions:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch positions",
      },
      { status: 500 }
    );
  }
}

