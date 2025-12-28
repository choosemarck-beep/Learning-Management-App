"use client";

import React, { useState, useRef } from "react";
import { Copy } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import toast from "react-hot-toast";
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
  const [formData, setFormData] = useState({
    name: "",
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

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email address";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/users/create-trainer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          employeeNumber: formData.employeeNumber.trim() || undefined,
          phone: formData.phone.trim() || undefined,
          companyId: formData.companyId || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Show credentials modal instead of closing
        setGeneratedCredentials({
          email: formData.email.trim().toLowerCase(),
          password: data.password,
        });
        toast.success("Trainer created successfully! Please copy the credentials.");
      } else {
        toast.error(data.error || "Failed to create trainer");
        if (data.details) {
          // Handle validation errors
          const validationErrors: Record<string, string> = {};
          data.details.forEach((err: any) => {
            if (err.path && err.path.length > 0) {
              validationErrors[err.path[0]] = err.message;
            }
          });
          setErrors(validationErrors);
        }
      }
    } catch (error) {
      console.error("Error creating trainer:", error);
      toast.error("Failed to create trainer. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setFormData({
        name: "",
        email: "",
        employeeNumber: "",
        phone: "",
        companyId: "",
      });
      setErrors({});
      setGeneratedCredentials(null);
      onClose();
    }
  };

  const handleCloseCredentials = () => {
    setGeneratedCredentials(null);
      setFormData({
        name: "",
        email: "",
        employeeNumber: "",
        phone: "",
        companyId: "",
      });
    setErrors({});
    onClose();
    onSuccess?.();
  };

  const copyCredentialsAsImage = async () => {
    if (!credentialsContainerRef.current) {
      toast.error("Failed to capture credentials");
      return;
    }

    try {
      // Dynamically import html2canvas (lazy load)
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
        scale: 2, // Higher quality
        logging: false,
        useCORS: true,
      });

      // Convert canvas to blob
      canvas.toBlob(async (blob) => {
        if (!blob) {
          toast.error("Failed to create image");
          return;
        }

        try {
          // Copy image to clipboard
          await navigator.clipboard.write([
            new ClipboardItem({
              [blob.type]: blob,
            }),
          ]);
          toast.success("Credentials copied as image! You can paste it anywhere.");
        } catch (error) {
          console.error("Error copying image:", error);
          // Fallback: download the image
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `trainer-credentials-${generatedCredentials?.email}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          toast.success("Image downloaded! You can send this file to the trainer.");
        }
      }, "image/png");
    } catch (error) {
      console.error("Error capturing credentials:", error);
      toast.error("Failed to copy credentials. Please try again.");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create Trainer Account"
      showCloseButton={true}
      closeOnBackdropClick={!isLoading}
      className={styles.modal}
    >
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <Input
            label="Full Name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
            required
            disabled={isLoading}
          />
        </div>

        <div className={styles.formGroup}>
          <Input
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            required
            disabled={isLoading}
          />
        </div>

        <div className={styles.formGroup}>
          <Input
            label="Employee Number (Optional)"
            name="employeeNumber"
            type="text"
            value={formData.employeeNumber}
            onChange={handleChange}
            error={errors.employeeNumber}
            disabled={isLoading}
          />
        </div>

        <div className={styles.formGroup}>
          <Input
            label="Phone (Optional)"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleChange}
            error={errors.phone}
            disabled={isLoading}
          />
        </div>

        {companies.length > 0 && (
          <div className={styles.formGroup}>
            <Select
              label="Company (Optional)"
              name="companyId"
              value={formData.companyId}
              onChange={handleChange}
              error={errors.companyId}
              disabled={isLoading}
            >
              <option value="">Select a company</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </Select>
          </div>
        )}


        <div className={styles.actions}>
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
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            className={styles.submitButton}
          >
            Create Trainer
          </Button>
        </div>
      </form>

      {/* Credentials Display Modal */}
      {generatedCredentials && (
        <Modal
          isOpen={true}
          onClose={handleCloseCredentials}
          title="Trainer Credentials"
          showCloseButton={false}
          className={styles.credentialsModal}
        >
          <div className={styles.credentialsContent}>
            <div ref={credentialsContainerRef} className={styles.credentialsContainer}>
              <p className={styles.credentialsWarning}>
                Please copy these credentials. The password will not be shown again.
              </p>

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
    </Modal>
  );
};

