"use client";

import React, { useState } from "react";
import { X, Lock } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import styles from "./PasswordVerificationModal.module.css";

interface PasswordVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerify: (password: string, comment?: string) => Promise<void>;
  employeeName: string;
  isLoading?: boolean;
}

export const PasswordVerificationModal: React.FC<PasswordVerificationModalProps> = ({
  isOpen,
  onClose,
  onVerify,
  employeeName,
  isLoading = false,
}) => {
  const [password, setPassword] = useState("");
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!password.trim()) {
      setError("Password is required");
      return;
    }

    try {
      await onVerify(password, comment.trim() || undefined);
      // Reset form on success
      setPassword("");
      setComment("");
      setError("");
    } catch (err: any) {
      setError(err.message || "Password verification failed");
    }
  };

  const handleClose = () => {
    setPassword("");
    setComment("");
    setError("");
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Verify Password to Mark as Resigned"
      showCloseButton={true}
      closeOnBackdropClick={!isLoading}
      className={styles.modal}
    >
      <div className={styles.content}>
        <div className={styles.warning}>
          <Lock size={20} className={styles.lockIcon} />
          <p className={styles.warningText}>
            You are about to mark <strong>{employeeName}</strong> as resigned. This action requires password verification and will be subject to approval by Area Manager, Regional Manager, and Admin.
          </p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="password" className={styles.label}>
              Enter your password to confirm
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className={styles.input}
              disabled={isLoading}
              autoFocus
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="comment" className={styles.label}>
              Comment (Optional)
            </label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add any additional notes or reasons for this resignation request..."
              className={styles.textarea}
              disabled={isLoading}
              rows={4}
            />
          </div>

          {error && (
            <div className={styles.error}>
              <p className={styles.errorText}>{error}</p>
            </div>
          )}

          <div className={styles.actions}>
            <Button
              type="button"
              variant="secondary"
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
              disabled={isLoading || !password.trim()}
              className={styles.submitButton}
            >
              {isLoading ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

