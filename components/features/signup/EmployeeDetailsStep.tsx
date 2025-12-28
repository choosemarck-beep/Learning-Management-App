"use client";

import React, { useEffect, useState } from "react";
import { UseFormRegister, FieldErrors, UseFormWatch, UseFormSetValue } from "react-hook-form";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { DatePicker } from "@/components/ui/DatePicker";
import styles from "./EmployeeDetailsStep.module.css";

export interface EmployeeDetailsFormData {
  positionId: string;
  department: string;
  branch: string;
  hireDate: string;
}

export interface EmployeeDetailsStepProps {
  register: UseFormRegister<any>;
  errors: FieldErrors<EmployeeDetailsFormData>;
  watch: UseFormWatch<any>;
  setValue: UseFormSetValue<any>;
}

interface Position {
  id: string;
  title: string;
  role: string;
}

// Default position list (will be replaced by admin management in future)
const DEFAULT_POSITIONS: Position[] = [
  { id: "regional-manager", title: "Regional Manager", role: "MANAGEMENT" },
  { id: "area-manager", title: "Area Manager", role: "MANAGEMENT" },
  { id: "branch-manager", title: "Branch Manager", role: "MANAGEMENT" },
  { id: "operations-supervisor", title: "Operations Supervisor", role: "SUPERVISOR" },
  { id: "senior-cashier", title: "Senior Cashier", role: "STAFF" },
  { id: "cashier", title: "Cashier", role: "STAFF" },
  { id: "bingo-host", title: "Bingo Host", role: "STAFF" },
  { id: "gaming-attendant", title: "Gaming Attendant", role: "STAFF" },
  { id: "card-allocator", title: "Card Allocator", role: "STAFF" },
  { id: "bingo-technician", title: "Bingo Technician", role: "TECHNICAL" },
  { id: "security-guard", title: "Security Guard", role: "SECURITY" },
  { id: "utility", title: "Utility", role: "STAFF" },
];

export const EmployeeDetailsStep: React.FC<EmployeeDetailsStepProps> = ({
  register,
  errors,
  watch,
  setValue,
}) => {
  const hireDate = watch("hireDate");
  const [positions, setPositions] = useState<Position[]>([]);
  const [isLoadingPositions, setIsLoadingPositions] = useState(true);
  const [positionsError, setPositionsError] = useState<string | null>(null);

  // Fetch positions on mount - MUST use database data, not hardcoded defaults
  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingPositions(true);
      setPositionsError(null);

      try {
        const positionsRes = await fetch("/api/positions");
        if (positionsRes.ok) {
          const positionsData = await positionsRes.json();
          // Only use API data - never use hardcoded defaults
          if (positionsData.data && positionsData.data.length > 0) {
            setPositions(positionsData.data);
          } else {
            setPositionsError("No positions available. Please run: npm run db:seed");
            setPositions([]);
          }
        } else {
          setPositionsError("Failed to load positions. Please ensure the database is seeded.");
          setPositions([]);
        }
      } catch (error) {
        console.error("Error fetching positions:", error);
        setPositionsError("Failed to load positions. Please check your connection.");
        setPositions([]);
      } finally {
        setIsLoadingPositions(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Employee Details</h2>
      <p className={styles.subtitle}>Additional employment information</p>

      <div className={styles.fields}>
        {positionsError ? (
          <div className={styles.errorText}>
            {positionsError}
          </div>
        ) : (
          <Select
            label="Position"
            required
            disabled={isLoadingPositions || positions.length === 0}
            {...register("positionId", {
              required: "Please select a position",
            })}
          >
            <option value="">Select Position</option>
            {positions.map((position) => (
              <option key={position.id} value={position.id}>
                {position.title}
              </option>
            ))}
          </Select>
        )}

        <Select
          label="Department"
          required
          {...register("department", {
            required: "Please select a department",
          })}
        >
          <option value="">Select Department</option>
          <option value="Retail Offline Operations">Retail Offline Operations</option>
          <option value="Online">Online</option>
          <option value="Central - Head Office">Central - Head Office</option>
          <option value="Marketing">Marketing</option>
          <option value="Learning Management">Learning Management</option>
          <option value="Product">Product</option>
        </Select>

        <Input
          label="Branch"
          type="text"
          placeholder="Enter your branch"
          required
          {...register("branch")}
        />

        <DatePicker
          label="Hire Date"
          required
          value={hireDate || ""}
          onChange={(value) => {
            setValue("hireDate", value);
          }}
          error={errors.hireDate?.message}
        />
      </div>
    </div>
  );
};
