"use client";

import React, { useState, useEffect } from "react";
import { UsersTable } from "./UsersTable";
import { UserSearchFilter } from "./UserSearchFilter";
import { SearchResultsModal } from "./SearchResultsModal";
import { Button } from "@/components/ui/Button";
import toast from "react-hot-toast";
import { User } from "./UsersTable";
import styles from "./UserManagementTabs.module.css";

interface UserManagementTabsProps {
  initialUsers?: any[];
  onAdd?: () => void;
  onEdit?: (user: any) => void;
}

export const UserManagementTabs: React.FC<UserManagementTabsProps> = ({
  initialUsers = [],
  onAdd,
  onEdit,
}) => {
  const [activeTab, setActiveTab] = useState<"ALL" | "PENDING" | "REJECTED">("ALL");
  const [refreshKey, setRefreshKey] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResultCount, setSearchResultCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [rejectedCount, setRejectedCount] = useState(0);

  // Fetch stats (pending and rejected counts)
  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/stats");
      const data = await response.json();
      
      if (data.success) {
        setPendingCount(data.data.pendingUsers || 0);
        setRejectedCount(data.data.rejectedUsers || 0);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  // Initial fetch and when refresh happens
  useEffect(() => {
    fetchStats();
  }, [refreshKey]);

  // Update stats when tab changes (to get fresh counts)
  useEffect(() => {
    fetchStats();
  }, [activeTab]);

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
    fetchStats(); // Refresh stats when table refreshes
  };

  const handleStatsUpdate = () => {
    fetchStats(); // Update stats counter when approve/reject happens
  };

  const handleSearch = async (query: string) => {
    setIsSearching(true);
    setSearchQuery(query);

    try {
      const response = await fetch("/api/admin/users/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
      });

      const data = await response.json();

      if (data.success) {
        setSearchResults(data.data);
        setSearchResultCount(data.resultCount || data.data.length);
        setIsSearchModalOpen(true);
      } else {
        toast.error(data.error || "Failed to search users");
      }
    } catch (error) {
      console.error("Error searching users:", error);
      toast.error("Failed to search users");
    } finally {
      setIsSearching(false);
    }
  };

  const handleClearSearch = () => {
    setIsSearching(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleCloseSearchModal = () => {
    setIsSearchModalOpen(false);
    setSearchResults([]);
    setSearchQuery("");
  };

  const handleApprove = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/approve`, {
        method: "POST",
      });
      const data = await response.json();

      if (data.success) {
        toast.success("User approved successfully");
        // Refresh search results
        if (searchQuery) {
          handleSearch(searchQuery);
        }
        setRefreshKey((prev) => prev + 1);
      } else {
        toast.error(data.error || "Failed to approve user");
      }
    } catch (error) {
      console.error("Error approving user:", error);
      toast.error("Failed to approve user");
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

    try {
      const response = await fetch(`/api/admin/users/${userId}/reject`, {
        method: "POST",
      });
      const data = await response.json();

      if (data.success) {
        toast.success("User rejected successfully");
        // Refresh search results
        if (searchQuery) {
          handleSearch(searchQuery);
        }
        setRefreshKey((prev) => prev + 1);
      } else {
        toast.error(data.error || "Failed to reject user");
      }
    } catch (error) {
      console.error("Error rejecting user:", error);
      toast.error("Failed to reject user");
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

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (data.success) {
        toast.success("User deleted successfully");
        // Refresh search results
        if (searchQuery) {
          handleSearch(searchQuery);
        }
        setRefreshKey((prev) => prev + 1);
      } else {
        toast.error(data.error || "Failed to delete user");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Failed to delete user");
    }
  };

  const tabs = [
    { id: "ALL" as const, label: "All Users", count: null },
    { id: "PENDING" as const, label: "Pending", count: pendingCount },
    { id: "REJECTED" as const, label: "Rejected", count: rejectedCount },
  ];

  return (
    <div className={styles.container}>
      {/* Header with Tabs, Search, and Add Button */}
      <div className={styles.header}>
        <div className={styles.tabs}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`${styles.tab} ${activeTab === tab.id ? styles.active : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
              {tab.count !== null && tab.count > 0 && (
                <span className={styles.tabBadge}>{tab.count}</span>
              )}
            </button>
          ))}
        </div>
        <div className={styles.searchAndButtonGroup}>
          <UserSearchFilter
            onSearch={handleSearch}
            onClear={handleClearSearch}
            isLoading={isSearching}
          />
          {onAdd && (
            <Button variant="primary" size="lg" onClick={onAdd} className={styles.addButton}>
              Add Trainer
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className={styles.tableContainer}>
        <UsersTable
          key={`${activeTab}-${refreshKey}`}
          initialUsers={initialUsers}
          statusFilter={activeTab}
          currentTab={activeTab}
          onRefresh={handleRefresh}
          onEdit={onEdit}
          onAdd={onAdd}
          onStatsUpdate={handleStatsUpdate}
        />
      </div>

      {/* Search Results Modal */}
      <SearchResultsModal
        isOpen={isSearchModalOpen}
        onClose={handleCloseSearchModal}
        users={searchResults}
        searchQuery={searchQuery}
        resultCount={searchResultCount}
        onRefresh={handleRefresh}
        onEdit={onEdit}
        onApprove={async (userId: string) => {
          await handleApprove(userId);
          handleStatsUpdate(); // Update stats after approve
        }}
        onReject={async (userId: string) => {
          await handleReject(userId);
          handleStatsUpdate(); // Update stats after reject
        }}
        onDelete={handleDelete}
      />
    </div>
  );
};

