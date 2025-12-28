"use client";

import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Upload, X, Edit2, Trash2, ArrowUp, ArrowDown, Image as ImageIcon, Video as VideoIcon } from "lucide-react";
import toast from "react-hot-toast";
import styles from "./CarouselManagement.module.css";

export interface CarouselImage {
  id: string;
  imageUrl: string;
  title: string | null;
  description: string | null;
  order: number;
  isActive: boolean;
}

type CarouselMode = "PHOTO_CAROUSEL" | "VIDEO";

interface CarouselSettings {
  mode: CarouselMode;
  videoUrl: string | null;
}

export const CarouselManagement: React.FC = () => {
  const [images, setImages] = useState<CarouselImage[]>([]);
  const [settings, setSettings] = useState<CarouselSettings>({
    mode: "PHOTO_CAROUSEL",
    videoUrl: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    order: 0,
    isActive: true,
  });

  useEffect(() => {
    fetchSettings();
    fetchImages();
  }, []);

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
      const data = await response.json();

      if (data.success) {
        setImages(data.data);
      } else {
        toast.error(data.error || "Failed to load carousel images");
      }
    } catch (error) {
      toast.error("Failed to load carousel images");
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
        toast.success(`Switched to ${newMode === "PHOTO_CAROUSEL" ? "Photo Carousel" : "Video"} mode`);
      } else {
        toast.error(data.error || "Failed to update mode");
      }
    } catch (error) {
      toast.error("Failed to update mode");
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    // Check if we already have 4 images
    const activeImages = images.filter((img) => img.isActive);
    if (activeImages.length >= 4) {
      toast.error("Maximum 4 photos allowed in photo carousel mode");
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch("/api/admin/carousel", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Image uploaded successfully");
        fetchImages();
      } else {
        toast.error(data.error || "Failed to upload image");
      }
    } catch (error) {
      toast.error("Failed to upload image");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  const handleVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      toast.error("Please select a video file");
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast.error("Video size must be less than 50MB");
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
        toast.success("Video uploaded successfully");
        fetchSettings();
      } else {
        toast.error(data.error || "Failed to upload video");
      }
    } catch (error) {
      toast.error("Failed to upload video");
    } finally {
      setIsUploadingVideo(false);
      event.target.value = "";
    }
  };

  const handleEdit = (image: CarouselImage) => {
    setEditingId(image.id);
    setEditForm({
      title: image.title || "",
      description: image.description || "",
      order: image.order,
      isActive: image.isActive,
    });
  };

  const handleSaveEdit = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/carousel/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Image updated successfully");
        setEditingId(null);
        fetchImages();
      } else {
        toast.error(data.error || "Failed to update image");
      }
    } catch (error) {
      toast.error("Failed to update image");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this image?")) return;

    try {
      const response = await fetch(`/api/admin/carousel/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Image deleted successfully");
        fetchImages();
      } else {
        toast.error(data.error || "Failed to delete image");
      }
    } catch (error) {
      toast.error("Failed to delete image");
    }
  };

  const handleReorder = async (id: string, direction: "up" | "down") => {
    const image = images.find((img) => img.id === id);
    if (!image) return;

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

      fetchImages();
    } catch (error) {
      toast.error("Failed to reorder images");
    }
  };

  if (isLoading) {
    return <p>Loading carousel images...</p>;
  }

  const activeImages = images.filter((img) => img.isActive);
  const maxPhotosReached = activeImages.length >= 4;

  return (
    <div className={styles.container}>
      {/* Mode Selection */}
      <Card className={styles.modeCard}>
        <CardHeader>
          <h2>Carousel Mode</h2>
        </CardHeader>
        <CardBody>
          <div className={styles.modeSelector}>
            <button
              className={`${styles.modeButton} ${
                settings.mode === "PHOTO_CAROUSEL" ? styles.active : ""
              }`}
              onClick={() => handleModeChange("PHOTO_CAROUSEL")}
            >
              <ImageIcon size={24} />
              <span>Photo Carousel</span>
              <small>(Up to 4 photos)</small>
            </button>
            <button
              className={`${styles.modeButton} ${
                settings.mode === "VIDEO" ? styles.active : ""
              }`}
              onClick={() => handleModeChange("VIDEO")}
            >
              <VideoIcon size={24} />
              <span>Video</span>
              <small>(1 looping video)</small>
            </button>
          </div>
        </CardBody>
      </Card>

      {/* Photo Carousel Mode */}
      {settings.mode === "PHOTO_CAROUSEL" && (
        <>
          <Card className={styles.uploadCard}>
            <CardHeader>
              <h2>Upload Photo ({activeImages.length}/4)</h2>
            </CardHeader>
            <CardBody>
              <label htmlFor="carousel-upload" className={styles.uploadLabel}>
                <Upload size={24} />
                <span>Choose Image</span>
                <input
                  id="carousel-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={isUploading || maxPhotosReached}
                  className={styles.fileInput}
                />
              </label>
              {isUploading && <p>Uploading...</p>}
              {maxPhotosReached && (
                <p className={styles.warning}>
                  Maximum 4 photos reached. Delete one to upload another.
                </p>
              )}
            </CardBody>
          </Card>

          <div className={styles.imagesList}>
            {images.map((image) => (
              <Card key={image.id} className={styles.imageCard}>
                <CardBody>
                  <div className={styles.imageContainer}>
                    <img
                      src={image.imageUrl}
                      alt={image.title || "Carousel image"}
                      className={styles.image}
                    />
                    <div className={styles.imageActions}>
                      <button
                        onClick={() => handleReorder(image.id, "up")}
                        disabled={image.order === 0}
                        className={styles.actionButton}
                      >
                        <ArrowUp size={16} />
                      </button>
                      <button
                        onClick={() => handleReorder(image.id, "down")}
                        disabled={image.order === images.length - 1}
                        className={styles.actionButton}
                      >
                        <ArrowDown size={16} />
                      </button>
                      <button
                        onClick={() => handleEdit(image)}
                        className={styles.actionButton}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(image.id)}
                        className={styles.actionButton}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {editingId === image.id ? (
                    <div className={styles.editForm}>
                      <Input
                        label="Title"
                        value={editForm.title}
                        onChange={(e) =>
                          setEditForm({ ...editForm, title: e.target.value })
                        }
                        placeholder="Optional title"
                      />
                      <Input
                        label="Description"
                        value={editForm.description}
                        onChange={(e) =>
                          setEditForm({ ...editForm, description: e.target.value })
                        }
                        placeholder="Optional description"
                      />
                      <div className={styles.formActions}>
                        <Button
                          onClick={() => handleSaveEdit(image.id)}
                          variant="primary"
                        >
                          Save
                        </Button>
                        <Button
                          onClick={() => setEditingId(null)}
                          variant="outline"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className={styles.imageInfo}>
                      {image.title && <h3>{image.title}</h3>}
                      {image.description && <p>{image.description}</p>}
                      <p className={styles.imageMeta}>
                        Order: {image.order} •{" "}
                        {image.isActive ? "Active" : "Inactive"}
                      </p>
                    </div>
                  )}
                </CardBody>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Video Mode */}
      {settings.mode === "VIDEO" && (
        <Card className={styles.uploadCard}>
          <CardHeader>
            <h2>Upload Video</h2>
          </CardHeader>
          <CardBody>
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
            <label htmlFor="carousel-video-upload" className={styles.uploadLabel}>
              <Upload size={24} />
              <span>{settings.videoUrl ? "Replace Video" : "Choose Video"}</span>
              <input
                id="carousel-video-upload"
                type="file"
                accept="video/*"
                onChange={handleVideoUpload}
                disabled={isUploadingVideo}
                className={styles.fileInput}
              />
            </label>
            {isUploadingVideo && <p>Uploading...</p>}
            {!settings.videoUrl && (
              <p className={styles.warning}>
                No video uploaded. Upload a video to display it on the dashboard.
              </p>
            )}
          </CardBody>
        </Card>
      )}
    </div>
  );
};
