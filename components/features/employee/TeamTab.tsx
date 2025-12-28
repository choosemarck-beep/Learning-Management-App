"use client";

import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Loader2, Users } from "lucide-react";
import styles from "./TeamTab.module.css";

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  level: number;
  xp: number;
  rank: string;
  progress: number;
}

export interface TeamStats {
  totalMembers: number;
  averageProgress: number;
  totalXP: number;
}

export interface TeamTabProps {
  branchManagerId: string;
  role?: "BRANCH_MANAGER" | "AREA_MANAGER" | "REGIONAL_MANAGER";
}

export const TeamTab: React.FC<TeamTabProps> = ({
  branchManagerId,
  role = "BRANCH_MANAGER",
}) => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [teamStats, setTeamStats] = useState<TeamStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        setIsLoading(true);
        // Determine API endpoint based on role
        let apiEndpoint = "/api/employee/team";
        if (role === "REGIONAL_MANAGER") {
          apiEndpoint = "/api/employee/team?role=REGIONAL_MANAGER";
        } else if (role === "AREA_MANAGER") {
          apiEndpoint = "/api/employee/team?role=AREA_MANAGER";
        }
        const response = await fetch(apiEndpoint);
        const data = await response.json();

        if (data.success) {
          if (data.data.members) {
            setTeamMembers(data.data.members);
          }
          if (data.data.stats) {
            setTeamStats(data.data.stats);
          }
        } else {
          setError(data.error || "Failed to load team data");
        }
      } catch (err) {
        setError("Something went wrong. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeam();
  }, [branchManagerId]);

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 size={24} className={styles.loader} />
        <p className={styles.loadingText}>Loading team data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className={styles.errorCard}>
        <CardBody>
          <p className={styles.errorText}>{error}</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className={styles.container}>
      {/* Team Stats */}
      {teamStats && (
        <Card className={styles.statsCard}>
          <CardHeader>
            <h2 className={styles.cardTitle}>Team Overview</h2>
          </CardHeader>
          <CardBody>
            <div className={styles.statsGrid}>
              <div className={styles.statItem}>
                <Users size={20} className={styles.statIcon} />
                <div className={styles.statContent}>
                  <span className={styles.statLabel}>Team Members</span>
                  <span className={styles.statValue}>
                    {teamStats.totalMembers}
                  </span>
                </div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statContent}>
                  <span className={styles.statLabel}>Average Progress</span>
                  <span className={styles.statValue}>
                    {teamStats.averageProgress.toFixed(0)}%
                  </span>
                </div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statContent}>
                  <span className={styles.statLabel}>Total Team XP</span>
                  <span className={styles.statValue}>
                    {teamStats.totalXP.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Team Members List */}
      <Card className={styles.membersCard}>
        <CardHeader>
          <h2 className={styles.cardTitle}>
            {role === "REGIONAL_MANAGER"
              ? "Area Managers"
              : role === "AREA_MANAGER"
              ? "Branch Managers"
              : "Team Members"}
          </h2>
        </CardHeader>
        <CardBody>
          {teamMembers.length === 0 ? (
            <p className={styles.emptyText}>No team members yet.</p>
          ) : (
            <div className={styles.membersList}>
              {teamMembers.map((member) => (
                <div key={member.id} className={styles.memberCard}>
                  <div className={styles.memberHeader}>
                    <div className={styles.memberInfo}>
                      <h3 className={styles.memberName}>{member.name}</h3>
                      <p className={styles.memberEmail}>{member.email}</p>
                    </div>
                    <Badge variant="default">{member.rank}</Badge>
                  </div>

                  <div className={styles.memberStats}>
                    <div className={styles.memberStat}>
                      <span className={styles.memberStatLabel}>Level</span>
                      <span className={styles.memberStatValue}>
                        {member.level}
                      </span>
                    </div>
                    <div className={styles.memberStat}>
                      <span className={styles.memberStatLabel}>XP</span>
                      <span className={styles.memberStatValue}>
                        {member.xp.toLocaleString()}
                      </span>
                    </div>
                    <div className={styles.memberStat}>
                      <span className={styles.memberStatLabel}>Progress</span>
                      <span className={styles.memberStatValue}>
                        {member.progress.toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  <div className={styles.memberProgress}>
                    <ProgressBar value={member.progress} showPercentage />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};

