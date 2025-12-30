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
import { ContinueAsCard } from "@/components/features/auth/ContinueAsCard";
import styles from "./page.module.css";

interface RememberedUser {
  email: string;
  name: string;
  avatar: string | null;
}

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Default to /dashboard - middleware will redirect to correct role-based dashboard
  // This prevents redirect loops when user role doesn't match the hardcoded dashboard route
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const [isLoading, setIsLoading] = useState(false);
  const [rememberedUser, setRememberedUser] = useState<RememberedUser | null>(null);
  const [showContinueAs, setShowContinueAs] = useState(false);

  // Check for remembered user on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("rememberedUser");
      if (stored) {
        try {
          const user = JSON.parse(stored) as RememberedUser;
          setRememberedUser(user);
          setShowContinueAs(true);
        } catch (error) {
          console.error("Error parsing remembered user:", error);
          localStorage.removeItem("rememberedUser");
        }
      }
    }
  }, []);

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
    setValue,
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

      // Check user approval status BEFORE attempting login
      // This ensures users get the approval message, not "wrong credentials"
      try {
        const approvalResponse = await fetch("/api/auth/check-approval", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: normalizedEmail }),
        });

        if (approvalResponse.ok) {
          const approvalData = await approvalResponse.json();
          if (approvalData.status === "PENDING") {
            toast.error(
              "Your account is pending approval. Please wait for the approval email before logging in."
            );
            setIsLoading(false);
            return;
          } else if (approvalData.status === "REJECTED") {
            toast.error(
              "Your account has been rejected. Please contact support for assistance."
            );
            setIsLoading(false);
            return;
          } else if (approvalData.status !== "APPROVED" && approvalData.status !== "UNKNOWN") {
            // If status is not APPROVED and not UNKNOWN (user doesn't exist), show approval message
            toast.error(
              "Your account is not yet approved. Please wait for the approval email before logging in."
            );
            setIsLoading(false);
            return;
          }
          // If status is APPROVED or UNKNOWN, proceed with login attempt
        }
      } catch (approvalError) {
        // If approval check fails, proceed with login attempt anyway
        // The authorize function will handle the approval check server-side
        console.error("Error checking approval status:", approvalError);
      }

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

      // Check for errors first - if there's an error, login failed
      if (result?.error) {
        // Handle approval status errors - show toast only, no inline error
        let errorMessage = "The email or password you entered is incorrect. Please try again.";
        if (result.error === "PENDING_APPROVAL") {
          errorMessage =
            "Your account is pending approval. Please wait for the approval email before logging in.";
        } else if (result.error === "ACCOUNT_REJECTED") {
          errorMessage =
            "Your account has been rejected. Please contact support for assistance.";
        } else if (result.error === "CredentialsSignin") {
          errorMessage = "The email or password you entered is incorrect. Please try again.";
        }
        console.error("Login failed:", result.error);
        toast.error(errorMessage);
        setIsLoading(false);
        return; // Exit early - don't proceed with redirect
      }

      // Only proceed if there's no error AND ok is true
      if (result?.ok && !result?.error) {
        // Wait for session to be available before redirecting
        // This ensures middleware can read the session and redirect correctly
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Fetch the session to get user role for direct redirect
        // This avoids the /dashboard -> role-based redirect loop
        try {
          const sessionResponse = await fetch("/api/auth/session");
          const session = await sessionResponse.json();
          const userRole = session?.user?.role;
          
          // Store user credentials in localStorage for "Continue as" feature
          if (session?.user && typeof window !== "undefined") {
            const userData: RememberedUser = {
              email: session.user.email || normalizedEmail,
              name: session.user.name || "",
              avatar: session.user.avatar || null,
            };
            localStorage.setItem("rememberedUser", JSON.stringify(userData));
          }
          
          // Determine redirect URL based on role
          let redirectUrl = callbackUrl;
          if (callbackUrl === "/dashboard" || !callbackUrl) {
            // Map role to dashboard URL
            switch (userRole) {
              case "SUPER_ADMIN":
                redirectUrl = "/super-admin/dashboard";
                break;
              case "ADMIN":
                redirectUrl = "/admin/dashboard";
                break;
              case "REGIONAL_MANAGER":
                redirectUrl = "/employee/regional-manager/dashboard";
                break;
              case "AREA_MANAGER":
                redirectUrl = "/employee/area-manager/dashboard";
                break;
              case "BRANCH_MANAGER":
                redirectUrl = "/employee/branch-manager/dashboard";
                break;
              case "EMPLOYEE":
                redirectUrl = "/employee/staff/dashboard";
                break;
              case "TRAINER":
                redirectUrl = "/employee/trainer/dashboard";
                break;
              default:
                redirectUrl = "/employee/staff/dashboard";
            }
          }
          
          console.log("Login successful, redirecting to:", redirectUrl, "for role:", userRole);
          
          // If we got a valid role, redirect directly
          if (userRole && redirectUrl) {
            // Use window.location for a hard redirect to ensure clean navigation
            // This bypasses Next.js router and prevents redirect loops
            window.location.href = redirectUrl;
            return; // Exit early to prevent further execution
          } else {
            console.warn("No role found in session, using fallback redirect");
            // Fallback: use callbackUrl and let middleware handle it
            console.log("Fallback: redirecting to:", callbackUrl);
            window.location.href = callbackUrl;
            return;
          }
        } catch (sessionError) {
          console.error("Error fetching session after login:", sessionError);
          // Fallback: use callbackUrl and let middleware handle it
          console.log("Fallback: redirecting to:", callbackUrl);
          window.location.href = callbackUrl;
          return;
        }
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

  const handleContinueAs = (email: string) => {
    setValue("email", email);
    setShowContinueAs(false);
    // Focus on password input
    setTimeout(() => {
      const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement;
      if (passwordInput) {
        passwordInput.focus();
      }
    }, 100);
  };

  const handleDismissContinueAs = () => {
    setShowContinueAs(false);
  };

  return (
    <div className={styles.container}>
      {/* Login Section with Carousel */}
      <div className={styles.loginSection}>
      {/* Intro Carousel */}
      <IntroCarousel className={styles.carousel} />

      {/* Continue As Card */}
      {showContinueAs && rememberedUser && (
        <ContinueAsCard
          user={rememberedUser}
          onContinue={handleContinueAs}
          onDismiss={handleDismissContinueAs}
        />
      )}

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

