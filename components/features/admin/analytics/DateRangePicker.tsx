"use client";

import React from "react";
import { Button } from "@/components/ui/Button";
import styles from "./DateRangePicker.module.css";

interface DateRangePickerProps {
  days: number;
  onChange: (days: number) => void;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  days,
  onChange,
}) => {
  const ranges = [
    { label: "7 Days", value: 7 },
    { label: "30 Days", value: 30 },
    { label: "90 Days", value: 90 },
    { label: "All Time", value: 365 },
  ];

  return (
    <div className={styles.container}>
      <span className={styles.label}>Time Range:</span>
      <div className={styles.buttons}>
        {ranges.map((range) => (
          <Button
            key={range.value}
            variant={days === range.value ? "primary" : "outline"}
            size="sm"
            onClick={() => onChange(range.value)}
            className={styles.button}
          >
            {range.label}
          </Button>
        ))}
      </div>
    </div>
  );
};

