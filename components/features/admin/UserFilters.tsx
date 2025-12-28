"use client";

import React from "react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import styles from "./UserFilters.module.css";

export interface UserFiltersProps {
  status: string;
  role: string;
  search: string;
  onStatusChange: (status: string) => void;
  onRoleChange: (role: string) => void;
  onSearchChange: (search: string) => void;
}

export const UserFilters: React.FC<UserFiltersProps> = ({
  status,
  role,
  search,
  onStatusChange,
  onRoleChange,
  onSearchChange,
}) => {
  return (
    <div className={styles.filters}>
      <div className={styles.searchInput}>
        <Input
          type="text"
          placeholder="Search by name, email, or employee number..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <div className={styles.selectFilters}>
        <Select
          label="Status"
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </Select>
        <Select
          label="Role"
          value={role}
          onChange={(e) => onRoleChange(e.target.value)}
        >
          <option value="">All Roles</option>
          <option value="EMPLOYEE">Employee</option>
          <option value="BRANCH_MANAGER">Branch Manager</option>
          <option value="ADMIN">Admin</option>
          <option value="SUPER_ADMIN">Super Admin</option>
        </Select>
      </div>
    </div>
  );
};

