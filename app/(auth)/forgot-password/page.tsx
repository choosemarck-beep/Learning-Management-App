"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { IntroCarousel } from "@/components/features/IntroCarousel";
import styles from "./page.module.css";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: data.email }),
      });

      const result = await response.json();

      if (!response.ok) {
        // Don't reveal if email exists or not (security best practice)
        toast.error(
          result.error || "If that email exists, we've sent a password reset link."
        );
        setIsLoading(false);
        return;
      }

      // Success - show confirmation
      setEmailSent(true);
      toast.success("Password reset link sent! Check your email.");
    } catch (err) {
      console.error("Forgot password error:", err);
      toast.error("Something went wrong. Please try again in a moment.");
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className={styles.container}>
        <div className={styles.loginSection}>
          <IntroCarousel className={styles.carousel} />
          <div className={styles.successContainer}>
            <h1 className={styles.title}>Check Your Email</h1>
            <p className={styles.description}>
              We've sent a password reset link to{" "}
              <span className={styles.emailHighlight}>
                {getValues("email")}
              </span>
            </p>
            <p className={styles.helperText}>
              Click the link in the email to reset your password. The link will
              expire in 1 hour.
            </p>
            <div className={styles.actions}>
              <Button
                variant="primary"
                size="lg"
                onClick={() => router.push("/login")}
                className={styles.backButton}
              >
                Back to Sign In
              </Button>
              <button
                type="button"
                onClick={() => {
                  setEmailSent(false);
                  setIsLoading(false);
                }}
                className={styles.resendLink}
              >
                Didn't receive it? Try again
              </button>
            </div>
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
          <h1 className={styles.title}>Forgot Password?</h1>
          <p className={styles.description}>
            Enter your email address and we'll send you a link to reset your
            password.
          </p>

          <div className={styles.inputGroup}>
            <Input
              label="Email"
              type="email"
              placeholder="your.email@example.com"
              required
              error={errors.email?.message}
              {...register("email")}
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            className={styles.submitButton}
          >
            {isLoading ? "Sending..." : "Send Reset Link"}
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

