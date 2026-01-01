"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { ProgressIndicator } from "@/components/features/signup/ProgressIndicator";
import styles from "./CourseCreationModal.module.css";

const TOTAL_STEPS = 3;

const courseSchema = z.object({
  // Step 1: Course Info
  title: z.string().min(1, "Title is required").min(3, "Title must be at least 3 characters"),
  description: z.string().min(1, "Description is required").min(10, "Description must be at least 10 characters"),
  thumbnail: z.string().optional(),
  totalXP: z.number().int().min(0).default(0),
  isPublished: z.boolean().default(false),
});

type CourseFormData = z.infer<typeof courseSchema>;

interface CourseCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CourseCreationModal: React.FC<CourseCreationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const stepContentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number | "auto">("auto");

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    trigger,
    reset,
  } = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    mode: "onChange",
    defaultValues: {
      totalXP: 0,
      isPublished: false,
    },
  });

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      reset();
      setCurrentStep(1);
    }
  }, [isOpen, reset]);

  const validateStep = async (step: number): Promise<boolean> => {
    let fieldsToValidate: (keyof CourseFormData)[] = [];

    switch (step) {
      case 1:
        fieldsToValidate = ["title", "description"];
        break;
      case 2:
        // Step 2 is for adding trainings - no validation needed here
        return true;
      case 3:
        // Review step - validate all
        return await trigger();
    }

    const result = await trigger(fieldsToValidate);
    return result;
  };

  const handleNext = async () => {
    const isValid = await validateStep(currentStep);
    if (!isValid) {
      const stepErrors = Object.keys(errors).filter((key) => {
        const fieldKey = key as keyof CourseFormData;
        switch (currentStep) {
          case 1:
            return ["title", "description"].includes(key);
          default:
            return false;
        }
      });

      if (stepErrors.length > 0) {
        const firstError = stepErrors[0] as keyof CourseFormData;
        const errorMessage = errors[firstError]?.message || "Please fill in all required fields";
        toast.error(errorMessage);
      } else {
        toast.error("Please fill in all required fields");
      }
      return;
    }
    if (isValid && currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = async (data: CourseFormData) => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/trainer/courses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: data.title,
          description: data.description,
          thumbnail: data.thumbnail || null,
          totalXP: data.totalXP || 0,
          isPublished: data.isPublished || false,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle HTTP errors (4xx, 5xx)
        const errorMessage = result.error || result.message || `Server error (${response.status})`;
        toast.error(errorMessage, { duration: 6000 });
        
        // Handle field-specific errors
        if (result.field) {
          // Navigate to the appropriate step based on the field
          if (result.field === "title" || result.field === "description") {
            setCurrentStep(1);
          }
        }
        
        if (result.details) {
          const validationErrors: Record<string, string> = {};
          result.details.forEach((err: any) => {
            if (err.path && err.path.length > 0) {
              validationErrors[err.path[0]] = err.message;
            }
          });
          // Navigate to step 1 if there are validation errors in required fields
          if (validationErrors.title || validationErrors.description) {
            setCurrentStep(1);
          }
        }
        
        console.error("Course creation failed:", {
          status: response.status,
          error: result.error,
          field: result.field,
          code: result.code,
          details: result.details,
        });
        setIsLoading(false);
        return;
      }

      if (result.success) {
        toast.success("Course created successfully!");
      } else {
        toast.error(result.error || "Failed to create course", { duration: 6000 });
        setIsLoading(false);
        return;
      }
      
      if (onSuccess) {
        onSuccess();
      }
      
      router.refresh();
      onClose();
    } catch (err) {
      console.error("Error creating course:", err);
      toast.error("An error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  // Measure content height
  useEffect(() => {
    const timer = setTimeout(() => {
      if (stepContentRef.current) {
        const height = stepContentRef.current.scrollHeight;
        setContentHeight(height);
      }
    }, 10);
    return () => clearTimeout(timer);
  }, [currentStep, errors]);

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className={styles.stepContent}>
            <div className={styles.formFields}>
              <Input
                label="Course Title"
                placeholder="e.g., Customer Service Excellence"
                error={errors.title?.message}
                required
                {...register("title")}
              />
              <Textarea
                label="Description"
                placeholder="Describe what employees will learn in this course..."
                rows={6}
                error={errors.description?.message}
                required
                {...register("description")}
              />
              <div className={styles.row}>
                <Input
                  label="Thumbnail URL (Optional)"
                  placeholder="https://example.com/image.jpg"
                  error={errors.thumbnail?.message}
                  {...register("thumbnail")}
                />
                <Input
                  label="Total XP"
                  type="number"
                  min={0}
                  placeholder="0"
                  error={errors.totalXP?.message}
                  {...register("totalXP", { valueAsNumber: true })}
                />
              </div>
              <div className={styles.toggleField}>
                <div className={styles.toggleLabel}>
                  <span>Publication Status</span>
                </div>
                <div className={styles.toggleContainer}>
                  <button
                    type="button"
                    className={`${styles.toggleOption} ${!watch("isPublished") ? styles.toggleActive : ""}`}
                    onClick={() => setValue("isPublished", false)}
                  >
                    Draft
                  </button>
                  <button
                    type="button"
                    className={`${styles.toggleOption} ${watch("isPublished") ? styles.toggleActive : ""}`}
                    onClick={() => setValue("isPublished", true)}
                  >
                    Publish
                  </button>
                </div>
                <p className={styles.helperText}>
                  {watch("isPublished") 
                    ? "Course will be published immediately after creation"
                    : "Course will be saved as a draft and can be published later"}
                </p>
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className={styles.stepContent}>
            <div className={styles.infoBox}>
              <p>
                After creating the course, you'll be able to add trainings, quizzes, and mini trainings
                through the course editor.
              </p>
            </div>
          </div>
        );
      case 3:
        const formData = watch();
        return (
          <div className={styles.stepContent}>
            <div className={styles.reviewSection}>
              <div className={styles.reviewItem}>
                <span className={styles.reviewLabel}>Title:</span>
                <span className={styles.reviewValue}>{formData.title}</span>
              </div>
              <div className={styles.reviewItem}>
                <span className={styles.reviewLabel}>Description:</span>
                <span className={styles.reviewValue}>{formData.description}</span>
              </div>
              {formData.thumbnail && (
                <div className={styles.reviewItem}>
                  <span className={styles.reviewLabel}>Thumbnail:</span>
                  <span className={styles.reviewValue}>{formData.thumbnail}</span>
                </div>
              )}
              <div className={styles.reviewItem}>
                <span className={styles.reviewLabel}>Total XP:</span>
                <span className={styles.reviewValue}>{formData.totalXP || 0}</span>
              </div>
              <div className={styles.reviewItem}>
                <span className={styles.reviewLabel}>Status:</span>
                <span className={styles.reviewValue}>
                  {formData.isPublished ? "Published" : "Draft"}
                </span>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      showCloseButton={false}
      closeOnBackdropClick={true}
    >
      <div className={styles.container}>
        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          {/* Header with Title and Progress Dots */}
          <div className={styles.modalHeader}>
            <h2 className={styles.modalTitle}>Create New Course</h2>
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
          <motion.div
            animate={{ height: contentHeight }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className={styles.stepContentWrapper}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                ref={stepContentRef}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className={styles.stepContent}
                onAnimationComplete={() => {
                  setTimeout(() => {
                    if (stepContentRef.current) {
                      const height = stepContentRef.current.scrollHeight;
                      setContentHeight(height);
                    }
                  }, 50);
                }}
              >
                {renderStep()}
              </motion.div>
            </AnimatePresence>
          </motion.div>

          <div className={styles.navigation}>
            {currentStep > 1 && (
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={handleBack}
                disabled={isLoading}
              >
                Back
              </Button>
            )}
            {currentStep < TOTAL_STEPS ? (
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleNext}
                disabled={isLoading}
              >
                Next
              </Button>
            ) : (
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isLoading}
              >
                Create Course
              </Button>
            )}
          </div>
        </form>
      </div>
    </Modal>
  );
};

