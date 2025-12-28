import React from "react";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import styles from "./ProfileInfoTab.module.css";

export interface ProfileInfoTabProps {
  employeeNumber?: string | null;
  company?: { name: string } | null;
  position?: { title: string } | null;
  department?: string | null;
  branch?: string | null;
  area?: string | null;
  region?: string | null;
  phone?: string | null;
  hireDate?: Date | null;
  createdAt: Date;
}

export const ProfileInfoTab: React.FC<ProfileInfoTabProps> = ({
  employeeNumber,
  company,
  position,
  department,
  branch,
  area,
  region,
  phone,
  hireDate,
  createdAt,
}) => {
  const formatDate = (date: Date | null | undefined) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <Card className={styles.card}>
      <CardHeader>
        <h2 className={styles.cardTitle}>Information</h2>
      </CardHeader>
      <CardBody className={styles.compactBody}>
        <div className={styles.infoGrid}>
          {employeeNumber && (
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Employee Number</span>
              <span className={styles.infoValue}>{employeeNumber}</span>
            </div>
          )}
          {company && (
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Company</span>
              <span className={styles.infoValue}>{company.name}</span>
            </div>
          )}
          {position && (
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Position</span>
              <span className={styles.infoValue}>{position.title}</span>
            </div>
          )}
          {department && (
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Department</span>
              <span className={styles.infoValue}>{department}</span>
            </div>
          )}
          {region && (
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Region</span>
              <span className={styles.infoValue}>{region}</span>
            </div>
          )}
          {area && (
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Area</span>
              <span className={styles.infoValue}>{area}</span>
            </div>
          )}
          {branch && (
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Branch</span>
              <span className={styles.infoValue}>{branch}</span>
            </div>
          )}
          {phone && (
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Phone</span>
              <span className={styles.infoValue}>{phone}</span>
            </div>
          )}
          {hireDate && (
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Hire Date</span>
              <span className={styles.infoValue}>{formatDate(hireDate)}</span>
            </div>
          )}
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Member Since</span>
            <span className={styles.infoValue}>{formatDate(createdAt)}</span>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

