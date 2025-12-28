"use client";

import React, { useState, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { IntroCarousel } from "@/components/features/IntroCarousel";
import styles from "./page.module.css";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Default to staff dashboard instead of legacy /dashboard route
  // The middleware will redirect to the correct role-based dashboard
  const callbackUrl = searchParams.get("callbackUrl") || "/employee/staff/dashboard";
  const [isLoading, setIsLoading] = useState(false);

  // Show toast for URL message parameter (fallback for direct URL access)
  useEffect(() => {
    const message = searchParams.get("message");
    if (message) {
      toast.success(decodeURIComponent(message), {
        duration: 5000,
      });
      // Clean up URL parameter
      router.replace("/login", { scroll: false });
    }
  }, [searchParams, router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);

    try {
      // Normalize email and trim password on client side too
      const normalizedEmail = data.email.toLowerCase().trim();
      const trimmedPassword = data.password.trim();

      console.log("Login attempt:", { 
        email: normalizedEmail, 
        passwordLength: trimmedPassword.length,
        originalEmail: data.email,
        originalPasswordLength: data.password.length
      });

      const result = await signIn("credentials", {
        email: normalizedEmail,
        password: trimmedPassword,
        redirect: false,
      });

      console.log("SignIn result:", { 
        error: result?.error, 
        ok: result?.ok, 
        status: result?.status,
        url: result?.url 
      });

      if (result?.error) {
        // Handle approval status errors - show toast only, no inline error
        let errorMessage = "The email or password you entered is incorrect. Please try again.";
        if (result.error === "PENDING_APPROVAL") {
          errorMessage =
            "Your account is pending approval. Please wait for email confirmation before logging in.";
        } else if (result.error === "ACCOUNT_REJECTED") {
          errorMessage =
            "Your account has been rejected. Please contact support for assistance.";
        } else if (result.error === "CredentialsSignin") {
          errorMessage = "The email or password you entered is incorrect. Please try again.";
        }
        console.error("Login failed:", result.error);
        toast.error(errorMessage);
        setIsLoading(false);
      } else if (result?.ok) {
        console.log("Login successful, redirecting to:", callbackUrl);
        router.push(callbackUrl);
        router.refresh();
      } else {
        console.error("Unexpected login result:", result);
        toast.error("Something went wrong. Please try again in a moment.");
        setIsLoading(false);
      }
    } catch (err) {
      console.error("Login error:", err);
      toast.error("Something went wrong. Please try again in a moment.");
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Login Section with Carousel */}
      <div className={styles.loginSection}>
      {/* Intro Carousel */}
      <IntroCarousel className={styles.carousel} />

      {/* Login Form */}
        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
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

          <div className={styles.inputGroup}>
            <PasswordInput
              label="Password"
              placeholder="Enter your password"
              required
              error={errors.password?.message}
              {...register("password")}
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            className={styles.submitButton}
          >
            {isLoading ? "Signing you in..." : "Sign In"}
          </Button>

          <div className={styles.forgotPasswordLink}>
            <Link href="/forgot-password" className={styles.forgotPasswordText}>
              Forgot Password?
            </Link>
          </div>
        </form>

        <div className={styles.signupLink}>
          <p className={styles.signupText}>
            New to the platform?{" "}
            <Link href="/signup" className={styles.signupLinkText}>
              Join the Squad
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className={styles.container}>
        <div className={styles.loginSection}>
      <div className={styles.loadingText}>
        Loading...
      </div>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}

