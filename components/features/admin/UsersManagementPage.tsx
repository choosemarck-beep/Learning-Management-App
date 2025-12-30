"use client";

import React, { useState } from "react";
import { Card, CardBody } from "@/components/ui/Card";
import { UserManagementTabs } from "./UserManagementTabs";
import { CreateTrainerModal } from "./CreateTrainerModal";
import styles from "./UsersManagementPage.module.css";

interface UsersManagementPageProps {
  initialUsers: any[];
  companies: Array<{ id: string; name: string }>;
}

export const UsersManagementPage: React.FC<UsersManagementPageProps> = ({
  initialUsers,
  companies,
}) => {
  const [isCreateTrainerModalOpen, setIsCreateTrainerModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCreateTrainerSuccess = () => {
    setRefreshKey((prev) => prev + 1);
    // Refresh the page to get updated user list
    window.location.reload();
  };

  return (
    <div className={styles.container}>
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

