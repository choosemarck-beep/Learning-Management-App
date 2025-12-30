"use client";

import React, { useState, useRef, useEffect } from "react";
import { X, Upload, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import styles from "./AvatarUploadModal.module.css";
import toast from "react-hot-toast";
import {
  compressImage,
  compressImageFromBlob,
} from "@/lib/utils/imageCompression";

export interface AvatarUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatar?: string | null;
  onUploadComplete: (avatarUrl: string) => void;
}

export const AvatarUploadModal: React.FC<AvatarUploadModalProps> = ({
  isOpen,
  onClose,
  currentAvatar,
  onUploadComplete,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedFile(null);
      setPreview(null);
    }
  }, [isOpen]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // No file size validation - compression will handle large files
    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCropAndUpload = async () => {
    if (!selectedFile || !preview || !canvasRef.current || !imageRef.current) {
      return;
    }

    setIsUploading(true);

    try {
      // Step 1: Compress the original image first (resize to max 800x800 and compress)
      let compressedBlob: Blob;
      try {
        compressedBlob = await compressImage(selectedFile, 500, 800, 800);
        console.log(
          `Image compressed: ${(selectedFile.size / 1024).toFixed(2)}KB → ${(compressedBlob.size / 1024).toFixed(2)}KB`
        );
      } catch (compressionError) {
        console.error("Compression error:", compressionError);
        // If compression fails, try to proceed with original file
        // Convert file to blob for canvas processing
        const fileBlob = await selectedFile.arrayBuffer();
        compressedBlob = new Blob([fileBlob], { type: selectedFile.type });
        toast.error(
          "Image compression failed. Uploading original image. This may take longer."
        );
      }

      // Step 2: Load compressed image for cropping
      const compressedImageUrl = URL.createObjectURL(compressedBlob);
      const compressedImg = new Image();
      
      await new Promise((resolve, reject) => {
        compressedImg.onload = resolve;
        compressedImg.onerror = reject;
        compressedImg.crossOrigin = "anonymous";
        compressedImg.src = compressedImageUrl;
      });

      // Wait for the preview image to load (for dimensions)
      await new Promise((resolve) => {
        if (imageRef.current?.complete) {
          resolve(null);
        } else {
          imageRef.current?.addEventListener("load", resolve);
        }
      });

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("Could not get canvas context");
      }

      // Use compressed image for cropping
      const img = compressedImg;
      
      // Calculate the square crop size (use the smaller dimension)
      const size = Math.min(img.width, img.height);
      const x = (img.width - size) / 2;
      const y = (img.height - size) / 2;

      // Set canvas size to 400x400 (high quality for avatar)
      canvas.width = 400;
      canvas.height = 400;

      // Clear canvas
      ctx.clearRect(0, 0, 400, 400);

      // Create circular clipping path
      ctx.beginPath();
      ctx.arc(200, 200, 200, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      // Draw the cropped image (centered square from source)
      ctx.drawImage(img, x, y, size, size, 0, 0, 400, 400);

      // Step 3: Convert cropped canvas to blob and apply final compression if needed
      canvas.toBlob(
        async (croppedBlob) => {
          try {
            if (!croppedBlob) {
              throw new Error("Failed to create image blob");
            }

            // Apply final compression to cropped image (target 300KB for final avatar)
            let finalBlob: Blob;
            try {
              finalBlob = await compressImageFromBlob(croppedBlob, 300, 400, 400);
              console.log(
                `Final avatar size: ${(finalBlob.size / 1024).toFixed(2)}KB`
              );
            } catch (finalCompressionError) {
              console.warn("Final compression failed, using cropped blob:", finalCompressionError);
              finalBlob = croppedBlob;
            }

            // Clean up object URL
            URL.revokeObjectURL(compressedImageUrl);

            // Create FormData
            const formData = new FormData();
            formData.append("avatar", finalBlob, "avatar.jpg");

            // Upload to API
            console.log("[AvatarUploadModal] Uploading to API...");
            const response = await fetch("/api/user/upload-avatar", {
              method: "POST",
              body: formData,
            });

            const data = await response.json();
            console.log("[AvatarUploadModal] API response:", {
              ok: response.ok,
              success: data.success,
              error: data.error,
              hasAvatarUrl: !!data.avatarUrl,
            });

            if (!response.ok || !data.success) {
              const errorMessage = data.error || data.details || "Failed to upload avatar";
              console.error("[AvatarUploadModal] Upload failed:", errorMessage);
              throw new Error(errorMessage);
            }

            toast.success("Avatar updated successfully!");
            // Update session to refresh avatar everywhere
            // The onUploadComplete callback will handle session update in ProfileHeader
            onUploadComplete(data.avatarUrl);
            onClose();
          } catch (uploadError) {
            console.error("Upload error:", uploadError);
            toast.error(
              uploadError instanceof Error
                ? uploadError.message
                : "Failed to upload avatar"
            );
            setIsUploading(false);
          }
        },
        "image/jpeg", // Use JPEG for better compression
        0.9
      );
    } catch (error) {
      console.error("Error processing avatar:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to process avatar image"
      );
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Upload Profile Photo</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.content}>
          {!preview ? (
            <div className={styles.uploadArea}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className={styles.fileInput}
                id="avatar-upload"
              />
              <label htmlFor="avatar-upload" className={styles.uploadLabel}>
                <Upload size={32} className={styles.uploadIcon} />
                <p className={styles.uploadText}>Click to select an image</p>
                <p className={styles.uploadHint}>
                  PNG, JPG - any size (auto-compressed)
                </p>
              </label>
            </div>
          ) : (
            <div className={styles.previewArea}>
              <div className={styles.previewContainer}>
                {/* Hidden image for loading and cropping */}
                <img
                  ref={imageRef}
                  src={preview}
                  alt="Preview"
                  className={styles.hiddenImage}
                  crossOrigin="anonymous"
                  onLoad={() => {
                    // Update preview circle when image loads
                    if (imageRef.current && canvasRef.current) {
                      const img = imageRef.current;
                      const canvas = canvasRef.current;
                      const ctx = canvas.getContext("2d");
                      
                      if (ctx) {
                        const size = Math.min(img.width, img.height);
                        const x = (img.width - size) / 2;
                        const y = (img.height - size) / 2;
                        
                        canvas.width = 200;
                        canvas.height = 200;
                        
                        ctx.beginPath();
                        ctx.arc(100, 100, 100, 0, Math.PI * 2);
                        ctx.closePath();
                        ctx.clip();
                        
                        ctx.drawImage(img, x, y, size, size, 0, 0, 200, 200);
                      }
                    }
                  }}
                />
                {/* Canvas for preview */}
                <canvas ref={canvasRef} className={styles.previewCanvas} />
              </div>
              <p className={styles.previewHint}>
                The image will be cropped to fit a circular avatar
              </p>
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <Button
            variant="outline"
            onClick={() => {
              setSelectedFile(null);
              setPreview(null);
              if (fileInputRef.current) {
                fileInputRef.current.value = "";
              }
            }}
            disabled={!preview || isUploading}
          >
            Change Photo
          </Button>
          <Button
            onClick={handleCropAndUpload}
            disabled={!preview || isUploading}
            isLoading={isUploading}
          >
            {isUploading ? "Uploading..." : "Upload Photo"}
          </Button>
        </div>
      </div>
    </div>
  );
};

