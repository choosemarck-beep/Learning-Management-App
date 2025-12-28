"use client";

import React, { useState, useEffect } from "react";
import { Activity, Calendar, User, FileText } from "lucide-react";
import toast from "react-hot-toast";
import styles from "./ActivityLogsClient.module.css";

interface ActivityLog {
  id: string;
  type: string;
  description: string;
  metadata: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export const ActivityLogsClient: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("all");

  useEffect(() => {
    fetchLogs();
  }, [filterType]);

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const url = filterType === "all" 
        ? "/api/admin/activity-logs"
        : `/api/admin/activity-logs?type=${filterType}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setLogs(data.data.logs);
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

  const filterOptions = [
    { value: "all", label: "All Activities" },
    { value: "TRAINING_CREATED", label: "Training Created" },
    { value: "TRAINING_UPDATED", label: "Training Updated" },
    { value: "TRAINING_DELETED", label: "Training Deleted" },
    { value: "USER_CREATED", label: "User Created" },
    { value: "USER_UPDATED", label: "User Updated" },
    { value: "USER_APPROVED", label: "User Approved" },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Activity Logs</h1>
        <p className={styles.subtitle}>
          View system activities and changes
        </p>
      </div>

      <div className={styles.filters}>
        {filterOptions.map((option) => (
          <button
            key={option.value}
            className={`${styles.filterButton} ${
              filterType === option.value ? styles.active : ""
            }`}
            onClick={() => setFilterType(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className={styles.loading}>
          <p>Loading activity logs...</p>
        </div>
      ) : logs.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No activity logs found.</p>
        </div>
      ) : (
        <div className={styles.logsList}>
          {logs.map((log) => (
            <div key={log.id} className={styles.logItem}>
              <div className={styles.logIcon}>
                {getActivityIcon(log.type)}
              </div>
              <div className={styles.logContent}>
                <div className={styles.logHeader}>
                  <span className={styles.logType}>{log.type.replace(/_/g, " ")}</span>
                  <span className={styles.logDate}>
                    <Calendar size={12} />
                    {formatDate(log.createdAt)}
                  </span>
                </div>
                <p className={styles.logDescription}>{log.description}</p>
                <div className={styles.logUser}>
                  <User size={12} />
                  <span>
                    {log.user.name} ({log.user.role})
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

