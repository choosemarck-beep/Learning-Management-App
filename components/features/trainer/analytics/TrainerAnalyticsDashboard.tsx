"use client";

import React from "react";
import { Accordion } from "@/components/ui/Accordion";
import { TrainerCompletionAnalytics } from "./TrainerCompletionAnalytics";
import { TrainerQuizAnalytics } from "./TrainerQuizAnalytics";
import { TrainerEngagementAnalytics } from "./TrainerEngagementAnalytics";
import { BookOpen, FileQuestion, Activity } from "lucide-react";
import styles from "./TrainerAnalyticsDashboard.module.css";

export const TrainerAnalyticsDashboard: React.FC = () => {
  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Analytics Dashboard</h2>
      
      <div className={styles.analyticsSection}>
        <Accordion
          title="Completion Analytics"
          icon={<BookOpen size={18} />}
          defaultOpen={false}
        >
          <TrainerCompletionAnalytics />
        </Accordion>
        
        <Accordion
          title="Quiz Performance Analytics"
          icon={<FileQuestion size={18} />}
          defaultOpen={false}
        >
          <TrainerQuizAnalytics />
        </Accordion>
        
        <Accordion
          title="Engagement Analytics"
          icon={<Activity size={18} />}
          defaultOpen={false}
        >
          <TrainerEngagementAnalytics />
        </Accordion>
      </div>
    </div>
  );
};

