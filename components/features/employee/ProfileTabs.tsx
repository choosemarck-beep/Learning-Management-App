"use client";

import React, { useState } from "react";
import styles from "./ProfileTabs.module.css";

export type TabId = "ABOUT" | "ACTIVITY" | "COURSES" | "TEAM";

export interface Tab {
  id: TabId;
  label: string;
}

export interface ProfileTabsProps {
  tabs: Tab[];
  defaultTab?: TabId;
  aboutContent?: React.ReactNode;
  activityContent?: React.ReactNode;
  coursesContent?: React.ReactNode;
  teamContent?: React.ReactNode;
}

export const ProfileTabs: React.FC<ProfileTabsProps> = ({
  tabs,
  defaultTab,
  aboutContent,
  activityContent,
  coursesContent,
  teamContent,
}) => {
  const [activeTab, setActiveTab] = useState<TabId>(
    defaultTab || tabs[0]?.id || "ABOUT"
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "ABOUT":
        return aboutContent;
      case "ACTIVITY":
        return activityContent;
      case "COURSES":
        return coursesContent;
      case "TEAM":
        return teamContent;
      default:
        return null;
    }
  };

  return (
    <div className={styles.container}>
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
