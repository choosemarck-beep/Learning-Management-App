import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
// These environment variables will be set by the user
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || '',
  secure: true, // Use HTTPS
});

export { cloudinary };

/**
 * Upload a file to Cloudinary
 * @param buffer - File buffer
 * @param folder - Folder path in Cloudinary (e.g., 'carousel', 'avatars', 'splash')
 * @param filename - Unique filename
 * @param resourceType - 'image' or 'video'
 * @returns Public URL of uploaded file
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  folder: string,
  filename: string,
  resourceType: 'image' | 'video' = 'image'
): Promise<string> {
  // Validate Cloudinary configuration
  if (!process.env.CLOUDINARY_CLOUD_NAME || 
      !process.env.CLOUDINARY_API_KEY || 
      !process.env.CLOUDINARY_API_SECRET) {
    throw new Error('Cloudinary configuration is missing. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables.');
  }

  try {
    // Validate filename
    if (!filename || typeof filename !== 'string') {
      throw new Error('Filename is required and must be a string');
    }

    // Convert buffer to data URI format for Cloudinary
    // This avoids using upload_stream which may trigger deprecation warnings
    const safeFilename = filename.trim() || `upload-${Date.now()}`;
    const mimeType = resourceType === 'image' 
      ? (safeFilename.match(/\.(jpg|jpeg)$/i) ? 'image/jpeg' : 
         safeFilename.match(/\.png$/i) ? 'image/png' : 
         safeFilename.match(/\.gif$/i) ? 'image/gif' : 
         safeFilename.match(/\.webp$/i) ? 'image/webp' : 'image/jpeg')
      : (safeFilename.match(/\.mp4$/i) ? 'video/mp4' : 
         safeFilename.match(/\.webm$/i) ? 'video/webm' : 
         safeFilename.match(/\.mov$/i) ? 'video/quicktime' : 'video/mp4');
    
    const base64 = buffer.toString('base64');
    const dataUri = `data:${mimeType};base64,${base64}`;

    // Extract public_id from filename (remove extension)
    const publicId = safeFilename.replace(/\.[^/.]+$/, '') || `upload-${Date.now()}`;

    // Use promise-based upload API instead of upload_stream
    // This is more reliable and may avoid deprecation warnings
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: `learning-management/${folder}`,
      public_id: publicId, // Remove file extension (Cloudinary handles it)
      resource_type: resourceType,
      overwrite: false, // Don't overwrite existing files
      invalidate: true, // Invalidate CDN cache
    });

    if (!result || !result.secure_url) {
      throw new Error('Cloudinary upload succeeded but no URL returned');
    }

    console.log(`[Cloudinary] Successfully uploaded to: ${result.secure_url}`);
    return result.secure_url;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[Cloudinary] Upload error:', {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      filename,
      resourceType,
      bufferSize: buffer.length,
    });
    throw new Error(`Failed to upload to Cloudinary: ${errorMessage}`);
  }
}

/**
 * Delete a file from Cloudinary
 * @param publicId - Public ID of the file (extracted from URL or stored separately)
 * @param resourceType - 'image' or 'video'
 */
export async function deleteFromCloudinary(
  publicId: string,
  resourceType: 'image' | 'video' = 'image'
): Promise<void> {
  if (!process.env.CLOUDINARY_CLOUD_NAME || 
      !process.env.CLOUDINARY_API_KEY || 
      !process.env.CLOUDINARY_API_SECRET) {
    throw new Error('Cloudinary configuration is missing.');
  }

  try {
    // Use promise-based destroy API
    const result = await cloudinary.uploader.destroy(publicId, { 
      resource_type: resourceType 
    });

    if (result?.result === 'ok') {
      console.log(`[Cloudinary] Successfully deleted: ${publicId}`);
    } else {
      console.warn(`[Cloudinary] Delete result: ${result?.result} for publicId: ${publicId}`);
      // Resolve anyway - file might not exist or already deleted
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[Cloudinary] Delete error:', {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      publicId,
      resourceType,
    });
    // Don't throw - file might not exist, which is fine
    console.warn('[Cloudinary] Continuing despite delete error - file may not exist');
  }
}

/**
 * Extract public ID from Cloudinary URL
 * @param url - Cloudinary URL
 * @returns Public ID or null if not a Cloudinary URL
 */
export function extractPublicIdFromUrl(url: string): string | null {
  try {
    // Cloudinary URLs format: https://res.cloudinary.com/{cloud_name}/{resource_type}/upload/{transformations}/{version}/{public_id}.{format}
    const match = url.match(/\/v\d+\/(.+?)(?:\.[^.]+)?$/);
    if (match) {
      return match[1];
    }
    return null;
  } catch {
    return null;
  }
}

