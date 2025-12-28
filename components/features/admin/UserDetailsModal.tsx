"use client";

import React from "react";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { CheckCircle, XCircle, Clock } from "lucide-react";
import { User } from "./UsersTable";
import styles from "./UserDetailsModal.module.css";

interface UserDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

export const UserDetailsModal: React.FC<UserDetailsModalProps> = ({
  isOpen,
  onClose,
  user,
}) => {
  if (!user) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return (
          <Badge variant="success" className={styles.statusBadge}>
            <CheckCircle size={14} />
            Approved
          </Badge>
        );
      case "PENDING":
        return (
          <Badge variant="warning" className={styles.statusBadge}>
            <Clock size={14} />
            Pending
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge variant="error" className={styles.statusBadge}>
            <XCircle size={14} />
            Rejected
          </Badge>
        );
      default:
        return null;
    }
  };

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

  const formatRole = (role: string) => {
    return role.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`User Details: ${user.name}`}
      showCloseButton={true}
      closeOnBackdropClick={true}
      className={styles.modal}
    >
      <div className={styles.content}>
        {/* Basic Information Section */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Basic Information</h3>
          <div className={styles.grid}>
            <div className={styles.field}>
              <label className={styles.label}>Name</label>
              <div className={styles.value}>{user.name}</div>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Email</label>
              <div className={styles.value}>{user.email}</div>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Phone</label>
              <div className={styles.value}>{user.phone || "N/A"}</div>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Employee Number</label>
              <div className={styles.value}>{user.employeeNumber || "N/A"}</div>
            </div>
          </div>
        </section>

        {/* Employment Information Section */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Employment Information</h3>
          <div className={styles.grid}>
            <div className={styles.field}>
              <label className={styles.label}>Company</label>
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

        {/* Account Information Section */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Account Information</h3>
          <div className={styles.grid}>
            <div className={styles.field}>
              <label className={styles.label}>Role</label>
              <div className={styles.value}>
                <span className={styles.role}>{formatRole(user.role)}</span>
              </div>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Status</label>
              <div className={styles.value}>{getStatusBadge(user.status)}</div>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Account Created</label>
              <div className={styles.value}>{formatDate(user.createdAt)}</div>
            </div>
          </div>
        </section>
      </div>
    </Modal>
  );
};

