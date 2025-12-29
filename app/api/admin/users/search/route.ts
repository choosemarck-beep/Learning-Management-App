import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma/client";
import { processSearchQuery } from "@/lib/ai/gemini";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Wrap getCurrentUser in try-catch
    let user;
    try {
      user = await getCurrentUser();
    } catch (authError) {
      console.error("Error getting current user:", authError);
      return NextResponse.json(
        { success: false, error: "Authentication error" },
        { status: 401 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is admin or super admin
    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        { success: false, error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { query } = body;

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Search query is required" },
        { status: 400 }
      );
    }

    // Normalize query for status mapping
    const normalizedQuery = query.toLowerCase().trim();
    
    // Check if query is a status search first (before Gemini processing)
    let statusFilter: string | null = null;
    if (normalizedQuery === "employed" || normalizedQuery === "employed employees" || normalizedQuery.includes("employed")) {
      statusFilter = "APPROVED"; // Only currently employed (not resigned)
    } else if (normalizedQuery === "resigned" || normalizedQuery === "resigned employees" || normalizedQuery.includes("resigned")) {
      statusFilter = "RESIGNED";
    }

    // Detect agency/company keywords for better fallback search
    const isAgencyQuery = normalizedQuery.includes("agency") || normalizedQuery.includes("agencies");
    const isCompanyQuery = normalizedQuery.includes("company") || normalizedQuery.includes("companies");
    
    // Extract company name from common patterns (fallback if Gemini doesn't catch it)
    let extractedCompanyName: string | null = null;
    
    // Try to extract company name from various patterns
    // Pattern 1: "agency called X" or "company named X"
    let match = query.match(/(?:agency|company)\s+(?:called|named)\s+["']?([^"']+?)(?:\s|$)/i);
    if (match && match[1]) {
      extractedCompanyName = match[1].trim();
    }
    
    // Pattern 2: "from an agency called X" or "from a company named X"
    if (!extractedCompanyName) {
      match = query.match(/(?:from|at)\s+(?:an?\s+)?(?:agency|company)\s+(?:called|named)\s+["']?([^"']+?)(?:\s|$)/i);
      if (match && match[1]) {
        extractedCompanyName = match[1].trim();
      }
    }
    
    // Pattern 3: "people from X agency" or "employees from X"
    if (!extractedCompanyName) {
      match = query.match(/(?:people|employees|users)\s+from\s+["']?([^"']+?)(?:\s+(?:agency|company))?["']?/i);
      if (match && match[1]) {
        extractedCompanyName = match[1].trim();
      }
    }
    
    // Pattern 4: "X agency" or "X company" (at end)
    if (!extractedCompanyName) {
      match = query.match(/"([^"]+)"\s+(?:agency|company)/i);
      if (match && match[1]) {
        extractedCompanyName = match[1].trim();
      }
    }
    
    // Pattern 5: Just "called X" or "named X"
    if (!extractedCompanyName) {
      match = query.match(/(?:called|named)\s+["']?([^"']+?)(?:\s+(?:agency|company))?["']?$/i);
      if (match && match[1]) {
        extractedCompanyName = match[1].trim();
      }
    }
    
    // Clean up extracted name
    if (extractedCompanyName) {
      extractedCompanyName = extractedCompanyName.replace(/\s+(agency|company)$/i, '').trim();
    }
    
    console.log("Query:", query);
    console.log("Extracted company name:", extractedCompanyName);
    console.log("Is agency query:", isAgencyQuery);

    // Process query with Gemini AI (if not a direct status search)
    let searchParams;
    if (statusFilter) {
      // Direct status search - skip Gemini
      searchParams = { filters: { status: statusFilter } };
    } else {
      try {
        searchParams = await processSearchQuery(query);
      } catch (error) {
        console.error("Gemini processing error:", error);
        // Fallback to basic text search
        searchParams = { searchText: query };
      }
    }

    // Build where clause
    const where: any = {};

    // Apply role-based filtering for regular admins
    if (user.role === "ADMIN") {
      where.role = {
        notIn: ["ADMIN", "SUPER_ADMIN"],
      };
    }

    // Use extracted company name if Gemini didn't provide one
    // Also extract individual words for better matching
    if (extractedCompanyName && (!searchParams.filters || !searchParams.filters.company)) {
      if (!searchParams.filters) {
        searchParams.filters = {};
      }
      // Use the extracted name, but also prepare individual words for flexible searching
      searchParams.filters.company = extractedCompanyName;
      // Store words separately for later use in text search
      const companyWords = extractedCompanyName.split(/\s+/).filter(w => w.length > 2);
      if (companyWords.length > 0) {
        searchParams.filters.companyWords = companyWords;
      }
    }
    
    // Use agency type if detected and Gemini didn't provide it
    if (isAgencyQuery && (!searchParams.filters || !searchParams.filters.companyType)) {
      if (!searchParams.filters) {
        searchParams.filters = {};
      }
      searchParams.filters.companyType = "AGENCY";
    }

    // Apply filters from Gemini (or extracted)
    if (searchParams.filters) {
      Object.entries(searchParams.filters).forEach(([field, value]: [string, unknown]) => {
        switch (field) {
          case "branch":
            where.branch = { contains: value as string, mode: "insensitive" };
            break;
          case "hireType":
            where.hireType = value;
            break;
          case "status":
            // Map display text to database values
            const statusValue = String(value).toUpperCase();
            if (statusValue === "EMPLOYED" || statusValue === "EMPLOYED EMPLOYEES") {
              where.status = "APPROVED"; // Only currently employed, excludes RESIGNED
            } else if (statusValue === "RESIGNED" || statusValue === "RESIGNED EMPLOYEES") {
              where.status = "RESIGNED";
            } else {
              // Direct status value (PENDING, APPROVED, REJECTED, RESIGNED)
              where.status = value;
            }
            break;
          case "role":
            where.role = value;
            break;
          case "department":
            where.department = { contains: value as string, mode: "insensitive" };
            break;
          case "company":
            if (!where.company) {
              where.company = {};
            }
            // For company name search, search for the full phrase
            // Prisma's contains will match partial strings (e.g., "Game" matches "Gamexperience")
            where.company.name = { contains: value as string, mode: "insensitive" };
            break;
          case "companyType":
            // Filter by company type (AGENCY or COMPANY)
            if (!where.company) {
              where.company = {};
            }
            where.company.type = value as string;
            break;
          case "position":
            where.position = {
              title: { contains: value as string, mode: "insensitive" },
            };
            break;
        }
      });
    }

    // If we have company filters, don't use OR - use direct filtering
    // This prevents conflicts between top-level filters and OR conditions
    const hasCompanyFilter = where.company && (where.company.name || where.company.type);
    
    // Apply text search across multiple fields (only if no status filter was set and no company filter)
    if (searchParams.searchText && !statusFilter && !hasCompanyFilter) {
      const searchText = searchParams.searchText.toLowerCase().trim();
      
      // Double-check for status keywords in search text
      if (searchText === "employed" || searchText === "employed employees" || searchText.includes("employed")) {
        where.status = "APPROVED"; // Only currently employed, excludes RESIGNED
      } else if (searchText === "resigned" || searchText === "resigned employees" || searchText.includes("resigned")) {
        where.status = "RESIGNED";
      } else {
        // Determine company type filter if needed
        let companyTypeFilter: string | undefined;
        if (isAgencyQuery) {
          companyTypeFilter = "AGENCY";
        } else if (isCompanyQuery && !isAgencyQuery) {
          companyTypeFilter = "COMPANY";
        }

        // Build OR conditions for text search
        const orConditions: any[] = [
          { name: { contains: searchParams.searchText, mode: "insensitive" } },
          { email: { contains: searchParams.searchText, mode: "insensitive" } },
          { employeeNumber: { contains: searchParams.searchText, mode: "insensitive" } },
          { phone: { contains: searchParams.searchText, mode: "insensitive" } },
          { branch: { contains: searchParams.searchText, mode: "insensitive" } },
          { department: { contains: searchParams.searchText, mode: "insensitive" } },
        ];

        // Add company search - include type filter if we have one
        const companySearch: any = {
          name: { contains: searchParams.searchText, mode: "insensitive" },
        };
        if (companyTypeFilter) {
          companySearch.type = companyTypeFilter;
        }
        orConditions.push({ company: companySearch });

        // Add position search
        orConditions.push({
          position: {
            title: { contains: searchParams.searchText, mode: "insensitive" },
          },
        });

        where.OR = orConditions;
      }
    } else if (!searchParams.filters && !statusFilter && !hasCompanyFilter) {
      // Fallback: if no filters and no searchText, but query contains agency/company keywords,
      // apply company type filter and search the query text
      if (isAgencyQuery || isCompanyQuery || extractedCompanyName) {
        const companyTypeFilter = isAgencyQuery ? "AGENCY" : undefined;
        
        // If we extracted a company name, use it for filtering
        if (extractedCompanyName) {
          // For multi-word company names, search for individual words using OR
          // This helps match "Game Experience" to "Gamexperience Employment Services"
          const companyWords = extractedCompanyName.split(/\s+/).filter(w => w.length > 2);
          
          if (companyWords.length > 1) {
            // Multiple words - create OR conditions to search for any word
            // This allows "Game" or "Experience" to match "Gamexperience"
            const companyConditions = companyWords.map(word => ({
              company: {
                name: { contains: word, mode: "insensitive" },
                ...(companyTypeFilter ? { type: companyTypeFilter } : {})
              }
            }));
            
            // Combine with existing OR or create new
            if (where.OR) {
              where.OR = [...where.OR, ...companyConditions];
            } else {
              where.OR = companyConditions;
            }
            // Don't set where.company when using OR
          } else {
            // Single word - use direct company filter
            if (!where.company) {
              where.company = {};
            }
            where.company.name = { contains: extractedCompanyName, mode: "insensitive" };
            if (companyTypeFilter) {
              where.company.type = companyTypeFilter;
            }
          }
        } else if (companyTypeFilter) {
          // Only type filter, no name - use OR to search across all fields
          const orConditions: any[] = [
            { name: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
            { employeeNumber: { contains: query, mode: "insensitive" } },
            { phone: { contains: query, mode: "insensitive" } },
            { branch: { contains: query, mode: "insensitive" } },
            { department: { contains: query, mode: "insensitive" } },
            {
              company: {
                name: { contains: query, mode: "insensitive" },
                type: companyTypeFilter,
              },
            },
            {
              position: {
                title: { contains: query, mode: "insensitive" },
              },
            },
          ];
          where.OR = orConditions;
        }
      }
    }
    
    // Debug logging
    console.log("Final where clause:", JSON.stringify(where, null, 2));

    // Wrap Prisma queries in try-catch
    try {
      // Fetch matching users
      const users = await prisma.user.findMany({
        where,
        include: {
          company: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
          position: {
            select: {
              id: true,
              title: true,
              role: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return NextResponse.json(
        {
          success: true,
          data: users,
          query: query,
          resultCount: users.length,
        },
        { status: 200 }
      );
    } catch (dbError) {
      console.error("Database error searching users:", dbError);
      return NextResponse.json(
        { success: false, error: "Failed to search users" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Unexpected error in POST /api/admin/users/search:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

