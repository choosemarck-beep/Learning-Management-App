/**
 * Sanitize user input to prevent prompt injection
 * Removes or escapes potentially dangerous characters and patterns
 */
function sanitizeInput(input: string): string {
  // Remove null bytes and control characters (except newlines and tabs)
  let sanitized = input.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, "");
  
  // Limit length to prevent abuse (max 500 characters)
  if (sanitized.length > 500) {
    sanitized = sanitized.substring(0, 500);
  }
  
  // Escape special characters that could be used for injection
  // Replace newlines with spaces to prevent multi-line injection
  sanitized = sanitized.replace(/\n/g, " ");
  sanitized = sanitized.replace(/\r/g, "");
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  return sanitized;
}

/**
 * Validate JSON response from Gemini AI
 * Ensures response is valid JSON and has expected structure
 */
function validateGeminiResponse(text: string): {
  valid: boolean;
  parsed?: any;
  error?: string;
} {
  try {
    // Try to extract JSON from response (may have markdown code blocks)
    let jsonText = text.trim();
    
    // Remove markdown code blocks if present
    jsonText = jsonText.replace(/^```json\s*/i, "");
    jsonText = jsonText.replace(/^```\s*/i, "");
    jsonText = jsonText.replace(/\s*```$/i, "");
    
    // Try to find JSON object in text
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonText = jsonMatch[0];
    }
    
    const parsed = JSON.parse(jsonText);
    
    // Basic structure validation
    if (typeof parsed !== "object" || parsed === null) {
      return { valid: false, error: "Response is not a valid object" };
    }
    
    return { valid: true, parsed };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Invalid JSON",
    };
  }
}

// Initialize Gemini AI client (optional - falls back to basic search if not available)
export async function getGeminiClient() {
  try {
    // Dynamic import to handle missing package gracefully
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return null; // Return null if API key not set
    }

    return new GoogleGenerativeAI(apiKey);
  } catch (error) {
    // Package not installed or other error
    console.warn("Gemini AI package not available, falling back to basic search");
    return null;
  }
}

// Process natural language search query and convert to database query parameters
export async function processSearchQuery(query: string): Promise<{
  field?: string;
  value?: string;
  operator?: string;
  filters?: Record<string, any>;
  searchText?: string;
}> {
  try {
    // Sanitize and validate input
    if (!query || typeof query !== "string") {
      return { searchText: "" };
    }

    const sanitizedQuery = sanitizeInput(query);
    
    // If query is empty after sanitization, return empty result
    if (!sanitizedQuery) {
      return { searchText: "" };
    }

    const genAI = await getGeminiClient();
    
    // If Gemini is not available, fall back to basic text search
    if (!genAI) {
      return {
        searchText: sanitizedQuery,
      };
    }
    
    // Use gemini-1.5-flash for faster responses (current stable model)
    // gemini-pro doesn't work with v1beta API, use gemini-1.5-flash instead
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Use sanitized query in prompt (escaped for JSON)
    const escapedQuery = sanitizedQuery.replace(/"/g, '\\"').replace(/\n/g, " ");

    const prompt = `You are a database query assistant. Convert the following natural language search query into structured database query parameters for a user management system.

Available user fields:
- name: User's full name
- email: User's email address
- employeeNumber: Employee ID number
- branch: Branch location (e.g., "Manila", "Cebu")
- position: Job position/title (e.g., "Cashier", "Manager")
- company: Company name (e.g., "Game Experience", "ABC Corporation")
- companyType: Company type - "COMPANY" or "AGENCY"
  IMPORTANT: If query mentions "agency" or "agencies", set companyType to "AGENCY"
  IMPORTANT: Extract company names from phrases like "agency called X", "company named Y", "from X agency", "people from X"
- hireType: "DIRECT_HIRE" or "AGENCY"
- status: "PENDING", "APPROVED", "REJECTED", "RESIGNED"
  IMPORTANT: "Employed" or "employed" means status "APPROVED"
  IMPORTANT: "Resigned" or "resigned" means status "RESIGNED"
- role: User role (EMPLOYEE, BRANCH_MANAGER, etc.)
- department: Department name
- phone: Phone number

User query: "${escapedQuery}"

Return a JSON object with the following structure:
{
  "filters": {
    "field_name": "value",
    "another_field": "value"
  },
  "searchText": "text to search across multiple fields"
}

CRITICAL RULES:
1. If query mentions a company/agency name (e.g., "Game Experience", "ABC Corp"), extract it and set "company" filter
2. If query mentions "agency" or "agencies", set "companyType" filter to "AGENCY"
3. If query mentions "company" or "companies" (not agency), set "companyType" filter to "COMPANY"
4. Extract position titles, branch names, department names from the query
5. Use searchText for general text that should search across all fields (name, email, employeeNumber, company name, position title, branch, department)

Examples:
- "employees in Manila branch" → {"filters": {"branch": "Manila"}}
- "direct hires" → {"filters": {"hireType": "DIRECT_HIRE"}}
- "pending users" → {"filters": {"status": "PENDING"}}
- "employed" or "employed employees" → {"filters": {"status": "APPROVED"}}
- "resigned" or "resigned employees" → {"filters": {"status": "RESIGNED"}}
- "John Doe" → {"searchText": "John Doe"}
- "employees in Manila who are direct hires" → {"filters": {"branch": "Manila", "hireType": "DIRECT_HIRE"}}
- "People from an agency called Game Experience" → {"filters": {"company": "Game Experience", "companyType": "AGENCY"}}
- "employees from Game Experience" → {"filters": {"company": "Game Experience"}}
- "people from agencies" → {"filters": {"companyType": "AGENCY"}}
- "cashiers in Manila" → {"filters": {"position": "Cashier", "branch": "Manila"}}
- "managers from ABC Company" → {"filters": {"position": "Manager", "company": "ABC Company"}}

Only return valid JSON, no additional text.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Validate and parse JSON response
    const validation = validateGeminiResponse(text);
    
    if (!validation.valid || !validation.parsed) {
      console.warn("Invalid Gemini response, falling back to basic search:", validation.error);
      return {
        searchText: sanitizedQuery,
      };
    }

    return validation.parsed;
  } catch (error) {
    console.error("Error processing search query with Gemini:", error);
    // Fallback to basic text search with sanitized query
    const sanitizedQuery = sanitizeInput(query || "");
    return {
      searchText: sanitizedQuery,
    };
  }
}

