"use client";

import React from "react";
import { TrainerSidebar } from "./TrainerSidebar";
import { TrainerHeader } from "./TrainerHeader";
import { ConditionalGalaxyBackground } from "@/components/ui/ConditionalGalaxyBackground";
import styles from "./TrainerLayout.module.css";

interface TrainerLayoutProps {
  children: React.ReactNode;
  userName: string;
  userEmail: string;
  userAvatar: string | null;
  pageTitle?: string;
  pageDescription?: string;
}

export const TrainerLayout: React.FC<TrainerLayoutProps> = ({
  children,
  userName,
  userEmail,
  userAvatar,
  pageTitle,
  pageDescription,
}) => {
  return (
    <div className={styles.layout} data-trainer-layout="true">
      <ConditionalGalaxyBackground starCount={150} meteorCount={3} />
      <TrainerSidebar userName={userName} userEmail={userEmail} />
      <div className={styles.mainContent}>
        <TrainerHeader
          userName={userName}
          userEmail={userEmail}
          userAvatar={userAvatar}
          pageTitle={pageTitle}
          pageDescription={pageDescription}
        />
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
};

