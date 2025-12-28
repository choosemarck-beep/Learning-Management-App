"use client";

import React, { useState, useId, useRef, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import styles from "./PasswordInput.module.css";

export interface PasswordInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  (
    { label, error, helperText, className, id, required, onKeyDown, ...props },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const generatedId = useId();
    const inputId = id || generatedId;
    const hasError = !!error;
    const internalRef = useRef<HTMLInputElement>(null);

    // Combine refs
    useEffect(() => {
      if (typeof ref === "function") {
        ref(internalRef.current);
      } else if (ref) {
        ref.current = internalRef.current;
      }
    }, [ref]);

    // Handle Select All keyboard shortcut (Ctrl+A / Cmd+A)
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Check for Ctrl+A (Windows/Linux) or Cmd+A (Mac)
      if ((e.ctrlKey || e.metaKey) && e.key === "a") {
        e.preventDefault();
        if (internalRef.current) {
          internalRef.current.select();
        }
        return;
      }

      // Call original onKeyDown if provided
      if (onKeyDown) {
        onKeyDown(e);
      }
    };

    const togglePasswordVisibility = () => {
      setShowPassword((prev) => !prev);
    };

    return (
      <div className={styles.wrapper}>
        {label && (
          <label htmlFor={inputId} className={styles.label}>
            {label}
            {required && <span className={styles.required}>*</span>}
          </label>
        )}
        <div className={styles.inputContainer}>
          <input
            ref={internalRef}
            id={inputId}
            type={showPassword ? "text" : "password"}
            className={cn(
              styles.input,
              hasError && styles.error,
              className
            )}
            aria-invalid={hasError}
            aria-describedby={
              error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
            }
            required={required}
            onKeyDown={handleKeyDown}
            {...props}
          />
          <button
            type="button"
            className={styles.toggleButton}
            onClick={togglePasswordVisibility}
            aria-label={showPassword ? "Hide password" : "Show password"}
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff size={16} className={styles.icon} />
            ) : (
              <Eye size={16} className={styles.icon} />
            )}
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

PasswordInput.displayName = "PasswordInput";

