/**
 * Image Compression Utility
 * Compresses images client-side before upload to reduce file size
 * and ensure fast uploads, especially on mobile devices.
 */

/**
 * Compresses an image file to a target size by resizing and reducing quality
 * @param file - The image file to compress
 * @param maxSizeKB - Maximum file size in KB (default: 500KB)
 * @param maxWidth - Maximum width in pixels (default: 800px)
 * @param maxHeight - Maximum height in pixels (default: 800px)
 * @returns Promise<Blob> - Compressed image blob
 */
export async function compressImage(
  file: File,
  maxSizeKB: number = 500,
  maxWidth: number = 800,
  maxHeight: number = 800
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    // Validate input
    if (!file || !file.type.startsWith("image/")) {
      return reject(new Error("Invalid file provided"));
    }

    // Create image element
    const img = new Image();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      return reject(new Error("Canvas context not available"));
    }

    // Handle image load
    img.onload = () => {
      try {
        // Calculate new dimensions while maintaining aspect ratio
        let width = img.width;
        let height = img.height;

        // Resize if image is larger than max dimensions
        if (width > maxWidth || height > maxHeight) {
          const aspectRatio = width / height;

          if (width > height) {
            width = Math.min(width, maxWidth);
            height = width / aspectRatio;
          } else {
            height = Math.min(height, maxHeight);
            width = height * aspectRatio;
          }
        }

        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;

        // Draw image to canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Progressive quality reduction until target size is reached
        let quality = 0.9;
        const minQuality = 0.1;
        const qualityStep = 0.1;
        const maxSizeBytes = maxSizeKB * 1024;

        const tryCompress = (currentQuality: number): void => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                return reject(new Error("Failed to create compressed image"));
              }

              // If blob is small enough or quality is too low, return it
              if (blob.size <= maxSizeBytes || currentQuality <= minQuality) {
                resolve(blob);
                return;
              }

              // Try lower quality
              const nextQuality = Math.max(
                currentQuality - qualityStep,
                minQuality
              );
              tryCompress(nextQuality);
            },
            "image/jpeg", // Use JPEG for better compression
            currentQuality
          );
        };

        // Start compression
        tryCompress(quality);
      } catch (error) {
        reject(
          error instanceof Error
            ? error
            : new Error("Failed to compress image")
        );
      }
    };

    // Handle image load errors
    img.onerror = () => {
      reject(new Error("Failed to load image"));
    };

    // Handle CORS issues for cross-origin images
    img.crossOrigin = "anonymous";

    // Load image from file
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        img.src = e.target.result as string;
      }
    };
    reader.onerror = () => {
      reject(new Error("Failed to read image file"));
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Compresses an image from a Blob (useful for canvas operations)
 * @param blob - The image blob to compress
 * @param maxSizeKB - Maximum file size in KB (default: 500KB)
 * @param maxWidth - Maximum width in pixels (default: 800px)
 * @param maxHeight - Maximum height in pixels (default: 800px)
 * @returns Promise<Blob> - Compressed image blob
 */
export async function compressImageFromBlob(
  blob: Blob,
  maxSizeKB: number = 500,
  maxWidth: number = 800,
  maxHeight: number = 800
): Promise<Blob> {
  const file = new File([blob], "image.jpg", { type: blob.type || "image/jpeg" });
  return compressImage(file, maxSizeKB, maxWidth, maxHeight);
}

