"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import styles from "./CreateMandatoryTrainingModal.module.css";

const trainingSchema = z.object({
  title: z.string().min(1, "Title is required").min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  badgeIcon: z.string().optional(),
  badgeColor: z.string().optional(),
});

type TrainingFormData = z.infer<typeof trainingSchema>;

interface CreateMandatoryTrainingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CreateMandatoryTrainingModal: React.FC<CreateMandatoryTrainingModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  // Multi-step form state
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 2;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    getValues,
  } = useForm<TrainingFormData>({
    resolver: zodResolver(trainingSchema),
    mode: "onChange",
  });

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      reset();
      setCurrentStep(1);
    }
  }, [isOpen, reset]);

  // Step validation
  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!watch("title") && watch("title")!.length >= 3;
      case 2:
        return true; // Badge fields are optional
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep) && currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else if (!validateStep(currentStep)) {
      const stepErrors = Object.keys(errors);
      if (stepErrors.length > 0) {
        const firstError = stepErrors[0] as keyof TrainingFormData;
        const errorMessage = errors[firstError]?.message || "Please fill in all required fields";
        toast.error(errorMessage);
      } else {
        toast.error("Please fill in all required fields");
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = async (data: TrainingFormData) => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/trainer/mandatory-trainings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: data.title,
          description: data.description || null,
          badgeIcon: data.badgeIcon || null,
          badgeColor: data.badgeColor || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        const errorMessage = result.error || "Failed to create training";
        toast.error(errorMessage);
        setIsLoading(false);
        return;
      }

      toast.success("Training created successfully!");
      
      if (onSuccess) {
        onSuccess();
      }
      
      onClose();
    } catch (err) {
      console.error("Error creating training:", err);
      toast.error("An error occurred. Please try again.");
      setIsLoading(false);
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
          <h2 className={styles.modalTitle}>Create New Training</h2>
          <div className={styles.progressDots}>
            {[1, 2].map((step) => (
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

        <div className={styles.stepContent}>
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className={styles.stepFields}>
              <Input
                label="Training Title"
                placeholder="e.g., Customer Service Excellence"
                error={errors.title?.message}
                required
                {...register("title")}
              />
                <Textarea
                label="Description (Optional)"
                placeholder="Describe what employees will learn..."
                rows={4}
                error={errors.description?.message}
                {...register("description")}
              />
            </div>
          )}

          {/* Step 2: Badge Settings */}
          {currentStep === 2 && (
            <div className={styles.stepFields}>
              <Input
                label="Badge Icon (Optional)"
                placeholder="Icon identifier"
                error={errors.badgeIcon?.message}
                {...register("badgeIcon")}
              />
              <Input
                label="Badge Color (Optional)"
                placeholder="#8B5CF6"
                error={errors.badgeColor?.message}
                {...register("badgeColor")}
              />
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
              type="submit"
              variant="primary"
              size="md"
              isLoading={isLoading}
            >
              Create Training
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
};

