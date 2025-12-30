"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Clock, CheckCircle, XCircle } from "lucide-react";
import { User } from "./UsersTable";
import toast from "react-hot-toast";
import styles from "./ApplicationPreviewModal.module.css";

interface ApplicationPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onApprove?: (userId: string) => Promise<void>;
  onReject?: (userId: string) => Promise<void>;
  onRefresh?: () => void;
  onStatsUpdate?: () => void;
}

export const ApplicationPreviewModal: React.FC<ApplicationPreviewModalProps> = ({
  isOpen,
  onClose,
  user,
  onApprove,
  onReject,
  onRefresh,
  onStatsUpdate,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  if (!user) return null;

  // Safety check: ensure user has required fields
  if (!user.id || !user.name || !user.email) {
    console.error("[ApplicationPreviewModal] Invalid user data:", user);
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Error"
        showCloseButton={true}
        closeOnBackdropClick={true}
      >
        <div style={{ padding: "var(--spacing-lg)" }}>
          <p>Unable to display application preview. User data is incomplete.</p>
        </div>
      </Modal>
    );
  }

  const formatDate = (date: Date | string | null) => {
    if (!date) return "N/A";
    try {
      return new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "N/A";
    }
  };

  const formatHireType = (hireType: "DIRECT_HIRE" | "AGENCY" | null) => {
    if (!hireType) return "N/A";
    return hireType.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const handleApprove = async () => {
    if (!onApprove || !user) return;
    
    setIsProcessing(true);
    try {
      await onApprove(user.id);
      // Toast and refresh are handled in the parent component
      onStatsUpdate?.(); // Update stats counter
      onClose();
    } catch (error) {
      console.error("Error approving user:", error);
      // Error toast is handled in the parent component
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!onReject || !user) return;
    
    if (
      !confirm(
        "Are you sure you want to reject this user? This action cannot be undone."
      )
    ) {
      return;
    }

    setIsProcessing(true);
    try {
      await onReject(user.id);
      // Toast and refresh are handled in the parent component
      onStatsUpdate?.(); // Update stats counter
      onClose();
    } catch (error) {
      console.error("Error rejecting user:", error);
      // Error toast is handled in the parent component
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Application Preview: ${user.name}`}
      showCloseButton={true}
      closeOnBackdropClick={true}
      className={styles.modal}
    >
      <div className={styles.content}>
        {/* Personal Information Section */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Personal Information</h3>
          <div className={styles.grid}>
            <div className={styles.field}>
              <label className={styles.label}>Full Name</label>
              <div className={styles.value}>{user.name}</div>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Email Address</label>
              <div className={styles.value}>{user.email}</div>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Phone Number</label>
              <div className={styles.value}>{user.phone || "N/A"}</div>
            </div>
          </div>
        </section>

        {/* Employee Details Section */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Employee Details</h3>
          <div className={styles.grid}>
            <div className={styles.field}>
              <label className={styles.label}>Employee Number</label>
              <div className={styles.value}>{user.employeeNumber || "N/A"}</div>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Hire Type</label>
              <div className={styles.value}>
                {formatHireType(user.hireType)}
              </div>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Company / Agency</label>
              <div className={styles.value}>
                {user.company?.name || "N/A"}
                {user.company?.type && (
                  <span className={styles.companyType}>
                    {" "}
                    ({user.company.type})
                  </span>
                )}
              </div>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Position</label>
              <div className={styles.value}>
                {user.position?.title || "N/A"}
              </div>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Department</label>
              <div className={styles.value}>{user.department || "N/A"}</div>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Branch</label>
              <div className={styles.value}>{user.branch || "N/A"}</div>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Hire Date</label>
              <div className={styles.value}>{formatDate(user.hireDate)}</div>
            </div>
          </div>
        </section>

        {/* Application Status Section */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Application Status</h3>
          <div className={styles.grid}>
            <div className={styles.field}>
              <label className={styles.label}>Status</label>
              <div className={styles.value}>
                <Badge variant="warning" className={styles.statusBadge}>
                  <Clock size={14} />
                  Pending Approval
                </Badge>
              </div>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Application Submitted</label>
              <div className={styles.value}>{formatDate(user.createdAt)}</div>
            </div>
          </div>
        </section>
      </div>

      {/* Action Buttons Footer */}
      {(onApprove || onReject) && (
        <div className={styles.actions}>
          {onReject && (
            <Button
              variant="outline"
              size="lg"
              onClick={handleReject}
              disabled={isProcessing}
              className={styles.rejectButton}
            >
              <XCircle size={18} />
              Reject
            </Button>
          )}
          {onApprove && (
            <Button
              variant="primary"
              size="lg"
              onClick={handleApprove}
              disabled={isProcessing}
              className={styles.approveButton}
            >
              <CheckCircle size={18} />
              Approve
            </Button>
          )}
        </div>
      )}
    </Modal>
  );
};

