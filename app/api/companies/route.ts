import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { CompanyType } from "@prisma/client";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type") as CompanyType | null;

    const where = {
      isActive: true,
      ...(type && { type }),
    };

    const companies = await prisma.company.findMany({
      where,
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
        type: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: companies,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching companies:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch companies",
      },
      { status: 500 }
    );
  }
}

