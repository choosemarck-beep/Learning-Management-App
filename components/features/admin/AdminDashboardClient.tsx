"use client";

import React, { useState } from "react";
import { Card, CardBody } from "@/components/ui/Card";
import { StatsCard } from "./StatsCard";
import { UserManagementTabs } from "./UserManagementTabs";
import { CreateTrainerModal } from "./CreateTrainerModal";
import styles from "./AdminDashboardClient.module.css";

interface AdminDashboardClientProps {
  initialUsers: any[];
  companies: Array<{ id: string; name: string }>;
  stats: {
    totalUsers: number;
    rejectedUsers: number;
    pendingUsers: number;
  };
}

export const AdminDashboardClient: React.FC<AdminDashboardClientProps> = ({
  initialUsers,
  companies,
  stats,
}) => {
  const [isCreateTrainerModalOpen, setIsCreateTrainerModalOpen] =
    useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCreateTrainerSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className={styles.container}>
      {/* Stats Grid */}
      <div className={styles.statsGrid}>
        <StatsCard
          label="Total Users"
          value={stats.totalUsers}
        />
        <StatsCard
          label="Pending"
          value={stats.pendingUsers}
        />
        <StatsCard
          label="Rejected"
          value={stats.rejectedUsers}
        />
      </div>

      {/* User Management Table */}
      <Card className={styles.tableSection}>
        <CardBody>
          <UserManagementTabs
            key={refreshKey}
            initialUsers={initialUsers}
            onAdd={() => setIsCreateTrainerModalOpen(true)}
          />
        </CardBody>
      </Card>

      {/* Create Trainer Modal */}
      <CreateTrainerModal
        isOpen={isCreateTrainerModalOpen}
        onClose={() => setIsCreateTrainerModalOpen(false)}
        onSuccess={handleCreateTrainerSuccess}
        companies={companies}
      />
    </div>
  );
};

