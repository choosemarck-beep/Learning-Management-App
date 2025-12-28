import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";

export const dynamic = 'force-dynamic';

export async function GET() {
  const diagnostics: {
    timestamp: string;
    databaseUrl: string | null;
    connectionStatus: string;
    error?: string;
    details?: any;
  } = {
    timestamp: new Date().toISOString(),
    databaseUrl: process.env.DATABASE_URL ? "✅ Set (hidden for security)" : "❌ Not set",
    connectionStatus: "unknown",
  };

  try {
    // Check if DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      diagnostics.connectionStatus = "❌ Failed";
      diagnostics.error = "DATABASE_URL environment variable is not set";
      return NextResponse.json(diagnostics, { status: 500 });
    }

    // Check DATABASE_URL format
    const dbUrl = process.env.DATABASE_URL;
    const isValidFormat = dbUrl.startsWith("postgresql://") || dbUrl.startsWith("postgres://");
    
    if (!isValidFormat) {
      diagnostics.connectionStatus = "❌ Failed";
      diagnostics.error = "DATABASE_URL format is invalid (should start with postgresql:// or postgres://)";
      diagnostics.details = {
        startsWith: dbUrl.substring(0, 20) + "...",
      };
      return NextResponse.json(diagnostics, { status: 500 });
    }

    // Test database connection with a simple query
    const startTime = Date.now();
    
    // Try to connect and run a simple query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    const connectionTime = Date.now() - startTime;

    diagnostics.connectionStatus = "✅ Connected";
    diagnostics.details = {
      connectionTime: `${connectionTime}ms`,
      queryResult: result,
      databaseProvider: "Railway PostgreSQL",
      connectionString: {
        hasHost: dbUrl.includes("@"),
        hasDatabase: dbUrl.includes("/"),
        length: dbUrl.length,
      },
    };

    // Try to query a real table to ensure schema is accessible
    try {
      const userCount = await prisma.user.count();
      diagnostics.details.userCount = userCount;
      diagnostics.details.schemaAccess = "✅ Accessible";
    } catch (schemaError: any) {
      diagnostics.details.schemaError = schemaError.message;
      diagnostics.details.schemaAccess = "⚠️ Limited";
    }

    return NextResponse.json(diagnostics, { status: 200 });
  } catch (error: any) {
    diagnostics.connectionStatus = "❌ Failed";
    diagnostics.error = error.message || "Unknown error";
    diagnostics.details = {
      errorType: error.constructor.name,
      errorCode: error.code,
      errorMeta: error.meta,
    };

    // Provide helpful error messages based on common issues
    if (error.code === "P1001") {
      diagnostics.details.help = "Cannot reach database server. Check if Railway database is running and not paused.";
    } else if (error.code === "P1000") {
      diagnostics.details.help = "Authentication failed. Check if DATABASE_URL credentials are correct.";
    } else if (error.code === "P1003") {
      diagnostics.details.help = "Database does not exist. Check if the database name in DATABASE_URL is correct.";
    } else if (error.code === "ENOTFOUND" || error.code === "ECONNREFUSED") {
      diagnostics.details.help = "Cannot resolve database hostname. Check if Railway database host is correct.";
    }

    return NextResponse.json(diagnostics, { status: 500 });
  }
}

