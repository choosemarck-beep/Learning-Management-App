import React, { useId, useRef, useEffect } from "react";
import { cn } from "@/lib/utils/cn";
import styles from "./Input.module.css";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    { label, error, helperText, className, id, required, onKeyDown, ...props },
    ref
  ) => {
    // Use React's useId hook for stable IDs that match between server and client
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

    return (
      <div className={styles.wrapper}>
        {label && (
          <label htmlFor={inputId} className={styles.label}>
            {label}
            {required && <span className={styles.required}>*</span>}
          </label>
        )}
        <input
          ref={internalRef}
          id={inputId}
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

Input.displayName = "Input";

