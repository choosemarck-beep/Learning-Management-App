"use client";

import React, { useState } from "react";
import styles from "./ProfilePageTabs.module.css";

export type ProfileTabId = "CONTACT" | "WORK" | "STATS";

export interface ProfileTab {
  id: ProfileTabId;
  label: string;
}

export interface ProfilePageTabsProps {
  tabs: ProfileTab[];
  defaultTab?: ProfileTabId;
  contactContent?: React.ReactNode;
  workContent?: React.ReactNode;
  statsContent?: React.ReactNode;
}

export const ProfilePageTabs: React.FC<ProfilePageTabsProps> = ({
  tabs,
  defaultTab,
  contactContent,
  workContent,
  statsContent,
}) => {
  const [activeTab, setActiveTab] = useState<ProfileTabId>(
    defaultTab || tabs[0]?.id || "CONTACT"
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "CONTACT":
        return contactContent;
      case "WORK":
        return workContent;
      case "STATS":
        return statsContent;
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

