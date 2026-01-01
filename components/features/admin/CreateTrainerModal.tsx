"use client";

import React, { useState, useRef, useEffect } from "react";
import { Copy, Check } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { ProgressIndicator } from "@/components/features/signup/ProgressIndicator";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./CreateTrainerModal.module.css";

export interface CreateTrainerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  companies?: Array<{ id: string; name: string }>;
}

export const CreateTrainerModal: React.FC<CreateTrainerModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  companies = [],
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 2;
  const [isNavigating, setIsNavigating] = useState(false); // Prevent submission during navigation
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    employeeNumber: "",
    phone: "",
    companyId: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generatedCredentials, setGeneratedCredentials] = useState<{
    email: string;
    password: string;
  } | null>(null);
  const credentialsContainerRef = useRef<HTMLDivElement>(null);
  const stepContentRef = useRef<HTMLDivElement>(null);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        employeeNumber: "",
        phone: "",
        companyId: "",
      });
      setErrors({});
      setCurrentStep(1);
      setGeneratedCredentials(null);
      setIsNavigating(false); // Reset navigation flag
    }
  }, [isOpen]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.firstName.trim()) {
        newErrors.firstName = "First name is required";
      } else if (formData.firstName.trim().length < 2) {
        newErrors.firstName = "First name must be at least 2 characters";
      }

      if (!formData.lastName.trim()) {
        newErrors.lastName = "Last name is required";
      } else if (formData.lastName.trim().length < 2) {
        newErrors.lastName = "Last name must be at least 2 characters";
      }

      if (!formData.email.trim()) {
        newErrors.email = "Email is required";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = "Please enter a valid email address";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep) && currentStep < totalSteps) {
      setIsNavigating(true); // Set flag to prevent submission during navigation
      setCurrentStep(currentStep + 1);
      // Clear navigation flag after a short delay to allow state to update
      setTimeout(() => {
        setIsNavigating(false);
      }, 100);
    } else {
      // Show first error as toast
      const firstErrorKey = Object.keys(errors)[0];
      if (firstErrorKey && errors[firstErrorKey]) {
        toast.error(errors[firstErrorKey]);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // CRITICAL: Prevent submission if we're currently navigating between steps
    if (isNavigating) {
      return;
    }

    // CRITICAL: Only allow form submission when on the final step
    // If not on final step, prevent submission entirely (e.g., when pressing Enter)
    if (currentStep !== totalSteps) {
      // If not on final step, prevent submission and just advance to next step
      // But only if validation passes
      if (validateStep(currentStep)) {
        handleNext();
      } else {
        // Show validation errors
        const firstErrorKey = Object.keys(errors)[0];
        if (firstErrorKey && errors[firstErrorKey]) {
          toast.error(errors[firstErrorKey]);
        } else {
          toast.error("Please fill in all required fields");
        }
      }
      return; // CRITICAL: Return early to prevent any submission
    }

    // We're on the final step - proceed with submission
    // Validate all steps before submission
    if (!validateStep(1)) {
      setCurrentStep(1);
      toast.error("Please fill in all required fields in Step 1");
      return;
    }

    // Step 2 fields are optional, so no validation needed

    setIsLoading(true);
    try {
      // Combine firstName and lastName into name for API
      const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim();
      
      const response = await fetch("/api/admin/users/create-trainer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: fullName,
          email: formData.email.trim().toLowerCase(),
          employeeNumber: formData.employeeNumber.trim() || undefined,
          phone: formData.phone.trim() || undefined,
          companyId: formData.companyId || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle HTTP errors (4xx, 5xx)
        const errorMessage = data.error || data.message || `Server error (${response.status})`;
        toast.error(errorMessage, { duration: 6000 });
        
        // Handle field-specific errors (e.g., unique constraint violations)
        if (data.field) {
          const fieldErrors: Record<string, string> = {};
          fieldErrors[data.field] = errorMessage;
          setErrors(fieldErrors);
          
          // Navigate to the appropriate step based on the field
          if (data.field === "email" || data.field === "firstName" || data.field === "lastName") {
            setCurrentStep(1);
          } else if (data.field === "employeeNumber" || data.field === "phone" || data.field === "companyId") {
            setCurrentStep(2);
          }
        }
        
        if (data.details) {
          const validationErrors: Record<string, string> = {};
          data.details.forEach((err: any) => {
            if (err.path && err.path.length > 0) {
              validationErrors[err.path[0]] = err.message;
            }
          });
          setErrors(validationErrors);
          // Go back to step 1 if there are errors in required fields
          if (validationErrors.firstName || validationErrors.lastName || validationErrors.email) {
            setCurrentStep(1);
          }
        }
        console.error("Trainer creation failed:", {
          status: response.status,
          error: data.error,
          field: data.field,
          code: data.code,
          details: data.details,
        });
        return;
      }

      if (data.success) {
        setGeneratedCredentials({
          email: formData.email.trim().toLowerCase(),
          password: data.password,
        });
        toast.success("Trainer account created successfully!");
        
        // Check if email was sent successfully
        if (data.emailSent === false) {
          toast.error(
            "Trainer created successfully, but email notification failed to send. Please share credentials manually.",
            { duration: 6000 }
          );
          console.warn("Email sending failed for trainer:", {
            email: formData.email.trim().toLowerCase(),
            trainerId: data.data?.id,
          });
        }
      } else {
        toast.error(data.error || "Failed to create trainer account");
        if (data.details) {
          const validationErrors: Record<string, string> = {};
          data.details.forEach((err: any) => {
            if (err.path && err.path.length > 0) {
              validationErrors[err.path[0]] = err.message;
            }
          });
          setErrors(validationErrors);
          // Go back to step 1 if there are errors in required fields
          if (validationErrors.firstName || validationErrors.lastName || validationErrors.email) {
            setCurrentStep(1);
          }
        }
      }
    } catch (error) {
      console.error("Error creating trainer:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        employeeNumber: "",
        phone: "",
        companyId: "",
      });
      setErrors({});
      setCurrentStep(1);
      setGeneratedCredentials(null);
      onClose();
    }
  };

  const handleCloseCredentials = () => {
    setGeneratedCredentials(null);
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      employeeNumber: "",
      phone: "",
      companyId: "",
    });
    setErrors({});
    setCurrentStep(1);
    onClose();
    onSuccess?.();
  };

  const copyCredentialsAsImage = async () => {
    if (!credentialsContainerRef.current) {
      toast.error("Failed to capture credentials");
      return;
    }

    try {
      let html2canvas;
      try {
        html2canvas = (await import("html2canvas")).default;
      } catch (importError) {
        toast.error("html2canvas is not installed. Please run: npm install html2canvas");
        console.error("html2canvas import error:", importError);
        return;
      }
      
      const canvas = await html2canvas(credentialsContainerRef.current, {
        backgroundColor: null,
        scale: 2,
        logging: false,
        useCORS: true,
      });

      canvas.toBlob(async (blob) => {
        if (!blob) {
          toast.error("Failed to create image");
          return;
        }

        try {
          await navigator.clipboard.write([
            new ClipboardItem({
              [blob.type]: blob,
            }),
          ]);
          toast.success("Credentials copied as image!");
        } catch (error) {
          console.error("Error copying image:", error);
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `trainer-credentials-${generatedCredentials?.email}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          toast.success("Image downloaded!");
        }
      }, "image/png");
    } catch (error) {
      console.error("Error capturing credentials:", error);
      toast.error("Failed to copy credentials. Please try again.");
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className={styles.stepContent} ref={stepContentRef}>
            <div className={styles.stepHeader}>
              <h3 className={styles.stepTitle}>Essential Information</h3>
              <p className={styles.stepDescription}>
                Let's start with the basic details needed to create the trainer account.
              </p>
            </div>

            <div className={styles.fieldsGroup}>
              <div className={styles.nameFieldsRow}>
                <div className={styles.formField}>
                  <Input
                    label="First Name"
                    name="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={handleChange}
                    error={errors.firstName}
                    required
                    disabled={isLoading}
                    placeholder="John"
                    helperText="Trainer's first name"
                  />
                </div>

                <div className={styles.formField}>
                  <Input
                    label="Last Name"
                    name="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={handleChange}
                    error={errors.lastName}
                    required
                    disabled={isLoading}
                    placeholder="Doe"
                    helperText="Trainer's last name"
                  />
                </div>
              </div>

              <div className={styles.formField}>
                <Input
                  label="Email Address"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  error={errors.email}
                  required
                  disabled={isLoading}
                  placeholder="trainer@example.com"
                  helperText="Used for login and account notifications"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className={styles.stepContent} ref={stepContentRef}>
            <div className={styles.stepHeader}>
              <h3 className={styles.stepTitle}>Additional Details</h3>
              <p className={styles.stepDescription}>
                These fields are optional but help organize trainer information.
              </p>
            </div>

            <div className={styles.fieldsGroup}>
              <div className={styles.formField}>
                <Input
                  label="Employee Number"
                  name="employeeNumber"
                  type="text"
                  value={formData.employeeNumber}
                  onChange={handleChange}
                  error={errors.employeeNumber}
                  disabled={isLoading}
                  placeholder="Optional employee identifier"
                  helperText="Leave blank if not applicable"
                />
              </div>

              <div className={styles.formField}>
                <Input
                  label="Phone Number"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  error={errors.phone}
                  disabled={isLoading}
                  placeholder="Optional contact number"
                  helperText="For internal communication purposes"
                />
              </div>

              {companies.length > 0 && (
                <div className={styles.formField}>
                  <Select
                    label="Company"
                    name="companyId"
                    value={formData.companyId}
                    onChange={handleChange}
                    error={errors.companyId}
                    disabled={isLoading}
                  >
                    <option value="">Select a company (optional)</option>
                    {companies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </Select>
                  <p className={styles.helperText}>
                    Associate this trainer with a specific company
                  </p>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen && !generatedCredentials}
        onClose={handleClose}
        title="Create Trainer Account"
        showCloseButton={false}
        closeOnBackdropClick={!isLoading}
        className={styles.modal}
      >
        <form 
          onSubmit={handleSubmit} 
          onKeyDown={(e) => {
            // Prevent Enter key from submitting form when not on final step
            if (e.key === "Enter" && currentStep !== totalSteps) {
              e.preventDefault();
              // If validation passes, advance to next step
              if (validateStep(currentStep)) {
                handleNext();
              } else {
                // Show validation errors
                const firstErrorKey = Object.keys(errors)[0];
                if (firstErrorKey && errors[firstErrorKey]) {
                  toast.error(errors[firstErrorKey]);
                } else {
                  toast.error("Please fill in all required fields");
                }
              }
            }
          }}
          className={styles.form}
        >
          {/* Progress Indicator */}
          <div className={styles.progressSection}>
            <ProgressIndicator
              currentStep={currentStep}
              totalSteps={totalSteps}
              className={styles.progressIndicator}
            />
          </div>

          {/* Step Content with Animation */}
          <div className={styles.stepContainer}>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className={styles.stepWrapper}
              >
                {renderStepContent()}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation Buttons */}
          <div className={styles.actions}>
            {currentStep > 1 ? (
              <Button
                type="button"
                variant="ghost"
                size="lg"
                onClick={handleBack}
                disabled={isLoading}
                className={styles.backButton}
              >
                Back
              </Button>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="lg"
                onClick={handleClose}
                disabled={isLoading}
                className={styles.cancelButton}
              >
                Cancel
              </Button>
            )}

            {currentStep < totalSteps ? (
              <Button
                type="button"
                variant="primary"
                size="lg"
                onClick={handleNext}
                disabled={isLoading}
                className={styles.nextButton}
              >
                Continue
              </Button>
            ) : (
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isLoading}
                className={styles.submitButton}
              >
                Create Trainer
              </Button>
            )}
          </div>
        </form>
      </Modal>

      {/* Credentials Display Modal */}
      {generatedCredentials && (
        <Modal
          isOpen={true}
          onClose={handleCloseCredentials}
          title="Trainer Account Created"
          showCloseButton={false}
          className={styles.credentialsModal}
        >
          <div className={styles.credentialsContent}>
            <div className={styles.successMessage}>
              <div className={styles.successIcon}>
                <Check size={32} />
              </div>
              <h3 className={styles.successTitle}>Account Created Successfully!</h3>
              <p className={styles.successDescription}>
                Please copy these credentials and share them securely with the trainer.
                The password will not be shown again.
              </p>
            </div>

            <div ref={credentialsContainerRef} className={styles.credentialsContainer}>
              <div className={styles.credentialField}>
                <label className={styles.credentialLabel}>Email (Login)</label>
                <div className={styles.credentialValue}>
                  <code className={styles.credentialCode}>{generatedCredentials.email}</code>
                </div>
              </div>

              <div className={styles.credentialField}>
                <label className={styles.credentialLabel}>Password</label>
                <div className={styles.credentialValue}>
                  <code className={styles.credentialCode}>{generatedCredentials.password}</code>
                </div>
              </div>
            </div>

            <div className={styles.credentialsActions}>
              <Button
                variant="outline"
                size="lg"
                onClick={copyCredentialsAsImage}
                className={styles.copyImageButton}
              >
                <Copy size={18} />
                Copy as Image
              </Button>
              <Button
                variant="primary"
                size="lg"
                onClick={handleCloseCredentials}
                className={styles.doneButton}
              >
                Done
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};
