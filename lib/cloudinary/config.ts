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

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `learning-management/${folder}`,
        public_id: filename.replace(/\.[^/.]+$/, ''), // Remove file extension (Cloudinary handles it)
        resource_type: resourceType,
        overwrite: false, // Don't overwrite existing files
        invalidate: true, // Invalidate CDN cache
      },
      (error, result) => {
        if (error) {
          console.error('[Cloudinary] Upload error:', error);
          reject(new Error(`Failed to upload to Cloudinary: ${error.message}`));
          return;
        }
        
        if (!result || !result.secure_url) {
          reject(new Error('Cloudinary upload succeeded but no URL returned'));
          return;
        }

        console.log(`[Cloudinary] Successfully uploaded to: ${result.secure_url}`);
        resolve(result.secure_url);
      }
    );

    // Write buffer to upload stream
    uploadStream.end(buffer);
  });
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

  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, { resource_type: resourceType }, (error, result) => {
      if (error) {
        console.error('[Cloudinary] Delete error:', error);
        reject(new Error(`Failed to delete from Cloudinary: ${error.message}`));
        return;
      }

      if (result?.result === 'ok') {
        console.log(`[Cloudinary] Successfully deleted: ${publicId}`);
        resolve();
      } else {
        console.warn(`[Cloudinary] Delete result: ${result?.result}`);
        resolve(); // Resolve anyway - file might not exist
      }
    });
  });
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

