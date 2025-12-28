"use client";

import React from "react";
import { X, Check } from "lucide-react";
import styles from "./PasswordCriteria.module.css";

interface PasswordCriteriaProps {
  password: string;
}

interface Criterion {
  id: string;
  label: string;
  test: (password: string) => boolean;
}

const criteria: Criterion[] = [
  {
    id: "length",
    label: "At least 8 characters",
    test: (pwd) => pwd.length >= 8,
  },
  {
    id: "uppercase",
    label: "One uppercase letter",
    test: (pwd) => /[A-Z]/.test(pwd),
  },
  {
    id: "lowercase",
    label: "One lowercase letter",
    test: (pwd) => /[a-z]/.test(pwd),
  },
  {
    id: "number",
    label: "One number",
    test: (pwd) => /[0-9]/.test(pwd),
  },
  {
    id: "special",
    label: "One special character",
    test: (pwd) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd),
  },
];

export const PasswordCriteria: React.FC<PasswordCriteriaProps> = ({ password }) => {
  // Show all criteria with their status
  return (
    <div className={styles.container}>
      <div className={styles.criteriaList}>
        {criteria.map((criterion) => {
          const isMet = criterion.test(password);
          return (
            <div key={criterion.id} className={styles.criterion}>
              <span className={styles.icon}>
                {isMet ? (
                  <Check className={styles.checkIcon} size={14} />
                ) : (
                  <X className={styles.xIcon} size={14} />
                )}
              </span>
              <span className={`${styles.label} ${isMet ? styles.met : ""}`}>
                {criterion.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

