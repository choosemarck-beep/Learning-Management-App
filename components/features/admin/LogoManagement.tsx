"use client";

import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Upload, Loader2, Eye, X } from "lucide-react";
import toast from "react-hot-toast";
import { Tooltip } from "@/components/ui/Tooltip";
import styles from "./LogoManagement.module.css";

interface LogoSettings {
  id: string;
  imageUrl: string | null;
}

export const LogoManagement: React.FC = () => {
  const [settings, setSettings] = useState<LogoSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/admin/logo");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        setSettings(data.data);
        setPreviewUrl(data.data.imageUrl);
      } else {
        setTimeout(() => {
          toast.error(data.error || "Failed to load logo settings");
        }, 0);
      }
    } catch (error) {
      console.error("Error fetching logo settings:", error);
      setTimeout(() => {
        toast.error("Failed to load logo settings");
      }, 0);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

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
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch("/api/admin/logo", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        setTimeout(() => {
          toast.success("Logo uploaded successfully");
        }, 0);
        await fetchSettings();
      } else {
        setTimeout(() => {
          toast.error(data.error || "Failed to upload logo");
        }, 0);
      }
    } catch (error) {
      console.error("Error uploading logo:", error);
      setTimeout(() => {
        toast.error("Failed to upload logo. Please try again.");
      }, 0);
    } finally {
      setIsUploading(false);
      if (event.target) {
        event.target.value = "";
      }
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to remove the logo? The text-based logo will be used instead.")) {
      return;
    }

    try {
      const response = await fetch("/api/admin/logo", {
        method: "DELETE",
      });

      const data = await response.json();
      if (data.success) {
        setTimeout(() => {
          toast.success("Logo removed successfully");
        }, 0);
        setSettings((prev) => prev ? { ...prev, imageUrl: null } : null);
        setPreviewUrl(null);
      } else {
        setTimeout(() => {
          toast.error(data.error || "Failed to remove logo");
        }, 0);
      }
    } catch (error) {
      setTimeout(() => {
        toast.error("Failed to remove logo");
      }, 0);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <Loader2 size={24} className={styles.spinner} />
        <p>Loading logo settings...</p>
      </div>
    );
  }

  return (
    <>
      <Card className={styles.sectionCard}>
        <CardHeader className={styles.cardHeaderWithPreview}>
          <div className={styles.headerContent}>
            <div className={styles.titleRow}>
              <h2 className={styles.sectionTitle}>Logo Management</h2>
              <div className={styles.headerActions}>
                <button
                  type="button"
                  onClick={() => setIsPreviewOpen(true)}
                  className={styles.previewIconButton}
                  disabled={!previewUrl}
                  title="Preview Logo"
                >
                  <Eye size={18} />
                </button>
                {previewUrl && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className={styles.deleteButton}
                    title="Delete Logo"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            </div>
            <p className={styles.sectionDescription}>
              Manage the logo displayed throughout the web app. Upload a custom image logo or use the default text-based logo.
            </p>
          </div>
        </CardHeader>
        <CardBody>
          <div className={styles.uploadSection}>
            {previewUrl && (
              <div className={styles.logoPreview}>
                <img
                  src={previewUrl}
                  alt="Current logo"
                  className={styles.logoImage}
                />
                <p className={styles.previewInfo}>
                  Current logo will be displayed throughout the app.
                </p>
              </div>
            )}
            <Tooltip
              content={
                <div>
                  <p><strong>Logo Image:</strong></p>
                  <ul>
                    <li>Format: PNG, JPG, JPEG</li>
                    <li>Max size: 5MB</li>
                    <li>Recommended: 200×200px to 400×400px (square or landscape)</li>
                    <li>Transparent background supported</li>
                    <li>Will replace the text-based "LEARNING MANAGEMENT" logo</li>
                  </ul>
                </div>
              }
              position="top"
            >
              <div style={{ display: 'inline-block', width: '100%' }}>
                <label htmlFor="logo-upload" className={styles.uploadLabel} style={{ display: 'block', cursor: 'pointer' }}>
                  <span>{previewUrl ? "Replace Logo" : "Upload Logo"}</span>
                  <input
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleUpload}
                    disabled={isUploading}
                    className={styles.fileInput}
                  />
                </label>
              </div>
            </Tooltip>
            {isUploading && (
              <div className={styles.uploadStatus}>
                <Loader2 size={14} className={styles.spinner} />
                <span>Uploading...</span>
              </div>
            )}
            {!previewUrl && (
              <p className={styles.warning}>
                No logo uploaded. The default text-based logo is currently displayed.
              </p>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Preview Modal */}
      {isPreviewOpen && previewUrl && (
        <div className={styles.previewModal} onClick={() => setIsPreviewOpen(false)}>
          <div className={styles.previewModalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.previewModalHeader}>
              <h3>Logo Preview</h3>
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className={styles.closeButton}
              >
                <X size={20} />
              </button>
            </div>
            <div className={styles.previewModalBody}>
              <img
                src={previewUrl}
                alt="Logo preview"
                className={styles.previewImage}
              />
              <p className={styles.previewDescription}>
                This is how your logo will appear throughout the app.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

