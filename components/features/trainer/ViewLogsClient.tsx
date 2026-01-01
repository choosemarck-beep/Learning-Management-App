"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Activity, Calendar, User, FileText, Search, Filter } from "lucide-react";
import toast from "react-hot-toast";
import styles from "./ViewLogsClient.module.css";

interface ActivityLog {
  id: string;
  type: string;
  description: string;
  metadata: string | null;
  targetId: string | null;
  targetType: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

type RoleFilter = "all" | "EMPLOYEE" | "TRAINER" | "ADMIN" | "SUPER_ADMIN";
type TypeFilter = "all" | "TRAINING_CREATED" | "TRAINING_UPDATED" | "TRAINING_DELETED" | "USER_CREATED" | "USER_UPDATED" | "USER_DELETED" | "USER_APPROVED" | "USER_REJECTED";

export const ViewLogsClient: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [activeTab, setActiveTab] = useState<"all" | "employees" | "trainers" | "admins">("all");

  const limit = 50;

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        role: roleFilter,
        type: typeFilter,
        limit: limit.toString(),
        offset: ((currentPage - 1) * limit).toString(),
      });

      const response = await fetch(`/api/trainer/activity-logs?${params}`);
      const data = await response.json();

      if (data.success) {
        setLogs(data.data.logs);
        setTotalLogs(data.data.total);
      } else {
        toast.error(data.error || "Failed to load activity logs");
      }
    } catch (error) {
      console.error("Error fetching activity logs:", error);
      toast.error("Failed to load activity logs");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleFilter, typeFilter, currentPage]);

  // Group logs by role
  const groupedLogs = useMemo(() => {
    const groups = {
      employees: [] as ActivityLog[],
      trainers: [] as ActivityLog[],
      admins: [] as ActivityLog[],
      all: logs,
    };

    logs.forEach((log) => {
      if (log.user.role === "EMPLOYEE" || log.user.role === "BRANCH_MANAGER" || log.user.role === "AREA_MANAGER" || log.user.role === "REGIONAL_MANAGER") {
        groups.employees.push(log);
      } else if (log.user.role === "TRAINER") {
        groups.trainers.push(log);
      } else if (log.user.role === "ADMIN" || log.user.role === "SUPER_ADMIN") {
        groups.admins.push(log);
      }
    });

    return groups;
  }, [logs]);

  // Filter logs based on active tab and search query
  const filteredLogs = useMemo(() => {
    let logsToShow: ActivityLog[] = [];
    
    // Select logs based on active tab
    if (activeTab === "all") {
      logsToShow = logs;
    } else if (activeTab === "employees") {
      logsToShow = groupedLogs.employees;
    } else if (activeTab === "trainers") {
      logsToShow = groupedLogs.trainers;
    } else if (activeTab === "admins") {
      logsToShow = groupedLogs.admins;
    }

    // Apply search filter if query exists
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      logsToShow = logsToShow.filter(
        (log) =>
          log.description.toLowerCase().includes(query) ||
          log.user.name.toLowerCase().includes(query) ||
          log.user.email.toLowerCase().includes(query) ||
          log.type.toLowerCase().includes(query)
      );
    }

    return logsToShow;
  }, [logs, activeTab, groupedLogs, searchQuery]);

  const getActivityIcon = (type: string) => {
    if (type.includes("TRAINING")) {
      return <FileText size={16} />;
    }
    if (type.includes("USER")) {
      return <User size={16} />;
    }
    return <Activity size={16} />;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getRoleBadgeClass = (role: string) => {
    if (role === "EMPLOYEE" || role === "BRANCH_MANAGER" || role === "AREA_MANAGER" || role === "REGIONAL_MANAGER") {
      return styles.roleBadgeEmployee;
    }
    if (role === "TRAINER") {
      return styles.roleBadgeTrainer;
    }
    if (role === "ADMIN" || role === "SUPER_ADMIN") {
      return styles.roleBadgeAdmin;
    }
    return styles.roleBadge;
  };

  const formatRoleName = (role: string) => {
    return role.replace(/_/g, " ");
  };

  const parseMetadata = (metadata: string | null) => {
    if (!metadata) return null;
    try {
      return JSON.parse(metadata);
    } catch {
      return null;
    }
  };

  const totalPages = Math.ceil(totalLogs / limit);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>View Logs</h1>
          <p className={styles.subtitle}>
            View all system activity logs organized by role
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filtersSection}>
        <div className={styles.searchBar}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search by user, description, or activity type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.filterControls}>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>
              <Filter size={16} />
              Role
            </label>
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value as RoleFilter);
                setCurrentPage(1);
              }}
              className={styles.filterSelect}
            >
              <option value="all">All Roles</option>
              <option value="EMPLOYEE">Employees</option>
              <option value="TRAINER">Trainers</option>
              <option value="ADMIN">Admins</option>
              <option value="SUPER_ADMIN">Super Admins</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>
              <Filter size={16} />
              Activity Type
            </label>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value as TypeFilter);
                setCurrentPage(1);
              }}
              className={styles.filterSelect}
            >
              <option value="all">All Activities</option>
              <option value="TRAINING_CREATED">Training Created</option>
              <option value="TRAINING_UPDATED">Training Updated</option>
              <option value="TRAINING_DELETED">Training Deleted</option>
              <option value="USER_CREATED">User Created</option>
              <option value="USER_UPDATED">User Updated</option>
              <option value="USER_DELETED">User Deleted</option>
              <option value="USER_APPROVED">User Approved</option>
              <option value="USER_REJECTED">User Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Role Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === "all" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("all")}
        >
          All ({logs.length})
        </button>
        <button
          className={`${styles.tab} ${activeTab === "employees" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("employees")}
        >
          Employees ({groupedLogs.employees.length})
        </button>
        <button
          className={`${styles.tab} ${activeTab === "trainers" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("trainers")}
        >
          Trainers ({groupedLogs.trainers.length})
        </button>
        <button
          className={`${styles.tab} ${activeTab === "admins" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("admins")}
        >
          Admins ({groupedLogs.admins.length})
        </button>
      </div>

      {/* Logs Display */}
      {isLoading ? (
        <div className={styles.loading}>
          <p>Loading activity logs...</p>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No activity logs found.</p>
        </div>
      ) : (
        <>
          <div className={styles.logsList}>
            {filteredLogs.map((log) => {
              const metadata = parseMetadata(log.metadata);
              return (
                <div key={log.id} className={styles.logItem}>
                  <div className={styles.logIcon}>
                    {getActivityIcon(log.type)}
                  </div>
                  <div className={styles.logContent}>
                    <div className={styles.logHeader}>
                      <div className={styles.logHeaderLeft}>
                        <span className={styles.logType}>
                          {log.type.replace(/_/g, " ")}
                        </span>
                        <span className={getRoleBadgeClass(log.user.role)}>
                          {formatRoleName(log.user.role)}
                        </span>
                      </div>
                      <span className={styles.logDate}>
                        <Calendar size={12} />
                        {formatDate(log.createdAt)}
                      </span>
                    </div>
                    <p className={styles.logDescription}>{log.description}</p>
                    <div className={styles.logDetails}>
                      <div className={styles.logUser}>
                        <User size={14} />
                        <span>
                          <strong>Performed by:</strong> {log.user.name} ({log.user.email})
                        </span>
                      </div>
                      {metadata && (
                        <div className={styles.logMetadata}>
                          {metadata.trainingTitle && (
                            <span>
                              <strong>Training:</strong> {metadata.trainingTitle}
                            </span>
                          )}
                          {metadata.trainingId && (
                            <span>
                              <strong>ID:</strong> {metadata.trainingId}
                            </span>
                          )}
                          {metadata.changes && Array.isArray(metadata.changes) && (
                            <span>
                              <strong>Changes:</strong> {metadata.changes.join(", ")}
                            </span>
                          )}
                        </div>
                      )}
                      {log.targetType && (
                        <div className={styles.logTarget}>
                          <strong>Target:</strong> {log.targetType}
                          {log.targetId && ` (${log.targetId})`}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                className={styles.paginationButton}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <span className={styles.paginationInfo}>
                Page {currentPage} of {totalPages} ({totalLogs} total logs)
              </span>
              <button
                className={styles.paginationButton}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

