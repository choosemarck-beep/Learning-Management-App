"use client";

import React, { useState } from "react";
import { Lock } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import toast from "react-hot-toast";
import styles from "./AdminPasswordVerification.module.css";

interface AdminPasswordVerificationProps {
  isOpen: boolean;
  onClose: () => void;
  onVerify: (password: string) => Promise<void>;
  action: string; // e.g., "edit this course", "delete this training", "publish this course"
  isLoading?: boolean;
  passwordType?: "admin" | "trainer"; // Type of password to verify
}

export const AdminPasswordVerification: React.FC<AdminPasswordVerificationProps> = ({
  isOpen,
  onClose,
  onVerify,
  action,
  isLoading = false,
  passwordType = "admin",
}) => {
  const userType = passwordType === "trainer" ? "trainer" : "admin";
  const userTypeCapitalized = passwordType === "trainer" ? "Trainer" : "Admin";
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!password.trim()) {
      setError("Password is required");
      return;
    }

    try {
      await onVerify(password);
      // Reset form on success
      setPassword("");
      setError("");
    } catch (err: any) {
      const errorMessage = err.message || "Password verification failed";
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleClose = () => {
    setPassword("");
    setError("");
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`${userTypeCapitalized} Password Required`}
      showCloseButton={false}
      closeOnBackdropClick={!isLoading}
      className={styles.modal}
    >
      <div className={styles.content}>
        <div className={styles.warning}>
          <Lock size={18} className={styles.lockIcon} />
          <p className={styles.warningText}>
            You need to verify your {userType} password to <strong>{action}</strong>.
          </p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <Input
              type="password"
              label={`Enter your ${userType} password`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              error={error}
              disabled={isLoading}
              autoFocus
            />
          </div>

          <div className={styles.actions}>
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={isLoading || !password.trim()}
              isLoading={isLoading}
            >
              Verify & Continue
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

