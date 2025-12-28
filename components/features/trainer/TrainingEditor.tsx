"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Modal } from "@/components/ui/Modal";
import { Tooltip } from "@/components/ui/Tooltip";
import { AdminPasswordVerification } from "./AdminPasswordVerification";
import { extractYouTubeVideoId, isDirectVideoUrl } from "@/lib/utils/videoUtils";
import styles from "./TrainingEditor.module.css";

// YouTube Player API types
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

// Phase 2: Remove videoThumbnail from schema validation (handled via file upload)
const trainingSchema = z.object({
  title: z.string().min(1, "Title is required").min(3, "Title must be at least 3 characters"),
  shortDescription: z.string().optional(),
  videoUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  videoDuration: z.number().int().min(0).optional(),
  videoThumbnail: z.string().optional(), // Phase 2: No URL validation needed (file upload)
  minimumWatchTime: z.number().int().min(0).optional(),
  totalXP: z.number().int().min(0).default(0),
  isPublished: z.boolean().default(false),
});

type TrainingFormData = z.infer<typeof trainingSchema>;

interface TrainingEditorProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  trainingId?: string; // If provided, we're editing
  onSuccess?: () => void;
}

export const TrainingEditor: React.FC<TrainingEditorProps> = ({
  isOpen,
  onClose,
  courseId,
  trainingId,
  onSuccess,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [formData, setFormData] = useState<TrainingFormData | null>(null);
  const [isDetectingDuration, setIsDetectingDuration] = useState(false);
  // Phase 2: Thumbnail file upload state
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [thumbnailUploading, setThumbnailUploading] = useState(false);
  // Multi-step form state
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
    setValue,
    getValues,
  } = useForm<TrainingFormData>({
    resolver: zodResolver(trainingSchema),
    mode: "onChange",
    defaultValues: {
      totalXP: 0,
      isPublished: false,
    },
  });

  // Phase 2: Handle thumbnail file selection
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

  // Phase 2: Upload thumbnail before saving training
  const uploadThumbnail = async (trainingId: string): Promise<string | null> => {
    if (!thumbnailFile) return null;

    setThumbnailUploading(true);
    try {
      const formData = new FormData();
      formData.append("thumbnail", thumbnailFile);

      const response = await fetch(`/api/trainer/trainings/${trainingId}/thumbnail`, {
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

  const videoUrl = watch("videoUrl");

  // Load training data if editing
  useEffect(() => {
    if (isOpen && trainingId) {
      fetchTraining();
    } else if (isOpen && !trainingId) {
      reset({
        title: "",
        shortDescription: "",
        videoUrl: "",
        videoDuration: undefined,
        videoThumbnail: "",
        minimumWatchTime: undefined,
        totalXP: 0,
        isPublished: false,
      });
      setVideoPreviewUrl(null);
      // Phase 2: Reset thumbnail state
      setThumbnailFile(null);
      setThumbnailPreview(null);
      setCurrentStep(1);
    }
  }, [isOpen, trainingId]);

  // Update video preview when URL changes
  useEffect(() => {
    if (videoUrl && videoUrl.trim()) {
      setVideoPreviewUrl(videoUrl.trim());
    } else {
      setVideoPreviewUrl(null);
    }
  }, [videoUrl]);

  // Auto-detect video duration when URL changes (deferred to avoid render-time updates)
  useEffect(() => {
    if (!videoUrl || !videoUrl.trim()) {
      return;
    }

    const trimmedUrl = videoUrl.trim();
    const currentDuration = getValues("videoDuration");
    
    // Skip if we're editing and already have duration set
    if (trainingId && currentDuration) {
      return;
    }

    // Debounce detection to avoid too many requests
    const timeoutId = setTimeout(async () => {
      setIsDetectingDuration(true);

      try {
        // Check if it's a direct video file - use client-side detection
        if (trimmedUrl.match(/\.(mp4|webm|ogg|mov|avi|mkv)$/i)) {
          // Create video element to get duration
          const video = document.createElement("video");
          video.preload = "metadata";
          video.src = trimmedUrl;
          
          video.onloadedmetadata = () => {
            const duration = Math.floor(video.duration);
            if (duration > 0 && duration !== currentDuration) {
              // Defer state updates to next tick to avoid render-time updates
              setTimeout(() => {
                setValue("videoDuration", duration, { shouldValidate: false });
                
                // Auto-calculate minimum watch time (80% of duration, minimum 60 seconds)
                const calculatedMinimumWatchTime = Math.max(
                  Math.floor(duration * 0.8),
                  60 // Minimum 60 seconds
                );
                setValue("minimumWatchTime", calculatedMinimumWatchTime, { shouldValidate: false });
                
                toast.success(`Video duration detected: ${Math.floor(duration / 60)}:${String(duration % 60).padStart(2, "0")}. Minimum watch time set to ${Math.floor(calculatedMinimumWatchTime / 60)}:${String(calculatedMinimumWatchTime % 60).padStart(2, "0")}`);
                setIsDetectingDuration(false);
              }, 0);
            } else {
              setIsDetectingDuration(false);
            }
          };

          video.onerror = () => {
            setIsDetectingDuration(false);
          };
        } else {
          // For YouTube/Vimeo, try API endpoint
          const response = await fetch("/api/video/metadata", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ videoUrl: trimmedUrl }),
          });

          const result = await response.json();

          if (result.success && result.duration && result.duration !== currentDuration) {
            const duration = result.duration;
            // Defer state updates to next tick
            setTimeout(() => {
              setValue("videoDuration", duration, { shouldValidate: false });
              
              // Auto-calculate minimum watch time (80% of duration, minimum 60 seconds)
              const calculatedMinimumWatchTime = Math.max(
                Math.floor(duration * 0.8),
                60 // Minimum 60 seconds
              );
              setValue("minimumWatchTime", calculatedMinimumWatchTime, { shouldValidate: false });
              
              toast.success(`Video duration detected: ${Math.floor(duration / 60)}:${String(duration % 60).padStart(2, "0")}. Minimum watch time set to ${Math.floor(calculatedMinimumWatchTime / 60)}:${String(calculatedMinimumWatchTime % 60).padStart(2, "0")}`);
              setIsDetectingDuration(false);
            }, 0);
          } else {
            setIsDetectingDuration(false);
          }
        }
      } catch (error) {
        console.error("Error detecting video duration:", error);
        setIsDetectingDuration(false);
      }
    }, 1000); // Wait 1 second after user stops typing

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoUrl, trainingId]); // Only depend on videoUrl and trainingId

  const fetchTraining = async () => {
    try {
      // Phase 2: Reset thumbnail state when fetching
      setThumbnailFile(null);
      setThumbnailPreview(null);

      const response = await fetch(`/api/trainer/trainings/${trainingId}`);
      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || "Failed to load training");
        return;
      }

      const training = result.data.training;
      
      reset({
        title: training.title || "",
        shortDescription: training.shortDescription || "",
        videoUrl: training.videoUrl || "",
        videoDuration: training.videoDuration || undefined,
        videoThumbnail: training.videoThumbnail || "",
        minimumWatchTime: training.minimumWatchTime || undefined,
        totalXP: training.totalXP || 0,
        isPublished: training.isPublished || false,
      });
      setVideoPreviewUrl(training.videoUrl || null);
      
      // Phase 2: Set thumbnail preview if existing thumbnail exists
      if (training.videoThumbnail) {
        setThumbnailPreview(training.videoThumbnail);
      }
    } catch (error) {
      console.error("Error fetching training:", error);
      toast.error("Failed to load training");
    }
  };

  const onSubmit = async (data: TrainingFormData) => {
    // Password verification will be handled at step 3 when clicking "Save Changes"
    // For now, just validate the form
    if (currentStep < totalSteps) {
      return;
    }

    // If editing, require password verification
    if (trainingId) {
      setFormData(data);
      setIsPasswordModalOpen(true);
      return;
    }

    // Creating new training - no password required
    await saveTraining(data);
  };

  const saveTraining = async (data: TrainingFormData, password?: string) => {
    setIsLoading(true);

    try {
      const url = trainingId
        ? `/api/trainer/trainings/${trainingId}`
        : `/api/trainer/courses/${courseId}/trainings`;
      const method = trainingId ? "PUT" : "POST";

      // Phase 2: Create training first (to get trainingId for thumbnail upload)
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...(password && { password }),
          title: data.title,
          shortDescription: data.shortDescription?.trim() || null,
          videoUrl: data.videoUrl?.trim() || null,
          videoDuration: data.videoDuration || null, // Auto-detected duration
          // Don't send videoThumbnail in initial save - thumbnails are handled via file upload
          // The thumbnail will be uploaded separately after training is created/updated
          minimumWatchTime: data.minimumWatchTime || null,
          totalXP: data.totalXP || 0,
          isPublished: data.isPublished || false,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        // Show detailed validation errors if available
        if (result.details && Array.isArray(result.details) && result.details.length > 0) {
          const firstError = result.details[0];
          const fieldName = firstError.path?.join('.') || 'field';
          const errorMessage = firstError.message || result.error || "Validation error";
          toast.error(`${fieldName}: ${errorMessage}`);
        } else {
          const errorMessage = result.error || "Failed to save training";
          toast.error(errorMessage);
        }
        setIsLoading(false);
        return;
      }

      const savedTrainingId = result.data.training?.id || trainingId;

      // Phase 2: Upload thumbnail if a new file was selected
      // The thumbnail upload API already updates the database, so no need for a second PUT request
      if (thumbnailFile && savedTrainingId) {
        const thumbnailUrl = await uploadThumbnail(savedTrainingId);
        if (!thumbnailUrl) {
          toast.error("Failed to upload thumbnail");
        }
        // Thumbnail is already saved to database by the upload API, no need to update again
      }

      toast.success(trainingId ? "Training updated successfully!" : "Training created successfully!");
      
      if (onSuccess) {
        onSuccess();
      }
      
      setIsPasswordModalOpen(false);
      setFormData(null);
      setThumbnailFile(null);
      setThumbnailPreview(null);
      onClose();
      setIsLoading(false);
    } catch (err) {
      console.error("Error saving training:", err);
      toast.error("An error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  const getVideoEmbedUrl = (url: string): string | null => {
    if (!url) return null;

    // YouTube
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const youtubeMatch = url.match(youtubeRegex);
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
    }

    // Vimeo
    const vimeoRegex = /(?:vimeo\.com\/)(?:.*\/)?(\d+)/;
    const vimeoMatch = url.match(vimeoRegex);
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }

    // Direct video URL (MP4, WebM, etc.)
    if (url.match(/\.(mp4|webm|ogg|mov)$/i)) {
      return url;
    }

    return null;
  };

  const embedUrl = videoPreviewUrl ? getVideoEmbedUrl(videoPreviewUrl) : null;

  // Step validation
  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!watch("title") && watch("title")!.length >= 3;
      case 2:
        return !!watch("videoUrl");
      case 3:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep) && currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        className={styles.modal}
        showCloseButton={false}
        closeOnBackdropClick={true}
      >
        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          {/* Header with Title and Progress Dots */}
          <div className={styles.modalHeader}>
            <h2 className={styles.modalTitle}>{trainingId ? "Edit Training" : "Create New Training"}</h2>
            <div className={styles.progressDots}>
              {[1, 2, 3].map((step) => (
                <div
                  key={step}
                  className={`${styles.progressDot} ${
                    step === currentStep ? styles.active : step < currentStep ? styles.completed : ""
                  }`}
                >
                  {step < currentStep ? "✓" : step}
                </div>
              ))}
            </div>
          </div>

        <div className={styles.formContent}>
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className={styles.stepContent}>
              <div className={styles.stepFields}>
                <Input
                  label="Training Title"
                  placeholder="e.g., Introduction to Customer Service"
                  error={errors.title?.message}
                  required
                  {...register("title")}
                />
                <Textarea
                  label="Description"
                  placeholder="Brief description of what this training covers..."
                  rows={4}
                  error={errors.shortDescription?.message}
                  {...register("shortDescription")}
                />
              </div>
            </div>
          )}

          {/* Step 2: Video Content */}
          {currentStep === 2 && (
            <div className={styles.stepContent}>
              <div className={styles.stepFields}>
                <Input
                  label="Video URL"
                  placeholder="YouTube, Vimeo, or direct video URL"
                  error={errors.videoUrl?.message}
                  {...register("videoUrl")}
                />
                {isDetectingDuration && (
                  <p className={styles.helperText}>
                    Detecting video duration...
                  </p>
                )}
                
                <div className={styles.previewsContainer}>
                  <div className={styles.previewsRow}>
                    {embedUrl && (
                      <div className={styles.videoContainer}>
                        {embedUrl.includes("youtube.com") || embedUrl.includes("youtu.be") ? (
                          <iframe
                            src={embedUrl}
                            className={styles.videoIframe}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            title="Video preview"
                          />
                        ) : embedUrl.includes("vimeo.com") ? (
                          <iframe
                            src={embedUrl}
                            className={styles.videoIframe}
                            allow="autoplay; fullscreen; picture-in-picture"
                            allowFullScreen
                            title="Video preview"
                          />
                        ) : (
                          <video
                            src={embedUrl}
                            controls
                            className={styles.videoElement}
                          />
                        )}
                      </div>
                    )}
                    {(thumbnailPreview || (trainingId && watch("videoThumbnail"))) && (
                      <div className={styles.thumbnailPreview}>
                        <img
                          src={thumbnailPreview || watch("videoThumbnail") || ""}
                          alt="Thumbnail preview"
                          className={styles.thumbnailPreviewImage}
                        />
                        {thumbnailFile && (
                          <button
                            type="button"
                            onClick={() => {
                              setThumbnailFile(null);
                              setThumbnailPreview(null);
                            }}
                            className={styles.removeThumbnailButton}
                            aria-label="Remove thumbnail"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <div className={styles.uploadButtonRow}>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg"
                      onChange={handleThumbnailChange}
                      className={styles.fileInput}
                      id="thumbnail-upload"
                      disabled={isLoading || thumbnailUploading}
                    />
                    <Tooltip
                      content="PNG, JPG, or JPEG. Max 5MB. Recommended: 1920×1080"
                      position="top"
                    >
                      <label
                        htmlFor="thumbnail-upload"
                        className={styles.fileInputLabel}
                      >
                        {thumbnailFile ? "Change" : "Upload"}
                      </label>
                    </Tooltip>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Settings */}
          {currentStep === 3 && (
            <div className={styles.stepContent}>
              <div className={styles.stepFields}>
                <Input
                  label="Minimum Watch Time (seconds)"
                  type="number"
                  min={0}
                  placeholder="Auto-detected"
                  error={errors.minimumWatchTime?.message}
                  {...register("minimumWatchTime", { valueAsNumber: true })}
                />
                {watch("videoDuration") && watch("minimumWatchTime") && (
                  <p className={styles.helperText}>
                    Auto-set to {Math.floor((watch("minimumWatchTime") || 0) / 60)}:{String((watch("minimumWatchTime") || 0) % 60).padStart(2, "0")} - You can override this
                  </p>
                )}
                
                <Input
                  label="Total XP"
                  type="number"
                  min={0}
                  placeholder="0"
                  error={errors.totalXP?.message}
                  {...register("totalXP", { valueAsNumber: true })}
                />

                <div className={styles.publishToggle}>
                  <div className={styles.toggleHeader}>
                    <label htmlFor="isPublished" className={styles.toggleLabel}>Publish Status</label>
                    <div className={styles.toggleSwitch}>
                      <input
                        type="checkbox"
                        id="isPublished"
                        {...register("isPublished")}
                        className={styles.toggleInput}
                      />
                      <label htmlFor="isPublished" className={styles.toggleSlider}>
                      </label>
                    </div>
                  </div>
                  <p className={styles.toggleHelperText}>
                    {watch("isPublished") 
                      ? "Training will be immediately visible to employees" 
                      : "Training will be saved as a draft and not visible to employees"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className={styles.actions}>
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={currentStep === 1 ? onClose : handleBack}
            disabled={isLoading}
          >
            {currentStep === 1 ? "Cancel" : "Back"}
          </Button>
          {currentStep < totalSteps ? (
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={handleNext}
              disabled={!validateStep(currentStep)}
            >
              Next
            </Button>
          ) : (
            <Button
              type="button"
              variant="primary"
              size="md"
              isLoading={isLoading}
              onClick={async () => {
                const isValid = await validateStep(currentStep);
                if (!isValid) {
                  const stepErrors = Object.keys(errors);
                  if (stepErrors.length > 0) {
                    const firstError = stepErrors[0] as keyof TrainingFormData;
                    const errorMessage = errors[firstError]?.message || "Please fill in all required fields";
                    toast.error(errorMessage);
                  } else {
                    toast.error("Please fill in all required fields");
                  }
                  return;
                }
                const data = getValues();
                // If editing, require password verification
                if (trainingId) {
                  setFormData(data);
                  setIsPasswordModalOpen(true);
                  return;
                }
                // Creating new training - no password required
                await saveTraining(data);
              }}
            >
              {trainingId ? "Save Changes" : "Create Training"}
            </Button>
          )}
        </div>
      </form>

      {isPasswordModalOpen && formData && (
        <AdminPasswordVerification
          isOpen={isPasswordModalOpen}
          onClose={() => {
            setIsPasswordModalOpen(false);
            setFormData(null);
          }}
          onVerify={async (password) => {
            await saveTraining(formData, password);
          }}
          action="save changes to this training"
          isLoading={isLoading}
          passwordType="trainer"
        />
      )}
    </Modal>
  );
};

