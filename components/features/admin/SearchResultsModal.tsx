"use client";

import React, { useState } from "react";
import { X, Edit, Trash2, CheckCircle, XCircle, Eye, FileText } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { UserTableContextMenu } from "./UserTableContextMenu";
import { UserDetailsModal } from "./UserDetailsModal";
import { ApplicationPreviewModal } from "./ApplicationPreviewModal";
import { User } from "./UsersTable";
import styles from "./SearchResultsModal.module.css";

interface SearchResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  searchQuery: string;
  resultCount: number;
  onRefresh?: () => void;
  onEdit?: (user: User) => void;
  onApprove?: (userId: string) => void;
  onReject?: (userId: string) => void;
  onDelete?: (userId: string) => void;
}

export const SearchResultsModal: React.FC<SearchResultsModalProps> = ({
  isOpen,
  onClose,
  users,
  searchQuery,
  resultCount,
  onRefresh,
  onEdit,
  onApprove,
  onReject,
  onDelete,
}) => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isApplicationPreviewModalOpen, setIsApplicationPreviewModalOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
    user: User | null;
  }>({
    isOpen: false,
    x: 0,
    y: 0,
    user: null,
  });

  // Handle escape key - MUST be before early return (Rules of Hooks)
  React.useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open - MUST be before early return (Rules of Hooks)
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRowRightClick = (e: React.MouseEvent<HTMLTableRowElement>, user: User) => {
    e.preventDefault();
    setContextMenu({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
      user,
    });
  };

  const handleCloseContextMenu = () => {
    setContextMenu({
      isOpen: false,
      x: 0,
      y: 0,
      user: null,
    });
  };

  const handleViewDetails = (user: User) => {
    setSelectedUser(user);
    setIsDetailsModalOpen(true);
  };

  const handleCloseDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedUser(null);
  };

  const handleViewApplication = (user: User) => {
    setSelectedUser(user);
    setIsApplicationPreviewModalOpen(true);
  };

  const handleCloseApplicationPreviewModal = () => {
    setIsApplicationPreviewModalOpen(false);
    setSelectedUser(null);
  };

  const getEmployeeStatusBadge = (status: string) => {
    if (status === "APPROVED") {
      return (
        <Badge variant="success" className={styles.statusBadge}>
          <CheckCircle size={12} />
          Employed
        </Badge>
      );
    }
    if (status === "RESIGNED") {
      return (
        <Badge variant="error" className={styles.statusBadge}>
          <XCircle size={12} />
          Resigned
        </Badge>
      );
    }
    return <span className={styles.employeeStatus}>{status}</span>;
  };

  const formatHireType = (hireType: "DIRECT_HIRE" | "AGENCY" | null) => {
    if (!hireType) return "";
    return hireType === "DIRECT_HIRE" ? "Direct Hire" : "Agency";
  };

  const getContextMenuOptions = (user: User) => {
    const options = [];

    // Preview option based on status
    if (user.status === "PENDING") {
      options.push({
        label: "Application Preview",
        icon: <FileText size={16} />,
        onClick: () => handleViewApplication(user),
      });
    } else {
      options.push({
        label: "Employee Details",
        icon: <Eye size={16} />,
        onClick: () => handleViewDetails(user),
      });
    }

    // Edit option
    if (onEdit) {
      options.push({
        label: "Edit",
        icon: <Edit size={16} />,
        onClick: () => onEdit(user),
      });
    }

    // Approve/Reject options for pending users
    if (user.status === "PENDING" && onApprove && onReject) {
      options.push({
        label: "Approve",
        icon: <CheckCircle size={16} />,
        onClick: () => onApprove(user.id),
      });
      options.push({
        label: "Reject",
        icon: <XCircle size={16} />,
        onClick: () => onReject(user.id),
        variant: "danger" as const,
      });
    }

    // Delete option
    if (onDelete) {
      options.push({
        label: "Delete",
        icon: <Trash2 size={16} />,
        onClick: () => onDelete(user.id),
        variant: "danger" as const,
      });
    }

    return options;
  };

  return (
    <>
      <div className={styles.backdrop} onClick={onClose}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.headerContent}>
              <h2 className={styles.title}>Search Results</h2>
              <div className={styles.searchInfo}>
                <span className={styles.query}>"{searchQuery}"</span>
                <span className={styles.count}>{resultCount} result{resultCount !== 1 ? "s" : ""}</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className={styles.closeButton}
              aria-label="Close modal"
            >
              <X size={20} />
            </Button>
          </div>

          {/* Content */}
          <div className={styles.content}>
            {users.length === 0 ? (
              <div className={styles.empty}>
                <p>No users found matching your search.</p>
              </div>
            ) : (
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>USID</th>
                      <th>Name</th>
                      <th>Employee ID</th>
                      <th>Branch</th>
                      <th>Position</th>
                      <th>Hire Type</th>
                      <th>Employee Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr
                        key={user.id}
                        onContextMenu={(e) => handleRowRightClick(e, user)}
                        className={styles.tableRow}
                      >
                        <td>
                          <span className={styles.usid}>{user.id.substring(0, 8)}...</span>
                        </td>
                        <td>
                          <div className={styles.nameCell}>
                            <span className={styles.name}>{user.name}</span>
                          </div>
                        </td>
                        <td>
                          <span className={styles.employeeNumber}>
                            {user.employeeNumber || ""}
                          </span>
                        </td>
                        <td>
                          <span className={styles.branch}>{user.branch || ""}</span>
                        </td>
                        <td>
                          <span className={styles.position}>
                            {user.position?.title || ""}
                          </span>
                        </td>
                        <td>
                          <span className={styles.hireType}>
                            {formatHireType(user.hireType)}
                          </span>
                        </td>
                        <td>{getEmployeeStatusBadge(user.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className={styles.footer}>
            <Button variant="secondary" size="lg" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu.user && (
        <UserTableContextMenu
          isOpen={contextMenu.isOpen}
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={handleCloseContextMenu}
          options={getContextMenuOptions(contextMenu.user)}
        />
      )}

      {/* User Details Modal */}
      <UserDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={handleCloseDetailsModal}
        user={selectedUser}
      />

      {/* Application Preview Modal */}
      <ApplicationPreviewModal
        isOpen={isApplicationPreviewModalOpen}
        onClose={handleCloseApplicationPreviewModal}
        user={selectedUser}
      />
    </>
  );
};

