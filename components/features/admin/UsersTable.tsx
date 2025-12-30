"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Edit, Trash2, CheckCircle, XCircle, Clock, Plus, Eye, FileText, MoreVertical, Key } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { UserDetailsModal } from "./UserDetailsModal";
import { ApplicationPreviewModal } from "./ApplicationPreviewModal";
import { UserTableContextMenu } from "./UserTableContextMenu";
import { TablePagination } from "./TablePagination";
import styles from "./UsersTable.module.css";

export interface User {
  id: string;
  name: string;
  email: string;
  employeeNumber: string | null;
  phone: string | null;
  hireType: "DIRECT_HIRE" | "AGENCY" | null;
  department: string | null;
  branch: string | null;
  hireDate: Date | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "RESIGNED";
  role: "SUPER_ADMIN" | "ADMIN" | "REGIONAL_MANAGER" | "AREA_MANAGER" | "BRANCH_MANAGER" | "EMPLOYEE" | "TRAINER" | null;
  createdAt: Date;
  company: {
    id: string;
    name: string;
    type: "COMPANY" | "AGENCY";
  } | null;
  position: {
    id: string;
    title: string;
    role: "SUPER_ADMIN" | "ADMIN" | "REGIONAL_MANAGER" | "AREA_MANAGER" | "BRANCH_MANAGER" | "EMPLOYEE" | "TRAINER";
  } | null;
}

interface UsersTableProps {
  initialUsers?: User[];
  statusFilter?: "PENDING" | "APPROVED" | "REJECTED" | "ALL";
  currentTab?: "ALL" | "PENDING" | "REJECTED";
  onRefresh?: () => void;
  onEdit?: (user: User) => void;
  onAdd?: () => void;
  onStatsUpdate?: () => void;
}

export const UsersTable: React.FC<UsersTableProps> = ({
  initialUsers = [],
  statusFilter = "ALL",
  currentTab = "ALL",
  onRefresh,
  onEdit,
  onAdd,
  onStatsUpdate,
}) => {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [isLoading, setIsLoading] = useState(false);
  const [processingUserId, setProcessingUserId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isApplicationPreviewModalOpen, setIsApplicationPreviewModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
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

  // Column resizing state - widths will be normalized to fill table width
  const [columnWidths, setColumnWidths] = useState<number[]>(() => {
    // Load from localStorage or use defaults
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("usersTableColumnWidths");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // Fall back to defaults
        }
      }
    }
    // Default widths in pixels (will be normalized to fill table width on mount)
    // These represent relative proportions that will scale to fit
    return [100, 140, 120, 140, 160, 110, 150, 50];
  });

  const [resizingColumn, setResizingColumn] = useState<number | null>(null);
  const [resizeStartX, setResizeStartX] = useState(0);
  const [resizeStartWidth, setResizeStartWidth] = useState(0);
  const tableRef = useRef<HTMLTableElement>(null);

  useEffect(() => {
    // Always fetch users when statusFilter changes to ensure correct filtering
    // Don't rely on initialUsers as they may not be filtered by the current status
    fetchUsers();
    // Reset to page 1 when status filter changes
    setCurrentPage(1);
  }, [statusFilter]);

  // Save column widths to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("usersTableColumnWidths", JSON.stringify(columnWidths));
    }
  }, [columnWidths]);

  // Normalize column widths when table is rendered to fit table width
  // This ensures columns expand to fill available table width
  useEffect(() => {
    const normalizeWidths = () => {
      if (tableRef.current) {
        const tableElement = tableRef.current;
        const tableWidth = tableElement.offsetWidth;
        
        if (tableWidth <= 0) return; // Table not yet rendered
        
        setColumnWidths((prev) => {
          const currentTotal = prev.reduce((sum, width) => sum + width, 0);
          const ACTIONS_COLUMN_INDEX = 7;
          const ACTIONS_MIN_WIDTH = 50;
          
          // If total is less than table width, scale up to fill space
          // If total exceeds table width, scale down proportionally
          if (currentTotal !== tableWidth && tableWidth > 0) {
            const scaleFactor = tableWidth / currentTotal;
            const scaledWidths = prev.map((width, index) => {
              const scaled = Math.floor(width * scaleFactor);
              // Actions column must be at least 50px
              return index === ACTIONS_COLUMN_INDEX 
                ? Math.max(ACTIONS_MIN_WIDTH, scaled)
                : Math.max(50, scaled);
            });
            
            // Recalculate if Actions column constraint affected the total
            const newTotal = scaledWidths.reduce((sum, width) => sum + width, 0);
            if (newTotal !== tableWidth && newTotal > 0) {
              // Adjust other columns to fill remaining space
              const actionsWidth = scaledWidths[ACTIONS_COLUMN_INDEX];
              const otherColumnsTotal = newTotal - actionsWidth;
              const availableWidth = tableWidth - actionsWidth;
              
              if (otherColumnsTotal > 0 && availableWidth > 0) {
                const otherScaleFactor = availableWidth / otherColumnsTotal;
                
                return scaledWidths.map((width, index) => 
                  index === ACTIONS_COLUMN_INDEX 
                    ? width 
                    : Math.max(50, Math.floor(width * otherScaleFactor))
                );
              }
            }
            
            return scaledWidths;
          }
          
          return prev;
        });
      }
    };

    // Normalize after a short delay to ensure table is rendered
    const timeoutId = setTimeout(normalizeWidths, 100);
    
    // Also normalize on window resize
    window.addEventListener('resize', normalizeWidths);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', normalizeWidths);
    };
  }, [users]); // Re-run when users change (table re-renders)

  // Column resizing handlers
  const handleResizeStart = useCallback((columnIndex: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingColumn(columnIndex);
    setResizeStartX(e.clientX);
    setResizeStartWidth(columnWidths[columnIndex]);
  }, [columnWidths]);

  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (resizingColumn === null || !tableRef.current) return;

    // Get table width (excluding padding/borders)
    const tableElement = tableRef.current;
    const tableWidth = tableElement.offsetWidth;
    
    // Minimum width for Actions column (index 7) - must fit the menu button
    const ACTIONS_COLUMN_INDEX = 7;
    const ACTIONS_MIN_WIDTH = 50; // Minimum width to display the menu button
    
    const diff = e.clientX - resizeStartX;
    const requestedWidth = resizeStartWidth + diff;
    
    setColumnWidths((prev) => {
      const newWidths = [...prev];
      const currentTotal = newWidths.reduce((sum, width) => sum + width, 0);
      const widthChange = requestedWidth - prev[resizingColumn];
      
      // If resizing Actions column itself, ensure it doesn't go below minimum
      if (resizingColumn === ACTIONS_COLUMN_INDEX) {
        newWidths[resizingColumn] = Math.max(ACTIONS_MIN_WIDTH, requestedWidth);
        // If Actions column grows, we need to shrink other columns to maintain total
        const newTotal = currentTotal + (newWidths[resizingColumn] - prev[resizingColumn]);
        if (newTotal > tableWidth) {
          // Shrink other columns proportionally
          const otherColumnsTotal = currentTotal - prev[ACTIONS_COLUMN_INDEX];
          const availableWidth = tableWidth - newWidths[ACTIONS_COLUMN_INDEX];
          const scaleFactor = availableWidth / otherColumnsTotal;
          
          newWidths.forEach((width, index) => {
            if (index !== ACTIONS_COLUMN_INDEX) {
              newWidths[index] = Math.max(50, Math.floor(width * scaleFactor));
            }
          });
        }
        return newWidths;
      }
      
      // When resizing other columns, ALWAYS reserve space for Actions column first
      // Calculate available width: table width minus Actions minimum
      const availableWidth = tableWidth - ACTIONS_MIN_WIDTH;
      const otherColumnsTotal = currentTotal - prev[ACTIONS_COLUMN_INDEX];
      
      // Calculate what the new total for other columns would be
      const newOtherColumnsTotal = otherColumnsTotal + widthChange;
      
      // If other columns would exceed available space, constrain the resize
      if (newOtherColumnsTotal > availableWidth) {
        // Calculate max allowed width for the resized column
        const maxAllowedWidth = prev[resizingColumn] + (availableWidth - otherColumnsTotal);
        newWidths[resizingColumn] = Math.max(50, Math.min(requestedWidth, maxAllowedWidth));
      } else {
        // Apply the change - there's enough space
        newWidths[resizingColumn] = Math.max(50, requestedWidth);
      }
      
      // ALWAYS set Actions column to minimum width (it's reserved space)
      newWidths[ACTIONS_COLUMN_INDEX] = ACTIONS_MIN_WIDTH;
      
      return newWidths;
    });
  }, [resizingColumn, resizeStartX, resizeStartWidth]);

  const handleResizeEnd = useCallback(() => {
    setResizingColumn(null);
  }, []);

  useEffect(() => {
    if (resizingColumn !== null) {
      document.addEventListener("mousemove", handleResizeMove);
      document.addEventListener("mouseup", handleResizeEnd);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";

      return () => {
        document.removeEventListener("mousemove", handleResizeMove);
        document.removeEventListener("mouseup", handleResizeEnd);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };
    }
  }, [resizingColumn, handleResizeMove, handleResizeEnd]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      // "ALL" statusFilter means show only APPROVED users
      if (statusFilter === "ALL") {
        params.append("status", "ALL"); // API will convert this to APPROVED
      } else if (statusFilter) {
        params.append("status", statusFilter);
      }

      const url = `/api/admin/users?${params.toString()}`;
      console.log("[UsersTable] Fetching users from:", url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error("[UsersTable] API error:", {
          status: response.status,
          statusText: response.statusText,
          url,
        });
        toast.error(`Failed to fetch users: ${response.status} ${response.statusText}`);
        return;
      }

      const data = await response.json();
      console.log("[UsersTable] API response:", {
        success: data.success,
        userCount: data.data?.length || 0,
        pagination: data.pagination,
      });

      if (data.success) {
        if (Array.isArray(data.data)) {
          setUsers(data.data);
          console.log("[UsersTable] Users set successfully:", data.data.length);
        } else {
          console.error("[UsersTable] Invalid data format - expected array, got:", typeof data.data);
          toast.error("Invalid response format from server");
        }
      } else {
        console.error("[UsersTable] API returned error:", data.error);
        toast.error(data.error || "Failed to fetch users");
      }
    } catch (error) {
      console.error("[UsersTable] Error fetching users:", {
        error,
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      toast.error("Failed to fetch users. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (userId: string) => {
    setProcessingUserId(userId);
    try {
      const response = await fetch(`/api/admin/users/${userId}/approve`, {
        method: "POST",
      });
      const data = await response.json();

      if (data.success) {
        toast.success("User approved successfully");
        fetchUsers();
        onRefresh?.();
        onStatsUpdate?.(); // Update stats counter
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
        fetchUsers();
        onRefresh?.();
        onStatsUpdate?.(); // Update stats counter
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

  const handleDelete = async (userId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this user? This action cannot be undone."
      )
    ) {
      return;
    }

    setProcessingUserId(userId);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (data.success) {
        toast.success("User deleted successfully");
        fetchUsers();
        onRefresh?.();
      } else {
        toast.error(data.error || "Failed to delete user");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Failed to delete user");
    } finally {
      setProcessingUserId(null);
    }
  };

  const handleResetPassword = async (userId: string) => {
    if (
      !confirm(
        "Are you sure you want to reset this user's password? The new password will be shown to you."
      )
    ) {
      return;
    }

    setProcessingUserId(userId);
    try {
      const response = await fetch(`/api/admin/users/${userId}/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();

      if (data.success) {
        // Show success toast with password
        toast.success(
          (t) => (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div>Password reset successfully!</div>
              <div style={{ fontSize: "0.875rem", marginTop: "4px" }}>
                New password: <strong>{data.password}</strong>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(data.password);
                  toast.success("Password copied to clipboard!");
                }}
                style={{
                  marginTop: "8px",
                  padding: "4px 8px",
                  background: "var(--color-primary-purple)",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "0.75rem",
                }}
              >
                Copy Password
              </button>
            </div>
          ),
          {
            duration: 10000, // Show for 10 seconds to allow copying
          }
        );
        fetchUsers();
        onRefresh?.();
      } else {
        toast.error(data.error || "Failed to reset password");
      }
    } catch (error) {
      console.error("Error resetting password:", error);
      toast.error("Failed to reset password");
    } finally {
      setProcessingUserId(null);
    }
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

  const buttonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const handleMenuButtonClick = (e: React.MouseEvent<HTMLButtonElement>, user: User) => {
    e.preventDefault();
    e.stopPropagation();
    
    const buttonElement = e.currentTarget;
    // Store button ref for positioning
    buttonRefs.current.set(user.id, buttonElement);
    
    // Calculate position immediately
    const rect = buttonElement.getBoundingClientRect();
    
    // Position menu to the right of the button, aligned with the top
    // getBoundingClientRect() returns viewport coordinates, perfect for position: fixed
    setContextMenu({
      isOpen: true,
      x: rect.right, // Right edge of button element (viewport coordinate)
      y: rect.top, // Top edge of button element (viewport coordinate)
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

  const getEmployeeStatus = (status: string) => {
    if (status === "APPROVED") return "Employed";
    if (status === "RESIGNED") return "Resigned";
    return status; // PENDING, REJECTED, etc.
  };

  const formatHireType = (hireType: "DIRECT_HIRE" | "AGENCY" | null) => {
    if (!hireType) return "N/A";
    return hireType === "DIRECT_HIRE" ? "Direct Hire" : "Agency";
  };

  const getContextMenuOptions = (user: User) => {
    const options = [];

    // Preview option
    if (currentTab === "PENDING") {
      options.push({
        label: "Application Preview",
        icon: <FileText size={16} />,
        onClick: () => handleViewApplication(user),
      });
    } else if (currentTab === "ALL") {
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

    // Reset Password option
    options.push({
      label: "Reset Password",
      icon: <Key size={16} />,
      onClick: () => handleResetPassword(user.id),
    });

    // Approve/Reject options for pending users
    if (user.status === "PENDING") {
      options.push({
        label: "Approve",
        icon: <CheckCircle size={16} />,
        onClick: () => handleApprove(user.id),
      });
      options.push({
        label: "Reject",
        icon: <XCircle size={16} />,
        onClick: () => handleReject(user.id),
        variant: "danger" as const,
      });
    }

    // Delete option
    options.push({
      label: "Delete",
      icon: <Trash2 size={16} />,
      onClick: () => handleDelete(user.id),
      variant: "danger" as const,
    });

    return options;
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
    // For other statuses, show as plain text
    return <span className={styles.employeeStatus}>{getEmployeeStatus(status)}</span>;
  };

  const getRoleBadge = (role: string | null | undefined) => {
    if (!role) return null;
    
    const roleColors: Record<string, string> = {
      SUPER_ADMIN: "var(--color-primary-purple)",
      ADMIN: "var(--color-primary-indigo)",
      BRANCH_MANAGER: "var(--color-accent-cyan)",
      EMPLOYEE: "var(--color-text-secondary)",
    };

    return (
      <span
        className={styles.roleBadge}
        style={{ color: roleColors[role] || roleColors.EMPLOYEE }}
      >
        {role.replace("_", " ")}
      </span>
    );
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "N/A";
    try {
      return new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "N/A";
    }
  };

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <p>Loading users...</p>
      </div>
    );
  }

  // Calculate pagination
  const totalPages = Math.ceil(users.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = users.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of table when page changes
    const tableWrapper = document.querySelector(`.${styles.tableWrapper}`);
    if (tableWrapper) {
      tableWrapper.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  if (users.length === 0) {
    // Tab-specific empty state messages
    let emptyMessage = "No users found.";
    if (currentTab === "PENDING") {
      emptyMessage = "No pending users at this time.";
    } else if (currentTab === "REJECTED") {
      emptyMessage = "No rejected users at this time.";
    } else if (currentTab === "ALL") {
      emptyMessage = "No approved users found.";
    }

    return (
      <div className={styles.empty}>
        <p>{emptyMessage}</p>
        {onAdd && (
          <Button variant="primary" size="lg" onClick={onAdd} className={styles.addButton}>
            <Plus size={20} />
            Add Trainer
          </Button>
        )}
      </div>
    );
  }

  const columns = [
    { label: "USID", index: 0 },
    { label: "Name", index: 1 },
    { label: "Employee ID", index: 2 },
    { label: "Branch", index: 3 },
    { label: "Position", index: 4 },
    { label: "Hire Type", index: 5 },
    { label: "Employee Status", index: 6 },
    { label: "", index: 7 }, // Actions column (empty header)
  ];

  return (
    <>
      <div className={styles.tableWrapper}>
        <table className={styles.table} ref={tableRef}>
          <thead>
            <tr>
              {columns.map((col, idx) => {
                const isActionsColumn = col.index === 7;
                const actionsMinWidth = 50;
                const width = isActionsColumn ? Math.max(actionsMinWidth, columnWidths[col.index]) : columnWidths[col.index];
                return (
                  <th
                    key={col.index}
                    style={{ 
                      width: `${width}px`, 
                      minWidth: isActionsColumn ? `${actionsMinWidth}px` : `${columnWidths[col.index]}px`, 
                      maxWidth: `${width}px` 
                    }}
                    className={styles.resizableHeader}
                  >
                    <div className={styles.headerContent}>{col.label}</div>
                    {idx < columns.length - 1 && (
                      <div
                        className={styles.resizeHandle}
                        onMouseDown={(e) => handleResizeStart(col.index, e)}
                      />
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {paginatedUsers.map((user) => (
              <tr
                key={user.id}
                className={styles.tableRow}
              >
                <td style={{ width: `${columnWidths[0]}px`, minWidth: `${columnWidths[0]}px`, maxWidth: `${columnWidths[0]}px` }}>
                  <span className={styles.usid}>{user.id.substring(0, 8)}...</span>
                </td>
                <td style={{ width: `${columnWidths[1]}px`, minWidth: `${columnWidths[1]}px`, maxWidth: `${columnWidths[1]}px` }}>
                  <div className={styles.nameCell}>
                    <span className={styles.name}>
                      {user.name}
                    </span>
                  </div>
                </td>
                <td style={{ width: `${columnWidths[2]}px`, minWidth: `${columnWidths[2]}px`, maxWidth: `${columnWidths[2]}px` }}>
                  <span className={styles.employeeNumber}>
                    {user.employeeNumber || "N/A"}
                  </span>
                </td>
                <td style={{ width: `${columnWidths[3]}px`, minWidth: `${columnWidths[3]}px`, maxWidth: `${columnWidths[3]}px` }}>
                  <span className={styles.branch}>{user.branch || "N/A"}</span>
                </td>
                <td style={{ width: `${columnWidths[4]}px`, minWidth: `${columnWidths[4]}px`, maxWidth: `${columnWidths[4]}px` }}>
                  <span className={styles.position}>
                    {user.position?.title || ""}
                  </span>
                </td>
                <td style={{ width: `${columnWidths[5]}px`, minWidth: `${columnWidths[5]}px`, maxWidth: `${columnWidths[5]}px` }}>
                  <span className={styles.hireType}>
                    {formatHireType(user.hireType)}
                  </span>
                </td>
                <td style={{ width: `${columnWidths[6]}px`, minWidth: `${columnWidths[6]}px`, maxWidth: `${columnWidths[6]}px` }}>
                  {getEmployeeStatusBadge(user.status)}
                </td>
                <td style={{ width: `${Math.max(50, columnWidths[7])}px`, minWidth: '50px', maxWidth: `${Math.max(50, columnWidths[7])}px` }}>
                  <button
                    className={styles.menuButton}
                    onClick={(e) => handleMenuButtonClick(e, user)}
                    aria-label="Open menu"
                    title="Open menu"
                  >
                    <MoreVertical size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={users.length}
        itemsPerPage={itemsPerPage}
        onPageChange={handlePageChange}
      />

      {/* Context Menu */}
      {contextMenu.user && (
        <UserTableContextMenu
          key={`${contextMenu.user.id}-${contextMenu.x}-${contextMenu.y}`}
          isOpen={contextMenu.isOpen}
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={handleCloseContextMenu}
          options={getContextMenuOptions(contextMenu.user)}
        />
      )}

      {/* User Details Modal - for approved users in "All Users" tab */}
      <UserDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={handleCloseDetailsModal}
        user={selectedUser}
      />

      {/* Application Preview Modal - for pending users in "Pending" tab */}
      <ApplicationPreviewModal
        isOpen={isApplicationPreviewModalOpen}
        onClose={handleCloseApplicationPreviewModal}
        user={selectedUser}
          onApprove={handleApprove}
          onReject={handleReject}
          onRefresh={onRefresh}
          onStatsUpdate={onStatsUpdate}
      />
    </>
  );
};

