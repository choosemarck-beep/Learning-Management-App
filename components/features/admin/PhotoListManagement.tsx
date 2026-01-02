"use client";

import React, { useState, useRef } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Upload,
  X,
  Edit2,
  Trash2,
  ArrowUp,
  ArrowDown,
  Loader2,
  ExternalLink,
} from "lucide-react";
import toast from "react-hot-toast";
import styles from "./PhotoListManagement.module.css";

export interface CarouselImage {
  id: string;
  imageUrl: string;
  title: string | null;
  description: string | null;
  redirectUrl: string | null;
  order: number;
  isActive: boolean;
}

interface PhotoListManagementProps {
  isOpen: boolean;
  onClose: () => void;
  images: CarouselImage[];
  onUpload: (file: File, order: number, redirectUrl?: string) => Promise<void>;
  onEdit: (id: string, title: string, description: string, redirectUrl: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onReorder: (id: string, direction: "up" | "down") => Promise<void>;
  onSave: () => Promise<void>;
  isUploading?: boolean;
  isSaving?: boolean;
}

export const PhotoListManagement: React.FC<PhotoListManagementProps> = ({
  isOpen,
  onClose,
  images,
  onUpload,
  onEdit,
  onDelete,
  onReorder,
  onSave,
  isUploading = false,
  isSaving = false,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    redirectUrl: "",
  });
  const [uploadRedirectUrls, setUploadRedirectUrls] = useState<Record<number, string>>({});
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Get all images sorted by order (active and inactive)
  const allImages = [...images].sort((a, b) => a.order - b.order);
  
  // Get active images only for reorder logic
  const activeImages = images.filter((img) => img.isActive).sort((a, b) => a.order - b.order);
  const maxOrder = activeImages.length > 0 ? Math.max(...activeImages.map(img => img.order)) : 0;
  
  // Create 4 slots (0-3) with images mapped to their order
  // Show active images first, then inactive images, then empty slots
  const slots = Array.from({ length: 4 }, (_, index) => {
    // First try to find an active image at this order
    let image = images.find((img) => img.order === index && img.isActive);
    // If no active image, find any image at this order
    if (!image) {
      image = images.find((img) => img.order === index);
    }
    // If still no image, try to find an inactive image that can fill this slot
    if (!image && index < allImages.length) {
      image = allImages[index];
    }
    return {
      index,
      image: image || null,
    };
  });

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>, slotIndex: number) => {
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

    // Validate redirect URL if provided
    const redirectUrl = uploadRedirectUrls[slotIndex] || "";
    if (redirectUrl && redirectUrl.trim() !== '') {
      try {
        new URL(redirectUrl);
      } catch {
        toast.error("Please enter a valid URL (e.g., https://example.com)");
        return;
      }
    }

    try {
      await onUpload(file, slotIndex, redirectUrl.trim() || "");
      toast.success("Photo uploaded");
      // Reset input and redirect URL
      if (fileInputRefs.current[slotIndex]) {
        fileInputRefs.current[slotIndex]!.value = "";
      }
      setUploadRedirectUrls((prev) => {
        const newUrls = { ...prev };
        delete newUrls[slotIndex];
        return newUrls;
      });
    } catch (error) {
      toast.error("Failed to upload photo");
    }
  };

  const handleEditClick = (image: CarouselImage) => {
    setEditingId(image.id);
    setEditForm({
      title: image.title || "",
      description: image.description || "",
      redirectUrl: image.redirectUrl || "",
    });
  };

  const handleSaveEdit = async (id: string) => {
    // Validate URL if provided
    if (editForm.redirectUrl && editForm.redirectUrl.trim() !== '') {
      try {
        new URL(editForm.redirectUrl);
      } catch {
        toast.error("Please enter a valid URL (e.g., https://example.com)");
        return;
      }
    }
    
    try {
      await onEdit(id, editForm.title, editForm.description, editForm.redirectUrl);
      toast.success("Photo updated");
      setEditingId(null);
    } catch (error) {
      toast.error("Failed to update photo");
    }
  };

  const handleReorder = async (id: string, direction: "up" | "down") => {
    try {
      await onReorder(id, direction);
      toast.success(`Photo moved ${direction}`);
    } catch (error) {
      toast.error("Failed to reorder photo");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this photo?")) return;

    try {
      await onDelete(id);
      toast.success("Photo deleted");
    } catch (error) {
      toast.error("Failed to delete photo");
    }
  };

  const handleSave = async () => {
    try {
      await onSave();
      toast.success("Carousel photos saved successfully");
      onClose();
    } catch (error) {
      toast.error("Failed to save photos");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Manage Carousel Photos"
      showCloseButton={true}
      className={styles.modal}
    >
      <div className={styles.modalContent}>
        <div className={styles.photoList}>
          {slots.map((slot, idx) => (
            <div key={slot.index} className={styles.photoItem}>
              <div className={styles.photoHeader}>
                <span className={styles.photoNumber}>Photo {slot.index + 1}</span>
                {slot.image && (
                  <div className={styles.photoActions}>
                    <button
                      onClick={() => {
                        if (slot.image) {
                          handleReorder(slot.image.id, "up");
                        }
                      }}
                      disabled={!slot.image || slot.image.order === 0 || !slot.image.isActive}
                      className={styles.actionButton}
                      title="Move up"
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      onClick={() => {
                        if (slot.image) {
                          handleReorder(slot.image.id, "down");
                        }
                      }}
                      disabled={!slot.image || slot.image.order >= maxOrder || !slot.image.isActive}
                      className={styles.actionButton}
                      title="Move down"
                    >
                      <ArrowDown size={14} />
                    </button>
                    <button
                      onClick={() => {
                        if (slot.image) {
                          handleEditClick(slot.image);
                        }
                      }}
                      className={styles.actionButton}
                      title="Edit"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => {
                        if (slot.image) {
                          handleDelete(slot.image.id);
                        }
                      }}
                      className={styles.actionButton}
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>

              {slot.image ? (
                <div className={styles.photoContent}>
                  {editingId === slot.image.id ? (
                    <div className={styles.editForm}>
                      <div className={styles.inputRow}>
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
                      </div>
                      <div className={styles.inputRowWithActions}>
                        <Input
                          label="Redirect URL"
                          type="url"
                          value={editForm.redirectUrl}
                          onChange={(e) =>
                            setEditForm({ ...editForm, redirectUrl: e.target.value })
                          }
                          placeholder="https://example.com (optional)"
                        />
                        <div className={styles.formActions}>
                          <Button
                            onClick={() => handleSaveEdit(slot.image!.id)}
                            variant="primary"
                            size="sm"
                          >
                            Save
                          </Button>
                          <Button
                            onClick={() => setEditingId(null)}
                            variant="outline"
                            size="sm"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className={styles.photoInfo}>
                      <div className={styles.infoRow}>
                        {slot.image.title && (
                          <span className={styles.photoTitle}>{slot.image.title}</span>
                        )}
                        {slot.image.description && (
                          <span className={styles.photoDescription}>{slot.image.description}</span>
                        )}
                        {slot.image.redirectUrl && (
                          <span className={styles.photoUrl} title={slot.image.redirectUrl}>
                            <ExternalLink size={12} className={styles.urlIcon} />
                            {slot.image.redirectUrl}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className={styles.emptySlot}>
                  <div className={styles.inputRow}>
                    <Input
                      label="Redirect URL (Optional)"
                      type="url"
                      value={uploadRedirectUrls[slot.index] || ""}
                      onChange={(e) =>
                        setUploadRedirectUrls((prev) => ({
                          ...prev,
                          [slot.index]: e.target.value,
                        }))
                      }
                      placeholder="https://example.com"
                      disabled={isUploading}
                    />
                    <input
                      id={`photo-upload-${idx}`}
                      name={`photoUpload-${idx}`}
                      ref={(el) => { fileInputRefs.current[idx] = el; }}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, idx)}
                      className={styles.fileInput}
                      disabled={isUploading}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRefs.current[idx]?.click()}
                      disabled={isUploading}
                      className={styles.uploadButton}
                    >
                      {isUploading ? (
                        <>
                          <Loader2 size={16} className={styles.spinner} />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Upload size={16} />
                          <span>Upload Photo</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className={styles.modalActions}>
          <Button
            variant="outline"
            size="lg"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="lg"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 size={16} className={styles.spinner} />
                <span>Saving...</span>
              </>
            ) : (
              "Save"
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

