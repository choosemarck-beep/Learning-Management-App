"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { IntroCarousel } from "@/components/features/IntroCarousel";
import styles from "./page.module.css";

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        "Password must contain uppercase, lowercase, number, and special character"
      ),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);

  // Validate token on mount
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setIsValidating(false);
        setIsValidToken(false);
        toast.error("Invalid reset link. Please request a new one.");
        return;
      }

      try {
        const response = await fetch(`/api/auth/validate-reset-token?token=${token}`);
        const result = await response.json();

        if (!response.ok || !result.valid) {
          setIsValidToken(false);
          toast.error(result.error || "Invalid or expired reset link.");
        } else {
          setIsValidToken(true);
        }
      } catch (err) {
        console.error("Token validation error:", err);
        setIsValidToken(false);
        toast.error("Failed to validate reset link. Please try again.");
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [token]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      toast.error("Invalid reset link. Please request a new one.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          password: data.password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || "Failed to reset password. Please try again.");
        setIsLoading(false);
        return;
      }

      toast.success("Password reset successfully! Redirecting to login...");
      setTimeout(() => {
        router.push("/login?message=" + encodeURIComponent("Password reset successful. Please sign in."));
      }, 1500);
    } catch (err) {
      console.error("Reset password error:", err);
      toast.error("Something went wrong. Please try again in a moment.");
      setIsLoading(false);
    }
  };

  if (isValidating) {
    return (
      <div className={styles.container}>
        <div className={styles.loginSection}>
          <IntroCarousel className={styles.carousel} />
          <div className={styles.loadingContainer}>
            <p className={styles.loadingText}>Validating reset link...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isValidToken) {
    return (
      <div className={styles.container}>
        <div className={styles.loginSection}>
          <IntroCarousel className={styles.carousel} />
          <div className={styles.errorContainer}>
            <h1 className={styles.title}>Invalid Reset Link</h1>
            <p className={styles.description}>
              This password reset link is invalid or has expired. Please request a
              new one.
            </p>
            <Button
              variant="primary"
              size="lg"
              onClick={() => router.push("/forgot-password")}
              className={styles.requestButton}
            >
              Request New Link
            </Button>
            <Link href="/login" className={styles.backToLoginText}>
              ← Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.loginSection}>
        <IntroCarousel className={styles.carousel} />
        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          <h1 className={styles.title}>Reset Your Password</h1>
          <p className={styles.description}>
            Enter your new password below. Make sure it's strong and secure.
          </p>

          <div className={styles.inputGroup}>
            <PasswordInput
              label="New Password"
              placeholder="Enter your new password"
              required
              error={errors.password?.message}
              {...register("password")}
            />
          </div>

          <div className={styles.inputGroup}>
            <PasswordInput
              label="Confirm Password"
              placeholder="Confirm your new password"
              required
              error={errors.confirmPassword?.message}
              {...register("confirmPassword")}
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            className={styles.submitButton}
          >
            {isLoading ? "Resetting..." : "Reset Password"}
          </Button>
        </form>

        <div className={styles.signupLink}>
          <Link href="/login" className={styles.backToLoginText}>
            ← Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className={styles.container}>
          <div className={styles.loginSection}>
            <div className={styles.loadingContainer}>
              <p className={styles.loadingText}>Loading...</p>
            </div>
          </div>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}

