"use client";

import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Button } from "@/components/ui/Button";
import { Loader2, User, Mail, Phone, MapPin, Calendar, XCircle } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import styles from "./TeamMembersTab.module.css";

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  level: number;
  xp: number;
  rank: string;
  progress: number;
  branch?: string;
  area?: string;
  region?: string;
  employeeNumber?: string;
  hireDate?: string;
  status: string;
}

export interface TeamMembersTabProps {
  managerRole: "BRANCH_MANAGER" | "AREA_MANAGER" | "REGIONAL_MANAGER";
}

export const TeamMembersTab: React.FC<TeamMembersTabProps> = ({
  managerRole,
}) => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resigningMemberId, setResigningMemberId] = useState<string | null>(null);

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/employee/team?role=${managerRole}`);
        const data = await response.json();

        if (data.success) {
          setTeamMembers(data.data.members || []);
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
  }, [managerRole]);

  const handleMarkResigned = async (memberId: string, memberName: string) => {
    if (!confirm(`Are you sure you want to mark ${memberName} as resigned? This will notify the admin for approval.`)) {
      return;
    }

    try {
      setResigningMemberId(memberId);
      const response = await fetch("/api/management/mark-resigned", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ employeeId: memberId }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`${memberName} has been marked as resigned. Admin has been notified.`);
        // Update the member's status in the list
        setTeamMembers((prev) =>
          prev.map((member) =>
            member.id === memberId
              ? { ...member, status: "RESIGNED" }
              : member
          )
        );
      } else {
        toast.error(data.error || "Failed to mark employee as resigned");
      }
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setResigningMemberId(null);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 size={24} className={styles.loader} />
        <p className={styles.loadingText}>Loading team members...</p>
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

  const getRoleLabel = () => {
    switch (managerRole) {
      case "REGIONAL_MANAGER":
        return "Area Managers";
      case "AREA_MANAGER":
        return "Branch Managers";
      default:
        return "Team Members";
    }
  };

  return (
    <div className={styles.container}>
      <Card className={styles.membersCard}>
        <CardHeader>
          <h2 className={styles.cardTitle}>{getRoleLabel()}</h2>
          <p className={styles.cardSubtitle}>
            {teamMembers.length} {teamMembers.length === 1 ? "member" : "members"}
          </p>
        </CardHeader>
        <CardBody className={styles.compactBody}>
          {teamMembers.length === 0 ? (
            <p className={styles.emptyText}>No team members yet.</p>
          ) : (
            <div className={styles.membersList}>
              {teamMembers.map((member) => (
                <div key={member.id} className={styles.memberCard}>
                  <div className={styles.memberHeader}>
                    <div className={styles.memberInfo}>
                      <div className={styles.memberNameRow}>
                        <h3 className={styles.memberName}>{member.name}</h3>
                        {member.status === "RESIGNED" && (
                          <Badge variant="outline" className={styles.resignedBadge}>
                            Resigned
                          </Badge>
                        )}
                      </div>
                      <div className={styles.memberDetails}>
                        <div className={styles.memberDetail}>
                          <Mail size={12} />
                          <span>{member.email}</span>
                        </div>
                        {member.phone && (
                          <div className={styles.memberDetail}>
                            <Phone size={12} />
                            <span>{member.phone}</span>
                          </div>
                        )}
                        {member.employeeNumber && (
                          <div className={styles.memberDetail}>
                            <User size={12} />
                            <span>#{member.employeeNumber}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <Badge variant="default">{member.rank}</Badge>
                  </div>

                  <div className={styles.memberStats}>
                    <div className={styles.memberStat}>
                      <span className={styles.memberStatLabel}>Level</span>
                      <span className={styles.memberStatValue}>{member.level}</span>
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
                    <ProgressBar value={member.progress} showPercentage={false} />
                  </div>

                  <div className={styles.memberActions}>
                    <Link
                      href={`/employee/profile?id=${member.id}`}
                      className={styles.viewProfileButton}
                    >
                      View Profile
                    </Link>
                    {member.status !== "RESIGNED" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMarkResigned(member.id, member.name)}
                        disabled={resigningMemberId === member.id}
                        className={styles.resignButton}
                      >
                        {resigningMemberId === member.id ? (
                          <>
                            <Loader2 size={14} className={styles.buttonLoader} />
                            Processing...
                          </>
                        ) : (
                          <>
                            <XCircle size={14} />
                            Mark Resigned
                          </>
                        )}
                      </Button>
                    )}
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

