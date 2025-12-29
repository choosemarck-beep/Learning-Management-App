"use client";

import React, { useEffect, useRef, useCallback } from "react";
import { UseFormRegister, FieldErrors, UseFormWatch } from "react-hook-form";
import toast from "react-hot-toast";
import { PasswordInput } from "@/components/ui/PasswordInput";
import styles from "./AccountSetupStep.module.css";

export interface AccountSetupFormData {
  password: string;
  confirmPassword: string;
}

export interface AccountSetupStepProps {
  register: UseFormRegister<any>;
  errors: FieldErrors<AccountSetupFormData>;
  watch: UseFormWatch<any>;
}

// Password criteria validation
const passwordCriteria = [
  { id: "length", label: "At least 8 characters", test: (pwd: string) => pwd.length >= 8 },
  { id: "uppercase", label: "One uppercase letter", test: (pwd: string) => /[A-Z]/.test(pwd) },
  { id: "lowercase", label: "One lowercase letter", test: (pwd: string) => /[a-z]/.test(pwd) },
  { id: "number", label: "One number", test: (pwd: string) => /[0-9]/.test(pwd) },
  { id: "special", label: "One special character", test: (pwd: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd) },
];

export const AccountSetupStep: React.FC<AccountSetupStepProps> = ({
  register,
  errors,
  watch,
}) => {
  const password = watch("password") || "";
  const confirmPassword = watch("confirmPassword") || "";
  const passwordInputRef = useRef<HTMLInputElement | null>(null);
  const criteriaShownRef = useRef(false);
  const lastPasswordRef = useRef<string>("");
  const lastConfirmPasswordRef = useRef<string>("");
  const toastIdRef = useRef<string | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Show password criteria via toast when user focuses on password field (only once per session)
  const handlePasswordFocus = () => {
    if (!criteriaShownRef.current && password.length === 0) {
      criteriaShownRef.current = true;
      const criteriaList = passwordCriteria.map(c => c.label).join(', ');
      // Use toast() instead of toast.info() - react-hot-toast doesn't have info method
      toast(`Password Requirements: ${criteriaList}`, {
        duration: 5000,
        icon: 'ℹ️',
      });
    }
  };

  // Show password match status via toast (debounced to prevent spam)
  useEffect(() => {
    // Clear any existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Only check if both fields have values and something actually changed
    const passwordChanged = password !== lastPasswordRef.current;
    const confirmPasswordChanged = confirmPassword !== lastConfirmPasswordRef.current;
    
    if (!passwordChanged && !confirmPasswordChanged) {
      return;
    }

    // Update refs
    lastPasswordRef.current = password;
    lastConfirmPasswordRef.current = confirmPassword;

    // Debounce the toast to only show after user stops typing
    debounceTimerRef.current = setTimeout(() => {
      // Dismiss any existing toast
      if (toastIdRef.current) {
        toast.dismiss(toastIdRef.current);
      }

      // Only show toast if both fields have content
      if (password.length > 0 && confirmPassword.length > 0) {
        if (password !== confirmPassword) {
          // Only show error toast, not success toast (less intrusive)
          toastIdRef.current = toast.error("Passwords do not match", { 
            duration: 3000,
            id: 'password-match', // Use same ID to prevent duplicates
          });
        } else {
          // Show success toast only once when passwords match
          toastIdRef.current = toast.success("Passwords match", { 
            duration: 2000,
            id: 'password-match', // Use same ID to prevent duplicates
          });
        }
      }
    }, 500); // Wait 500ms after user stops typing

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [password, confirmPassword]);

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Account Setup</h2>
      <p className={styles.subtitle}>Create a secure password for your account</p>

      <div className={styles.fields}>
        <div className={styles.passwordField}>
          {(() => {
            const registerProps = register("password");
            const { ref: registerRef, ...registerRest } = registerProps;
            const registerRefTyped = registerRef as React.Ref<HTMLInputElement> | undefined;
            return (
              <PasswordInput
                label="Password"
                placeholder="Create a secure password"
                required
                onFocus={handlePasswordFocus}
                error={errors.password?.message}
                {...registerRest}
                ref={(el) => {
                  // Merge refs: set both the register ref and our ref
                  if (registerRefTyped) {
                    if (typeof registerRefTyped === "function") {
                      registerRefTyped(el);
                    } else if (registerRefTyped) {
                      (registerRefTyped as React.MutableRefObject<HTMLInputElement | null>).current = el;
                    }
                  }
                  passwordInputRef.current = el;
                }}
              />
            );
          })()}
        </div>
        <div className={styles.passwordField}>
          <PasswordInput
            label="Confirm Password"
            placeholder="Confirm your password"
            required
            error={errors.confirmPassword?.message}
            {...register("confirmPassword")}
          />
        </div>
      </div>
    </div>
  );
};

