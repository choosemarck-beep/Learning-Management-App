import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma/client";
import { uploadToCloudinary, deleteFromCloudinary, extractPublicIdFromUrl } from "@/lib/cloudinary/config";

export const dynamic = 'force-dynamic';

// GET - Fetch all carousel images (admin)
export async function GET(request: NextRequest) {
  try {
    // Wrap getCurrentUser in try-catch
    let currentUser;
    try {
      currentUser = await getCurrentUser();
    } catch (authError) {
      console.error("Error getting current user:", authError);
      return NextResponse.json(
        { success: false, error: "Authentication error" },
        { status: 401 }
      );
    }

    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (currentUser.role !== "ADMIN" && currentUser.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    // Wrap Prisma queries in try-catch
    try {
      const images = await prisma.carouselImage.findMany({
        orderBy: [
          { order: "asc" },
          { createdAt: "desc" },
        ],
      });

      return NextResponse.json(
        { success: true, data: images },
        { status: 200 }
      );
    } catch (dbError) {
      console.error("Database error fetching carousel images:", dbError);
      return NextResponse.json(
        { success: false, error: "Failed to fetch carousel images" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Unexpected error in GET /api/admin/carousel:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

// POST - Create new carousel image
export async function POST(request: NextRequest) {
  try {
    // Wrap getCurrentUser in try-catch
    let currentUser;
    try {
      currentUser = await getCurrentUser();
    } catch (authError) {
      console.error("Error getting current user:", authError);
      return NextResponse.json(
        { success: false, error: "Authentication error" },
        { status: 401 }
      );
    }

    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (currentUser.role !== "ADMIN" && currentUser.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("image") as File;
    const title = formData.get("title") as string | null;
    const description = formData.get("description") as string | null;
    const orderParam = formData.get("order");
    const isActiveParam = formData.get("isActive");
    const order = orderParam ? parseInt(orderParam as string, 10) : undefined;
    const isActive = isActiveParam ? isActiveParam === "true" : true;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { success: false, error: "File must be an image" },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: "File size must be less than 5MB" },
        { status: 400 }
      );
    }

    // Validate file name
    if (!file.name || typeof file.name !== 'string' || file.name.trim() === '') {
      return NextResponse.json(
        { success: false, error: "File name is required" },
        { status: 400 }
      );
    }

    // Convert file to buffer
    let buffer: Buffer;
    try {
      const bytes = await file.arrayBuffer();
      buffer = Buffer.from(bytes);
      
      // Validate buffer was created successfully
      if (!buffer || buffer.length === 0) {
        return NextResponse.json(
          { success: false, error: "File buffer is empty" },
          { status: 400 }
        );
      }
    } catch (bufferError) {
      console.error("[Carousel] Error converting file to buffer:", bufferError);
      return NextResponse.json(
        { success: false, error: "Failed to process file" },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const filename = `carousel-${timestamp}.${fileExtension}`;

    // Check Cloudinary configuration before upload
    const hasCloudinaryConfig = !!(
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    );
    
    if (!hasCloudinaryConfig) {
      console.error("[Carousel] Cloudinary configuration missing:", {
        hasCloudName: !!process.env.CLOUDINARY_CLOUD_NAME,
        hasApiKey: !!process.env.CLOUDINARY_API_KEY,
        hasApiSecret: !!process.env.CLOUDINARY_API_SECRET,
      });
      return NextResponse.json(
        { 
          success: false, 
          error: "Image upload service is not configured. Please contact your administrator.",
          details: process.env.NODE_ENV === "development" 
            ? "Cloudinary environment variables are missing. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in Vercel."
            : undefined,
        },
        { status: 500 }
      );
    }

    // Upload to Cloudinary
    let imageUrl: string;
    try {
      console.log("[Carousel] Starting Cloudinary upload:", { 
        filename, 
        size: buffer.length,
        hasCloudinaryConfig: !!(
          process.env.CLOUDINARY_CLOUD_NAME &&
          process.env.CLOUDINARY_API_KEY &&
          process.env.CLOUDINARY_API_SECRET
        ),
      });
      
      imageUrl = await uploadToCloudinary(buffer, 'carousel', filename, 'image');
      console.log(`[Carousel] Successfully uploaded to Cloudinary: ${imageUrl}`);
    } catch (uploadError) {
      // uploadToCloudinary now throws Error with proper message, but handle edge cases
      const errorMessage = uploadError instanceof Error 
        ? uploadError.message 
        : (uploadError && typeof uploadError === 'object' && 'message' in uploadError)
          ? String((uploadError as any).message)
          : String(uploadError);
      
      // Check if it's a configuration error
      const isConfigError = errorMessage.includes('Cloudinary configuration') || 
                          errorMessage.includes('missing') ||
                          !process.env.CLOUDINARY_CLOUD_NAME ||
                          !process.env.CLOUDINARY_API_KEY ||
                          !process.env.CLOUDINARY_API_SECRET;
      
      console.error("[Carousel] Cloudinary upload error:", {
        message: errorMessage,
        stack: uploadError instanceof Error ? uploadError.stack : undefined,
        filename,
        bufferSize: buffer.length,
        errorType: uploadError instanceof Error ? 'Error' : typeof uploadError,
        isConfigError,
        hasCloudName: !!process.env.CLOUDINARY_CLOUD_NAME,
        hasApiKey: !!process.env.CLOUDINARY_API_KEY,
        hasApiSecret: !!process.env.CLOUDINARY_API_SECRET,
      });
      
      return NextResponse.json(
        { 
          success: false, 
          error: isConfigError 
            ? "Image upload service is not configured. Please contact your administrator."
            : "Failed to upload image. Please try again.",
          details: process.env.NODE_ENV === "development" ? {
            message: errorMessage,
            isConfigError,
            hasCloudName: !!process.env.CLOUDINARY_CLOUD_NAME,
            hasApiKey: !!process.env.CLOUDINARY_API_KEY,
            hasApiSecret: !!process.env.CLOUDINARY_API_SECRET,
          } : undefined,
        },
        { status: 500 }
      );
    }

    // Wrap Prisma queries in try-catch
    try {
      // Determine order - use provided order or append at end
      let newOrder: number;
      if (order !== undefined) {
        newOrder = order;
      } else {
        const maxOrder = await prisma.carouselImage.aggregate({
          _max: { order: true },
        });
        newOrder = (maxOrder._max.order ?? -1) + 1;
      }

      // Create carousel image record
      const carouselImage = await prisma.carouselImage.create({
        data: {
          imageUrl,
          title: title || null,
          description: description || null,
          order: newOrder,
          isActive,
          createdBy: currentUser.id,
        },
      });

      return NextResponse.json(
        { success: true, data: carouselImage },
        { status: 201 }
      );
    } catch (dbError) {
      console.error("Database error creating carousel image:", dbError);
      const errorMessage = dbError instanceof Error ? dbError.message : String(dbError);
      const errorCode = dbError && typeof dbError === "object" && "code" in dbError ? (dbError as any).code : undefined;
      console.error("Database error details:", {
        message: errorMessage,
        code: errorCode,
        stack: dbError instanceof Error ? dbError.stack : undefined,
      });
      
      // If database update fails, try to delete the file we just uploaded to Cloudinary
      if (imageUrl) {
        const publicId = extractPublicIdFromUrl(imageUrl);
        if (publicId) {
          try {
            await deleteFromCloudinary(publicId, 'image');
            console.error("[Carousel] Cleaned up Cloudinary upload due to DB error:", publicId);
          } catch (deleteError) {
            console.error("[Carousel] Error cleaning up Cloudinary upload:", deleteError);
          }
        }
      }
      
      return NextResponse.json(
        { 
          success: false, 
          error: "Failed to create carousel image",
          details: process.env.NODE_ENV === "development" ? errorMessage : undefined,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Unexpected error in POST /api/admin/carousel:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Unexpected error details:", {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { 
        success: false, 
        error: "An unexpected error occurred",
        details: process.env.NODE_ENV === "development" ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}

