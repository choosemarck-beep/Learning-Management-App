"use client";

import React from "react";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import styles from "./UserCard.module.css";

export interface UserCardProps {
  user: {
    id: string;
    name: string;
    email: string;
    employeeNumber: string | null;
    phone: string | null;
    department: string | null;
    branch: string | null;
    hireDate: Date | null;
    status: "PENDING" | "APPROVED" | "REJECTED";
    role: "SUPER_ADMIN" | "ADMIN" | "BRANCH_MANAGER" | "EMPLOYEE";
    createdAt: Date;
    company: {
      id: string;
      name: string;
      type: "COMPANY" | "AGENCY";
    } | null;
    position: {
      id: string;
      title: string;
      role: "SUPER_ADMIN" | "ADMIN" | "BRANCH_MANAGER" | "EMPLOYEE";
    } | null;
  };
  onApprove: (userId: string) => void;
  onReject: (userId: string) => void;
  isProcessing?: boolean;
}

export const UserCard: React.FC<UserCardProps> = ({
  user,
  onApprove,
  onReject,
  isProcessing = false,
}) => {
  const formatDate = (date: Date | null): string => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusBadgeVariant = () => {
    switch (user.status) {
      case "APPROVED":
        return "success";
      case "REJECTED":
        return "error";
      case "PENDING":
      default:
        return "warning";
    }
  };

  return (
    <Card className={styles.card}>
      <CardHeader>
        <div className={styles.header}>
          <div className={styles.userInfo}>
            <h3 className={styles.name}>{user.name}</h3>
            <p className={styles.email}>{user.email}</p>
          </div>
          <Badge variant={getStatusBadgeVariant()}>{user.status}</Badge>
        </div>
      </CardHeader>
      <CardBody>
        <div className={styles.details}>
          <div className={styles.detailRow}>
            <span className={styles.label}>Employee Number:</span>
            <span className={styles.value}>{user.employeeNumber || "N/A"}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.label}>Role:</span>
            <span className={styles.value}>{user.role}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.label}>Company:</span>
            <span className={styles.value}>
              {user.company?.name || "N/A"}
            </span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.label}>Position:</span>
            <span className={styles.value}>
              {user.position?.title || "N/A"}
            </span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.label}>Department:</span>
            <span className={styles.value}>{user.department || "N/A"}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.label}>Branch:</span>
            <span className={styles.value}>{user.branch || "N/A"}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.label}>Hire Date:</span>
            <span className={styles.value}>{formatDate(user.hireDate)}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.label}>Registered:</span>
            <span className={styles.value}>
              {formatDate(user.createdAt)}
            </span>
          </div>
        </div>

        {user.status === "PENDING" && (
          <div className={styles.actions}>
            <Button
              variant="primary"
              size="md"
              onClick={() => onApprove(user.id)}
              disabled={isProcessing}
            >
              Approve
            </Button>
            <Button
              variant="outline"
              size="md"
              onClick={() => onReject(user.id)}
              disabled={isProcessing}
            >
              Reject
            </Button>
          </div>
        )}
      </CardBody>
    </Card>
  );
};

