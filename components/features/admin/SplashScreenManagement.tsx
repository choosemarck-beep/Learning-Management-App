"use client";

import React, { useState, useEffect } from "react";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import toast from "react-hot-toast";
import styles from "./SplashScreenManagement.module.css";

interface SplashScreenSettings {
  id: string;
  imageUrl: string | null;
}

export const SplashScreenManagement: React.FC = () => {
  const [settings, setSettings] = useState<SplashScreenSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/admin/splash-screen");
      const data = await response.json();

      if (data.success) {
        setSettings(data.data);
        setPreviewUrl(data.data.imageUrl);
      } else {
        toast.error(data.error || "Failed to load splash screen settings");
      }
    } catch (error) {
      console.error("Error fetching splash screen settings:", error);
      toast.error("Failed to load splash screen settings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image size must be less than 10MB");
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch("/api/admin/splash-screen", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Splash screen image uploaded successfully");
        setSettings(data.data);
        setPreviewUrl(data.data.imageUrl);
      } else {
        toast.error(data.error || "Failed to upload image");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to remove the splash screen image? This will reset it to the default.")) {
      return;
    }

    try {
      const response = await fetch("/api/admin/splash-screen", {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Splash screen image removed");
        setSettings((prev) => prev ? { ...prev, imageUrl: null } : null);
        setPreviewUrl(null);
      } else {
        toast.error(data.error || "Failed to remove image");
      }
    } catch (error) {
      console.error("Error deleting image:", error);
      toast.error("Failed to remove image");
    }
  };

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <Loader2 size={24} className={styles.spinner} />
        <p>Loading splash screen settings...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Current Splash Screen</h2>
        <p className={styles.sectionDescription}>
          The splash screen is displayed when users first open the app. Upload a high-quality image optimized for mobile devices (recommended: 428px × 926px or larger).
        </p>

        {previewUrl ? (
          <div className={styles.previewContainer}>
            <div className={styles.previewImageWrapper}>
              <img
                src={previewUrl}
                alt="Splash screen preview"
                className={styles.previewImage}
              />
              <button
                onClick={handleDelete}
                className={styles.deleteButton}
                title="Remove image"
              >
                <X size={20} />
              </button>
            </div>
            <p className={styles.previewText}>Current splash screen image</p>
          </div>
        ) : (
          <div className={styles.noImageContainer}>
            <ImageIcon size={48} className={styles.noImageIcon} />
            <p className={styles.noImageText}>No splash screen image set</p>
            <p className={styles.noImageSubtext}>
              Upload an image to customize the splash screen background
            </p>
          </div>
        )}
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Upload New Image</h2>
        <div className={styles.uploadSection}>
          <input
            type="file"
            id="splash-upload"
            accept="image/*"
            onChange={handleFileUpload}
            className={styles.fileInput}
            disabled={isUploading}
          />
          <label htmlFor="splash-upload" className={styles.uploadLabel}>
            <Button
              variant="primary"
              size="lg"
              disabled={isUploading}
              className={styles.uploadButton}
            >
              {isUploading ? (
                <>
                  <Loader2 size={18} className={styles.spinner} />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload size={18} />
                  Choose Image
                </>
              )}
            </Button>
          </label>
          <p className={styles.uploadHint}>
            Supported formats: PNG, JPG, JPEG. Max size: 10MB
          </p>
        </div>
      </div>
    </div>
  );
};

