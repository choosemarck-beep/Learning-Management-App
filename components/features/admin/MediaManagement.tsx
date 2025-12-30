"use client";

import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { CarouselHeader } from "@/components/features/dashboard/CarouselHeader";
import {
  Upload,
  X,
  Image as ImageIcon,
  Video as VideoIcon,
  Loader2,
  Eye,
  Save,
} from "lucide-react";
import toast from "react-hot-toast";
import { Tooltip } from "@/components/ui/Tooltip";
import { PhotoListManagement } from "./PhotoListManagement";
import { CarouselPreviewModal } from "./CarouselPreviewModal";
import { SplashScreenPreviewModal } from "./SplashScreenPreviewModal";
import { LogoManagement } from "./LogoManagement";
import { ThemeManagement } from "./ThemeManagement";
import styles from "./MediaManagement.module.css";

export interface CarouselImage {
  id: string;
  imageUrl: string;
  title: string | null;
  description: string | null;
  redirectUrl: string | null;
  order: number;
  isActive: boolean;
  createdAt?: string | Date;
}

type CarouselMode = "PHOTO_CAROUSEL" | "VIDEO";

interface CarouselSettings {
  mode: CarouselMode;
  videoUrl: string | null;
}

interface SplashScreenSettings {
  id: string;
  imageUrl: string | null;
}

export const MediaManagement: React.FC = () => {
  // Carousel state
  const [images, setImages] = useState<CarouselImage[]>([]);
  const [settings, setSettings] = useState<CarouselSettings>({
    mode: "PHOTO_CAROUSEL",
    videoUrl: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isCarouselPreviewOpen, setIsCarouselPreviewOpen] = useState(false);
  const [isSplashPreviewOpen, setIsSplashPreviewOpen] = useState(false);
  const [isSavingPhotos, setIsSavingPhotos] = useState(false);

  // Splash screen state
  const [splashSettings, setSplashSettings] = useState<SplashScreenSettings | null>(null);
  const [isUploadingSplash, setIsUploadingSplash] = useState(false);
  const [splashPreviewUrl, setSplashPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
    fetchImages();
    fetchSplashSettings();
  }, []);

  // Carousel functions
  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/admin/carousel/settings");
      const data = await response.json();
      if (data.success) {
        setSettings(data.data);
      }
    } catch (error) {
      console.error("Error fetching carousel settings:", error);
    }
  };

  const fetchImages = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/admin/carousel");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        setImages(data.data);
      } else {
        // Use setTimeout to avoid setState during render
        setTimeout(() => {
          toast.error(data.error || "Failed to load carousel images");
        }, 0);
      }
    } catch (error) {
      console.error("Error fetching carousel images:", error);
      // Use setTimeout to avoid setState during render
      setTimeout(() => {
        toast.error("Failed to load carousel images");
      }, 0);
    } finally {
      setIsLoading(false);
    }
  };

  const handleModeChange = async (newMode: CarouselMode) => {
    try {
      const response = await fetch("/api/admin/carousel/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: newMode }),
      });
      const data = await response.json();
      if (data.success) {
        setSettings(data.data);
        setTimeout(() => {
          toast.success(`Switched to ${newMode === "PHOTO_CAROUSEL" ? "Photo Carousel" : "Video"} mode`);
        }, 0);
      } else {
        setTimeout(() => {
          toast.error(data.error || "Failed to update mode");
        }, 0);
      }
    } catch (error) {
      setTimeout(() => {
        toast.error("Failed to update mode");
      }, 0);
    }
  };

  const handleFileUpload = async (file: File, order: number, redirectUrl?: string) => {
    // Validation checks - return early with toast, don't throw
    if (!file.type.startsWith("image/")) {
      setTimeout(() => {
        toast.error("Please select an image file");
      }, 0);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setTimeout(() => {
        toast.error("Image size must be less than 5MB");
      }, 0);
      return;
    }

    try {
      setIsUploading(true);
      
      // Deactivate any existing photo at this order (replacement)
      const existingPhotoAtOrder = images.find((img) => img.order === order);
      if (existingPhotoAtOrder) {
        // Deactivate the old photo at this order
        await fetch(`/api/admin/carousel/${existingPhotoAtOrder.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: false }),
        });
      }

      // Upload new photo as inactive (will be activated on Save)
      const formData = new FormData();
      formData.append("image", file);
      formData.append("order", order.toString());
      formData.append("isActive", "false"); // Upload as inactive, will be activated on Save
      if (redirectUrl && redirectUrl.trim() !== '') {
        formData.append("redirectUrl", redirectUrl.trim());
      }

      const response = await fetch("/api/admin/carousel", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        await fetchImages(); // Refresh to show new photo
        setTimeout(() => {
          toast.success("Photo uploaded successfully. Click 'Save' to deploy to employee dashboards.");
        }, 0);
      } else {
        setTimeout(() => {
          toast.error(data.error || "Failed to upload image");
        }, 0);
      }
    } catch (error) {
      console.error("Upload error:", error);
      setTimeout(() => {
        toast.error("Failed to upload image. Please try again.");
      }, 0);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSavePhotos = async () => {
    try {
      setIsSavingPhotos(true);
      
      // Get all images and group by order, then get the most recent one at each order
      // The API returns images sorted by order ASC, then createdAt DESC
      // So the first image at each order is the most recent
      const imagesByOrder = new Map<number, CarouselImage>();
      
      // Process images in the order they come from API (already sorted correctly)
      images.forEach((img) => {
        // Only keep the first (most recent) image at each order
        if (!imagesByOrder.has(img.order)) {
          imagesByOrder.set(img.order, img);
        }
      });
      
      // Convert to array and sort by order, take first 4 (orders 0, 1, 2, 3)
      const allImages = Array.from(imagesByOrder.values())
        .sort((a, b) => a.order - b.order)
        .slice(0, 4);
      
      if (allImages.length === 0) {
        setTimeout(() => {
          toast.error("No photos to save. Please upload photos first.");
        }, 0);
        return;
      }
      
      // Deactivate all current active images
      const deactivatePromises = images
        .filter(img => img.isActive)
        .map(img => 
          fetch(`/api/admin/carousel/${img.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isActive: false }),
          })
        );
      
      await Promise.all(deactivatePromises);
      
      // Activate images in order (up to 4), ensuring correct order assignment
      const activatePromises = allImages.map((img, index) =>
        fetch(`/api/admin/carousel/${img.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            isActive: true,
            order: index // Ensure order is 0, 1, 2, 3
          }),
        })
      );
      
      await Promise.all(activatePromises);
      
      // Refresh images to show updated state
      await fetchImages();
      
      setTimeout(() => {
        toast.success(`Carousel saved! ${allImages.length} photo(s) are now live on employee dashboards.`);
      }, 0);
    } catch (error) {
      console.error("Error saving photos:", error);
      setTimeout(() => {
        toast.error("Failed to save carousel. Please try again.");
      }, 0);
    } finally {
      setIsSavingPhotos(false);
    }
  };

  const handleVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      setTimeout(() => {
        toast.error("Please select a video file");
      }, 0);
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setTimeout(() => {
        toast.error("Video size must be less than 50MB");
      }, 0);
      return;
    }

    try {
      setIsUploadingVideo(true);
      const formData = new FormData();
      formData.append("video", file);

      const response = await fetch("/api/admin/carousel/video", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        setTimeout(() => {
          toast.success("Video uploaded successfully");
        }, 0);
        fetchSettings();
      } else {
        setTimeout(() => {
          toast.error(data.error || "Failed to upload video");
        }, 0);
      }
    } catch (error) {
      setTimeout(() => {
        toast.error("Failed to upload video");
      }, 0);
    } finally {
      setIsUploadingVideo(false);
      event.target.value = "";
    }
  };

  const handleEdit = async (id: string, title: string, description: string, redirectUrl: string) => {
    try {
      const response = await fetch(`/api/admin/carousel/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, redirectUrl: redirectUrl.trim() || null }),
      });

      const data = await response.json();
      if (data.success) {
        await fetchImages();
      } else {
        setTimeout(() => {
          toast.error(data.error || "Failed to update image");
        }, 0);
        throw new Error(data.error || "Update failed");
      }
    } catch (error) {
      if (error instanceof Error && error.message !== "Update failed") {
        setTimeout(() => {
          toast.error("Failed to update image");
        }, 0);
      }
      throw error;
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/carousel/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();
      if (data.success) {
        await fetchImages();
      } else {
        setTimeout(() => {
          toast.error(data.error || "Failed to delete image");
        }, 0);
        throw new Error(data.error || "Delete failed");
      }
    } catch (error) {
      if (error instanceof Error && error.message !== "Delete failed") {
        setTimeout(() => {
          toast.error("Failed to delete image");
        }, 0);
      }
      throw error;
    }
  };

  const handleReorder = async (id: string, direction: "up" | "down") => {
    const image = images.find((img) => img.id === id);
    if (!image) {
      throw new Error("Image not found");
    }

    const newOrder = direction === "up" ? image.order - 1 : image.order + 1;
    const swapImage = images.find((img) => img.order === newOrder);

    try {
      await Promise.all([
        fetch(`/api/admin/carousel/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order: newOrder }),
        }),
        swapImage &&
          fetch(`/api/admin/carousel/${swapImage.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ order: image.order }),
          }),
      ]);

      await fetchImages();
    } catch (error) {
      setTimeout(() => {
        toast.error("Failed to reorder images");
      }, 0);
      throw error;
    }
  };

  // Splash screen functions
  const fetchSplashSettings = async () => {
    try {
      const response = await fetch("/api/admin/splash-screen");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        setSplashSettings(data.data);
        setSplashPreviewUrl(data.data.imageUrl);
      } else {
        console.error("Failed to fetch splash screen settings:", data.error);
      }
    } catch (error) {
      console.error("Error fetching splash screen settings:", error);
    }
  };

  const handleSplashUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      console.log("No file selected");
      return;
    }

    console.log("File selected:", file.name, file.type, file.size);

    if (!file.type.startsWith("image/")) {
      setTimeout(() => {
        toast.error("Please select an image file");
      }, 0);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setTimeout(() => {
        toast.error("Image size must be less than 10MB");
      }, 0);
      return;
    }

    try {
      setIsUploadingSplash(true);
      const formData = new FormData();
      formData.append("image", file);

      console.log("Uploading splash screen image...");

      const response = await fetch("/api/admin/splash-screen", {
        method: "POST",
        body: formData,
      });

      console.log("Response status:", response.status);

      const data = await response.json();
      console.log("Response data:", data);

      if (data.success) {
        setTimeout(() => {
          toast.success("Splash screen image uploaded successfully");
        }, 0);
        await fetchSplashSettings(); // Refresh settings
      } else {
        setTimeout(() => {
          toast.error(data.error || "Failed to upload image");
        }, 0);
        console.error("Upload failed:", data.error);
      }
    } catch (error) {
      console.error("Error uploading splash screen:", error);
      setTimeout(() => {
        toast.error("Failed to upload image. Please check the console for details.");
      }, 0);
    } finally {
      setIsUploadingSplash(false);
      if (event.target) {
        event.target.value = "";
      }
    }
  };

  const handleSplashDelete = async () => {
    if (!confirm("Are you sure you want to remove the splash screen image?")) return;

    try {
      const response = await fetch("/api/admin/splash-screen", {
        method: "DELETE",
      });

      const data = await response.json();
      if (data.success) {
        setTimeout(() => {
          toast.success("Splash screen image removed");
        }, 0);
        setSplashSettings((prev) => prev ? { ...prev, imageUrl: null } : null);
        setSplashPreviewUrl(null);
      } else {
        setTimeout(() => {
          toast.error(data.error || "Failed to remove image");
        }, 0);
      }
    } catch (error) {
      setTimeout(() => {
        toast.error("Failed to remove image");
      }, 0);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <Loader2 size={24} className={styles.spinner} />
        <p>Loading media settings...</p>
      </div>
    );
  }

  const activeImages = images.filter((img) => img.isActive);
  const maxPhotosReached = activeImages.length >= 4;

  // Prepare carousel images for preview (all images, in order - shows what's uploaded)
  // Preview should show all images (active and inactive) so users can see what they uploaded
  // Group by order and take the most recent image at each order (first 4 orders)
  const imagesByOrder = new Map<number, typeof images[0]>();
  images
    .filter((img) => img.order < 4) // Only first 4 orders
    .sort((a, b) => {
      // Sort by order first, then by createdAt DESC (most recent first)
      if (a.order !== b.order) return a.order - b.order;
      const aTime = a.createdAt ? (typeof a.createdAt === 'string' ? new Date(a.createdAt).getTime() : (a.createdAt as Date).getTime()) : 0;
      const bTime = b.createdAt ? (typeof b.createdAt === 'string' ? new Date(b.createdAt).getTime() : (b.createdAt as Date).getTime()) : 0;
      return bTime - aTime;
    })
    .forEach((img) => {
      // Only keep the first (most recent) image at each order
      if (!imagesByOrder.has(img.order)) {
        imagesByOrder.set(img.order, img);
      }
    });

  const previewImages = Array.from(imagesByOrder.values())
    .sort((a, b) => a.order - b.order)
    .map((img) => ({
      id: img.id,
      imageUrl: img.imageUrl,
      title: img.title,
      description: img.description,
    }));

  return (
    <div className={styles.container}>
      <div className={styles.fourColumnLayout}>
        {/* Carousel Section */}
        <Card className={styles.sectionCard}>
          <CardHeader className={styles.cardHeaderWithPreview}>
            <div className={styles.headerContent}>
              <div className={styles.titleRow}>
                <h2 className={styles.sectionTitle}>Carousel Management</h2>
                <div className={styles.headerActions}>
                  <button
                    type="button"
                    onClick={() => setIsCarouselPreviewOpen(true)}
                    className={styles.previewIconButton}
                    disabled={!((settings.mode === "VIDEO" && settings.videoUrl) || (settings.mode === "PHOTO_CAROUSEL" && images.length > 0))}
                    title="Preview Carousel"
                  >
                    <Eye size={18} />
                  </button>
                  {settings.mode === "PHOTO_CAROUSEL" && (
                    <button
                      type="button"
                      onClick={handleSavePhotos}
                      className={styles.saveButton}
                      disabled={isSavingPhotos}
                      title="Save Photos"
                    >
                      {isSavingPhotos ? (
                        <Loader2 size={18} className={styles.spinner} />
                      ) : (
                        <Save size={18} />
                      )}
                    </button>
                  )}
                </div>
              </div>
              <p className={styles.sectionDescription}>
                Manage the carousel banner displayed on employee dashboards.
              </p>
            </div>
          </CardHeader>
          <CardBody>

          {/* Photo Carousel Mode */}
          {settings.mode === "PHOTO_CAROUSEL" && (
            <>
              <div className={styles.photoUploadGrid}>
                {[0, 1, 2, 3].map((slotIndex) => {
                  // Check for image at this order (active or inactive)
                  const slotImage = images.find((img) => img.order === slotIndex);
                  const hasImage = !!slotImage;
                  
                  return (
                    <div key={slotIndex} className={styles.photoUploadSlot}>
                      <Tooltip
                        content={
                          <div>
                            <p><strong>Carousel Images:</strong></p>
                            <ul>
                              <li>Format: PNG, JPG, JPEG</li>
                              <li>Max size: 5MB per image</li>
                              <li>Resolution: Recommended 1920×1080 (16:9 landscape)</li>
                              <li>Orientation: Landscape (horizontal)</li>
                              <li>Maximum: 4 active images</li>
                            </ul>
                          </div>
                        }
                        position="top"
                      >
                        <div style={{ width: '100%' }}>
                          <label
                            htmlFor={`carousel-upload-${slotIndex}`}
                            className={`${styles.photoUploadButton} ${hasImage ? styles.hasImage : ''}`}
                            style={{ display: 'block', cursor: 'pointer' }}
                          >
                            <span>Photo {slotIndex + 1}</span>
                            <input
                              id={`carousel-upload-${slotIndex}`}
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handleFileUpload(file, slotIndex);
                                }
                                e.target.value = "";
                              }}
                              disabled={isUploading}
                              className={styles.fileInput}
                            />
                          </label>
                        </div>
                      </Tooltip>
                    </div>
                  );
                })}
              </div>
              {isUploading && (
                <div className={styles.uploadStatus}>
                  <Loader2 size={14} className={styles.spinner} />
                  <span>Uploading...</span>
                </div>
              )}
              <div className={styles.fileRequirements}>
                <p className={styles.fileRequirementsTitle}>File Requirements:</p>
                <ul className={styles.fileRequirementsList}>
                  <li>Format: PNG, JPG, JPEG</li>
                  <li>Max size: 5MB per image</li>
                  <li>Resolution: Recommended 1920×1080 (16:9 landscape)</li>
                  <li>Orientation: Landscape (horizontal)</li>
                  <li>Maximum: 4 active images</li>
                </ul>
              </div>
            </>
          )}

          {/* Video Mode */}
          {settings.mode === "VIDEO" && (
            <div className={styles.uploadSection}>
              {settings.videoUrl && (
                <div className={styles.videoPreview}>
                  <video
                    src={settings.videoUrl}
                    controls
                    className={styles.videoPlayer}
                  >
                    Your browser does not support the video tag.
                  </video>
                  <p className={styles.videoInfo}>
                    Current video will loop automatically on the dashboard.
                  </p>
                </div>
              )}
              <Tooltip
                content={
                  <div>
                    <p><strong>Carousel Video:</strong></p>
                    <ul>
                      <li>Format: MP4, WebM, MOV</li>
                      <li>Max size: 50MB</li>
                      <li>Resolution: Recommended 1920×1080 (16:9 landscape)</li>
                      <li>Orientation: Landscape (horizontal)</li>
                      <li>Duration: Recommended 10-30 seconds (will loop)</li>
                    </ul>
                  </div>
                }
                position="top"
              >
                <div style={{ display: 'inline-block', width: '100%' }}>
                  <label htmlFor="carousel-video-upload" className={styles.uploadLabel} style={{ display: 'block', cursor: 'pointer' }}>
                    <Upload size={16} />
                    <span>{settings.videoUrl ? "Replace Video" : "Upload Video"}</span>
                    <input
                      id="carousel-video-upload"
                      type="file"
                      accept="video/*"
                      onChange={handleVideoUpload}
                      disabled={isUploadingVideo}
                      className={styles.fileInput}
                    />
                  </label>
                </div>
              </Tooltip>
              {isUploadingVideo && (
                <div className={styles.uploadStatus}>
                  <Loader2 size={14} className={styles.spinner} />
                  <span>Uploading...</span>
                </div>
              )}
              {!settings.videoUrl && (
                <p className={styles.warning}>
                  No video uploaded. Upload a video to display it on the dashboard.
                </p>
              )}
            </div>
          )}
        </CardBody>
      </Card>

        {/* Splash Screen Section */}
        <Card className={styles.sectionCard}>
        <CardHeader className={styles.cardHeaderWithPreview}>
          <div className={styles.headerContent}>
            <div className={styles.titleRow}>
              <h2 className={styles.sectionTitle}>Splash Screen Management</h2>
              <div className={styles.headerActions}>
                <button
                  type="button"
                  onClick={() => setIsSplashPreviewOpen(true)}
                  className={styles.previewIconButton}
                  disabled={!splashPreviewUrl}
                  title="Preview Splash Screen"
                >
                  <Eye size={18} />
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    // Splash screen saves automatically on upload, but we can add a refresh here
                    await fetchSplashSettings();
                    setTimeout(() => {
                      toast.success("Splash screen settings saved");
                    }, 0);
                  }}
                  className={styles.saveButton}
                  disabled={!splashPreviewUrl}
                  title="Save Splash Screen"
                >
                  <Save size={18} />
                </button>
              </div>
            </div>
            <p className={styles.sectionDescription}>
              Manage the splash screen background image displayed when users first open the app.
            </p>
          </div>
        </CardHeader>
        <CardBody>

          <div className={styles.uploadSection}>
            <Tooltip
              content={
                <div>
                  <p><strong>Splash Screen Image:</strong></p>
                  <ul>
                    <li>Format: PNG, JPG, JPEG</li>
                    <li>Max size: 10MB</li>
                    <li>Resolution: Recommended 428×926 (9:19.5 portrait) or larger</li>
                    <li>Orientation: Portrait (vertical)</li>
                    <li>Optimized for mobile devices (320px-428px width)</li>
                  </ul>
                </div>
              }
              position="top"
            >
              <div style={{ display: 'block', width: '100%' }}>
                <label htmlFor="splash-upload" className={styles.uploadLabel} style={{ display: 'block', cursor: 'pointer' }}>
                  <span>Upload Image</span>
                  <input
                    id="splash-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleSplashUpload}
                    disabled={isUploadingSplash}
                    className={styles.fileInput}
                  />
                </label>
              </div>
            </Tooltip>
            {isUploadingSplash && (
              <div className={styles.uploadStatus}>
                <Loader2 size={14} className={styles.spinner} />
                <span>Uploading...</span>
              </div>
            )}
            <div className={styles.fileRequirements}>
              <p className={styles.fileRequirementsTitle}>File Requirements:</p>
              <ul className={styles.fileRequirementsList}>
                <li>Format: PNG, JPG, JPEG</li>
                <li>Max size: 10MB</li>
                <li>Resolution: Recommended 428×926 (9:19.5 portrait) or larger</li>
                <li>Orientation: Portrait (vertical)</li>
                <li>Optimized for mobile devices (320px-428px width)</li>
              </ul>
            </div>
          </div>
        </CardBody>
      </Card>

        {/* Logo Management Section */}
        <LogoManagement />

        {/* Theme Management Section */}
        <ThemeManagement />
      </div>

      {/* Photo List Management Modal */}
      <PhotoListManagement
        isOpen={isPhotoModalOpen}
        onClose={() => {
          setIsPhotoModalOpen(false);
          fetchImages();
        }}
        images={images}
        onUpload={handleFileUpload}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onReorder={handleReorder}
        onSave={handleSavePhotos}
        isUploading={isUploading}
        isSaving={isSavingPhotos}
      />

      {/* Carousel Preview Modal */}
      <CarouselPreviewModal
        isOpen={isCarouselPreviewOpen}
        onClose={() => setIsCarouselPreviewOpen(false)}
        mode={settings.mode}
        images={previewImages}
        videoUrl={settings.videoUrl}
      />

      {/* Splash Screen Preview Modal */}
      <SplashScreenPreviewModal
        isOpen={isSplashPreviewOpen}
        onClose={() => setIsSplashPreviewOpen(false)}
        imageUrl={splashPreviewUrl}
      />
    </div>
  );
};

