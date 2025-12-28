"use client";

import React, { useId, useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils/cn";
import styles from "./DatePicker.module.css";

export interface DatePickerProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "onChange" | "value" | "onKeyDown"> {
  label?: string;
  error?: string;
  helperText?: string;
  value?: string;
  onChange?: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export const DatePicker = React.forwardRef<HTMLInputElement, DatePickerProps>(
  (
    { label, error, helperText, className, id, required, value, onChange, onKeyDown, max, ...props },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const hasError = !!error;
    const inputRef = useRef<HTMLInputElement>(null);
    const [displayValue, setDisplayValue] = useState<string>("");

    // Get today's date in YYYY-MM-DD format for max date validation
    const getTodayDate = (): string => {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, "0");
      const day = String(today.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    // Use provided max or default to today (prevent future dates)
    const maxDate = max || getTodayDate();

    // Format date for display
    const formatDate = (dateString: string): string => {
      if (!dateString) return "";
      try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "";
        
        const options: Intl.DateTimeFormatOptions = {
          year: "numeric",
          month: "long",
          day: "numeric",
        };
        return date.toLocaleDateString("en-US", options);
      } catch {
        return "";
      }
    };

    // Update display value when value prop changes
    useEffect(() => {
      if (value) {
        setDisplayValue(formatDate(value));
      } else {
        setDisplayValue("");
      }
    }, [value]);

    // Handle input change
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setDisplayValue(formatDate(newValue));
      if (onChange) {
        onChange(newValue);
      }
    };

    // Handle button click - open date picker
    const handleButtonClick = () => {
      if (inputRef.current) {
        if (inputRef.current.showPicker) {
          inputRef.current.showPicker();
        } else {
          inputRef.current.focus();
        }
      }
    };

    // Handle Select All keyboard shortcut (Ctrl+A / Cmd+A) on the hidden input
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Check for Ctrl+A (Windows/Linux) or Cmd+A (Mac)
      if ((e.ctrlKey || e.metaKey) && e.key === "a") {
        e.preventDefault();
        if (inputRef.current) {
          inputRef.current.select();
        }
        return;
      }

      // Call original onKeyDown if provided
      if (onKeyDown) {
        onKeyDown(e);
      }
    };

    return (
      <div className={styles.wrapper}>
        {label && (
          <label htmlFor={inputId} className={styles.label}>
            {label}
            {required && <span className={styles.required}>*</span>}
          </label>
        )}
        <div className={styles.datePickerContainer}>
          <input
            ref={(node) => {
              if (typeof ref === "function") {
                ref(node);
              } else if (ref) {
                ref.current = node;
              }
              inputRef.current = node;
            }}
            id={inputId}
            type="date"
            className={cn(styles.hiddenInput)}
            value={value || ""}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            max={maxDate}
            aria-invalid={hasError}
            aria-describedby={
              error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
            }
            required={required}
            {...props}
          />
          <button
            type="button"
            onClick={handleButtonClick}
            className={cn(
              styles.dateButton,
              hasError && styles.error,
              !displayValue && styles.placeholder,
              className
            )}
            aria-label={label || "Select date"}
          >
            <span className={styles.dateDisplay}>
              {displayValue || "Select date"}
            </span>
          </button>
        </div>
        {error && (
          <span id={`${inputId}-error`} className={styles.errorText} role="alert">
            {error}
          </span>
        )}
        {helperText && !error && (
          <span id={`${inputId}-helper`} className={styles.helperText}>
            {helperText}
          </span>
        )}
      </div>
    );
  }
);

DatePicker.displayName = "DatePicker";

