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
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import styles from "./PhotoManagementModal.module.css";

export interface CarouselImage {
  id: string;
  imageUrl: string;
  title: string | null;
  description: string | null;
  order: number;
  isActive: boolean;
}

interface PhotoManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: CarouselImage[];
  onUpload: (file: File) => Promise<void>;
  onEdit: (id: string, title: string, description: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onReorder: (id: string, direction: "up" | "down") => Promise<void>;
  isUploading?: boolean;
}

interface PhotoSlot {
  index: number;
  image: CarouselImage | null;
}

export const PhotoManagementModal: React.FC<PhotoManagementModalProps> = ({
  isOpen,
  onClose,
  images,
  onUpload,
  onEdit,
  onDelete,
  onReorder,
  isUploading = false,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
  });
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Create 4 slots (0-3) with images mapped to their order
  const slots: PhotoSlot[] = Array.from({ length: 4 }, (_, index) => {
    const image = images.find((img) => img.order === index && img.isActive);
    return {
      index,
      image: image || null,
    };
  });

  const activeImages = images.filter((img) => img.isActive);
  const hasEmptySlots = activeImages.length < 4;

  const handleSlotUpload = (slotIndex: number) => {
    const input = fileInputRefs.current[slotIndex];
    if (input) {
      input.click();
    }
  };

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

    if (activeImages.length >= 4) {
      toast.error("Maximum 4 photos allowed");
      return;
    }

    try {
      await onUpload(file);
      toast.success("Photo uploaded successfully");
      // Reset input
      if (fileInputRefs.current[slotIndex]) {
        fileInputRefs.current[slotIndex]!.value = "";
      }
    } catch (error) {
      toast.error("Failed to upload photo");
    }
  };

  const handleEditClick = (image: CarouselImage) => {
    setEditingId(image.id);
    setEditForm({
      title: image.title || "",
      description: image.description || "",
    });
  };

  const handleSaveEdit = async (id: string) => {
    try {
      await onEdit(id, editForm.title, editForm.description);
      toast.success("Photo updated successfully");
      setEditingId(null);
    } catch (error) {
      toast.error("Failed to update photo");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this photo?")) return;

    try {
      await onDelete(id);
      toast.success("Photo deleted successfully");
    } catch (error) {
      toast.error("Failed to delete photo");
    }
  };

  const handleReorder = async (id: string, direction: "up" | "down") => {
    try {
      await onReorder(id, direction);
    } catch (error) {
      toast.error("Failed to reorder photo");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Manage Carousel Photos (${activeImages.length}/4)`}
      showCloseButton={true}
      className={styles.modal}
    >
      <div className={styles.modalContent}>
        <div className={styles.grid}>
          {slots.map((slot, idx) => (
            <div key={slot.index} className={styles.slot}>
              {slot.image ? (
                <div className={styles.photoSlot}>
                  <div className={styles.imageContainer}>
                    <img
                      src={slot.image.imageUrl}
                      alt={slot.image.title || `Photo ${slot.index + 1}`}
                      className={styles.photoImage}
                    />
                    <div className={styles.photoOverlay}>
                      <div className={styles.photoActions}>
                        <button
                          onClick={() => handleReorder(slot.image!.id, "up")}
                          disabled={slot.image!.order === 0}
                          className={styles.actionButton}
                          title="Move up"
                        >
                          <ArrowUp size={14} />
                        </button>
                        <button
                          onClick={() => handleReorder(slot.image!.id, "down")}
                          disabled={slot.image!.order === activeImages.length - 1}
                          className={styles.actionButton}
                          title="Move down"
                        >
                          <ArrowDown size={14} />
                        </button>
                        <button
                          onClick={() => handleEditClick(slot.image!)}
                          className={styles.actionButton}
                          title="Edit"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(slot.image!.id)}
                          className={styles.actionButton}
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {editingId === slot.image.id ? (
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
                  ) : (
                    <div className={styles.photoInfo}>
                      {slot.image.title && (
                        <p className={styles.photoTitle}>{slot.image.title}</p>
                      )}
                      {slot.image.description && (
                        <p className={styles.photoDescription}>{slot.image.description}</p>
                      )}
                      <p className={styles.photoOrder}>Position: {slot.image.order + 1}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className={styles.emptySlot}>
                  <input
                    ref={(el) => (fileInputRefs.current[idx] = el)}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, idx)}
                    className={styles.fileInput}
                    disabled={isUploading || activeImages.length >= 4}
                  />
                  <button
                    type="button"
                    onClick={() => handleSlotUpload(idx)}
                    disabled={isUploading || activeImages.length >= 4}
                    className={styles.uploadSlotButton}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 size={20} className={styles.spinner} />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload size={20} />
                        <span>Upload Photo</span>
                      </>
                    )}
                  </button>
                  <p className={styles.emptySlotHint}>Slot {slot.index + 1}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className={styles.modalActions}>
          <Button variant="primary" size="lg" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
};

