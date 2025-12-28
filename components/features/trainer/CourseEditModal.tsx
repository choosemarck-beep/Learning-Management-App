"use client";

import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Modal } from "@/components/ui/Modal";
import { Tooltip } from "@/components/ui/Tooltip";
import { AdminPasswordVerification } from "./AdminPasswordVerification";
import styles from "./CourseEditModal.module.css";

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string | null;
  totalXP: number;
}

interface CourseEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course;
  onSuccess: () => void;
  onDelete?: (password: string) => Promise<void>;
}

export const CourseEditModal: React.FC<CourseEditModalProps> = ({
  isOpen,
  onClose,
  course,
  onSuccess,
  onDelete,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [formData, setFormData] = useState<any>(null);
  const [pendingAction, setPendingAction] = useState<"save" | "delete" | null>(null);
  
  // Form state
  const [title, setTitle] = useState(course.title);
  const [description, setDescription] = useState(course.description);
  const [totalXP, setTotalXP] = useState(course.totalXP);
  
  // Thumbnail file upload state
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(course.thumbnail);
  const [thumbnailUploading, setThumbnailUploading] = useState(false);

  // Sync form fields when course changes
  useEffect(() => {
    if (isOpen) {
      setTitle(course.title);
      setDescription(course.description);
      setTotalXP(course.totalXP);
      setThumbnailPreview(course.thumbnail);
      setThumbnailFile(null);
    }
  }, [isOpen, course]);

  // Handle thumbnail file selection
  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file (PNG, JPG, JPEG)");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    setThumbnailFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setThumbnailPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Upload thumbnail before saving course
  const uploadThumbnail = async (courseId: string): Promise<string | null> => {
    if (!thumbnailFile) return null;

    setThumbnailUploading(true);
    try {
      const formData = new FormData();
      formData.append("thumbnail", thumbnailFile);

      const response = await fetch(`/api/trainer/courses/${courseId}/thumbnail`, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to upload thumbnail");
      }

      return result.data.thumbnailUrl;
    } catch (error) {
      console.error("Error uploading thumbnail:", error);
      toast.error("Failed to upload thumbnail. Please try again.");
      return null;
    } finally {
      setThumbnailUploading(false);
    }
  };

  const handleSave = async (password?: string) => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    setIsLoading(true);

    try {
      // Save course first
      const response = await fetch(`/api/trainer/courses/${course.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...(password && { password }),
          title,
          description: description || null,
          thumbnail: course.thumbnail || null, // Keep existing thumbnail if no new file
          totalXP: totalXP || 0,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        const errorMessage = result.error || "Failed to update course";
        toast.error(errorMessage);
        setIsLoading(false);
        return;
      }

      // Upload thumbnail if a new file was selected
      // The thumbnail upload API already updates the database, so no need for a second PUT request
      if (thumbnailFile) {
        const thumbnailUrl = await uploadThumbnail(course.id);
        if (!thumbnailUrl) {
          toast.error("Failed to upload thumbnail");
        }
        // Thumbnail is already saved to database by the upload API, no need to update again
      }

      toast.success("Course updated successfully!");
      setThumbnailFile(null);
      // Reset preview to course thumbnail (will be updated by onSuccess refresh)
      onSuccess();
      onClose();
      setIsLoading(false);
    } catch (err) {
      console.error("Error saving course:", err);
      toast.error("An error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    // Password verification required for editing
    setPendingAction("save");
    setFormData({
      title,
      description,
      totalXP,
    });
    setIsPasswordModalOpen(true);
  };

  const handleDeleteClick = () => {
    if (!onDelete) return;
    
    if (confirm("Are you sure you want to delete this course? This will also delete all trainings, quizzes, and mini trainings.")) {
      setPendingAction("delete");
      setIsDeleteModalOpen(true);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        className={styles.modal}
        showCloseButton={false}
        closeOnBackdropClick={true}
      >
        <form className={styles.form}>
          {/* Header */}
          <div className={styles.modalHeader}>
            <h2 className={styles.modalTitle}>Edit Course</h2>
          </div>

          <div className={styles.formContent}>
            <div className={styles.formFields}>
              <Input
                label="Course Title"
                placeholder="e.g., Customer Service Fundamentals"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
              <Textarea
                label="Description"
                placeholder="Describe what this course covers..."
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
              <Input
                label="Total XP"
                type="number"
                min={0}
                value={totalXP}
                onChange={(e) => setTotalXP(parseInt(e.target.value) || 0)}
              />
              
              {/* Thumbnail Upload */}
              <div className={styles.thumbnailSection}>
                <label className={styles.thumbnailLabel}>Thumbnail</label>
                <div className={styles.thumbnailRow}>
                  {thumbnailPreview && (
                    <div className={styles.thumbnailPreview}>
                      <img
                        src={thumbnailPreview}
                        alt="Thumbnail preview"
                        className={styles.thumbnailPreviewImage}
                      />
                      {thumbnailFile && (
                        <button
                          type="button"
                          onClick={() => {
                            setThumbnailFile(null);
                            setThumbnailPreview(course.thumbnail);
                          }}
                          className={styles.removeThumbnailButton}
                          aria-label="Remove thumbnail"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  )}
                  <div className={styles.uploadButtonRow}>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg"
                      onChange={handleThumbnailChange}
                      className={styles.fileInput}
                      id="course-thumbnail-upload"
                      disabled={isLoading || thumbnailUploading}
                    />
                    <Tooltip
                      content="PNG, JPG, or JPEG. Max 5MB. Recommended: 1920×1080"
                      position="top"
                    >
                      <label
                        htmlFor="course-thumbnail-upload"
                        className={styles.fileInputLabel}
                      >
                        {thumbnailFile ? "Change" : thumbnailPreview ? "Change" : "Upload"}
                      </label>
                    </Tooltip>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.actions}>
            {onDelete && (
              <Button
                type="button"
                variant="ghost"
                size="md"
                onClick={handleDeleteClick}
                disabled={isLoading}
                className={styles.deleteButton}
              >
                Delete Course
              </Button>
            )}
            <div className={styles.rightActions}>
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleSubmit}
                isLoading={isLoading || thumbnailUploading}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {isPasswordModalOpen && formData && pendingAction === "save" && (
        <AdminPasswordVerification
          isOpen={isPasswordModalOpen}
          onClose={() => {
            setIsPasswordModalOpen(false);
            setFormData(null);
            setPendingAction(null);
          }}
          onVerify={async (password) => {
            await handleSave(password);
            setIsPasswordModalOpen(false);
            setFormData(null);
            setPendingAction(null);
          }}
          action="save changes to this course"
          isLoading={isLoading}
          passwordType="trainer"
        />
      )}

      {isDeleteModalOpen && onDelete && pendingAction === "delete" && (
        <AdminPasswordVerification
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setPendingAction(null);
          }}
          onVerify={async (password) => {
            await onDelete(password);
            setIsDeleteModalOpen(false);
            setPendingAction(null);
            onClose();
          }}
          action="delete this course"
          isLoading={isLoading}
          passwordType="trainer"
        />
      )}
    </>
  );
};

