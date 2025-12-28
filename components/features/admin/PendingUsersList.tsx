"use client";

import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { UserCard } from "./UserCard";
import styles from "./PendingUsersList.module.css";

export interface PendingUser {
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
}

export interface PendingUsersListProps {
  initialUsers?: PendingUser[];
}

export const PendingUsersList: React.FC<PendingUsersListProps> = ({
  initialUsers = [],
}) => {
  const [users, setUsers] = useState<PendingUser[]>(initialUsers);
  const [isLoading, setIsLoading] = useState(false);
  const [processingUserId, setProcessingUserId] = useState<string | null>(
    null
  );

  const fetchPendingUsers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/users/pending");
      const data = await response.json();

      if (data.success) {
        setUsers(data.data);
      } else {
        toast.error(data.error || "Failed to fetch pending users");
      }
    } catch (error) {
      console.error("Error fetching pending users:", error);
      toast.error("Failed to fetch pending users");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialUsers.length === 0) {
      fetchPendingUsers();
    }
  }, []);

  const handleApprove = async (userId: string) => {
    setProcessingUserId(userId);
    try {
      const response = await fetch(`/api/admin/users/${userId}/approve`, {
        method: "POST",
      });
      const data = await response.json();

      if (data.success) {
        toast.success("User approved successfully");
        // Remove user from list (they're no longer pending)
        setUsers(users.filter((user) => user.id !== userId));
      } else {
        toast.error(data.error || "Failed to approve user");
      }
    } catch (error) {
      console.error("Error approving user:", error);
      toast.error("Failed to approve user");
    } finally {
      setProcessingUserId(null);
    }
  };

  const handleReject = async (userId: string) => {
    if (
      !confirm(
        "Are you sure you want to reject this user? This action cannot be undone."
      )
    ) {
      return;
    }

    setProcessingUserId(userId);
    try {
      const response = await fetch(`/api/admin/users/${userId}/reject`, {
        method: "POST",
      });
      const data = await response.json();

      if (data.success) {
        toast.success("User rejected successfully");
        // Remove user from list (they're no longer pending)
        setUsers(users.filter((user) => user.id !== userId));
      } else {
        toast.error(data.error || "Failed to reject user");
      }
    } catch (error) {
      console.error("Error rejecting user:", error);
      toast.error("Failed to reject user");
    } finally {
      setProcessingUserId(null);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <p>Loading pending users...</p>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No pending users at this time.</p>
      </div>
    );
  }

  return (
    <div className={styles.list}>
      {users.map((user) => (
        <UserCard
          key={user.id}
          user={user}
          onApprove={handleApprove}
          onReject={handleReject}
          isProcessing={processingUserId === user.id}
        />
      ))}
    </div>
  );
};

