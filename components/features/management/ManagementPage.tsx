"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { TeamMembersTab } from "./TeamMembersTab";
import { CourseAssignmentTab } from "./CourseAssignmentTab";
import { TrainingStatsTab } from "./TrainingStatsTab";
import styles from "./ManagementPage.module.css";

export type ManagementTabId = "TEAM" | "COURSES" | "STATS";

export interface ManagementTab {
  id: ManagementTabId;
  label: string;
}

export interface ManagementPageProps {
  managerRole: "BRANCH_MANAGER" | "AREA_MANAGER" | "REGIONAL_MANAGER";
}

export const ManagementPage: React.FC<ManagementPageProps> = ({
  managerRole,
}) => {
  const [activeTab, setActiveTab] = useState<ManagementTabId>("TEAM");

  const tabs: ManagementTab[] = [
    { id: "TEAM", label: "Team" },
    { id: "COURSES", label: "Assign Courses" },
    { id: "STATS", label: "Training Stats" },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "TEAM":
        return <TeamMembersTab managerRole={managerRole} />;
      case "COURSES":
        return <CourseAssignmentTab managerRole={managerRole} />;
      case "STATS":
        return <TrainingStatsTab managerRole={managerRole} />;
      default:
        return null;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Management</h1>
        <p className={styles.subtitle}>
          {managerRole === "REGIONAL_MANAGER"
            ? "Manage Area Managers"
            : managerRole === "AREA_MANAGER"
            ? "Manage Branch Managers"
            : "Manage Your Team"}
        </p>
      </div>

      {/* Tab Bar */}
      <div className={styles.tabBar}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`${styles.tab} ${
              activeTab === tab.id ? styles.active : ""
            }`}
            onClick={() => setActiveTab(tab.id)}
            aria-selected={activeTab === tab.id}
            role="tab"
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className={styles.tabContent} role="tabpanel">
        {renderTabContent()}
      </div>
    </div>
  );
};

