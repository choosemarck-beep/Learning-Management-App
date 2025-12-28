"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardBody, CardFooter } from "@/components/ui/Card";
import { ProgressIndicator } from "@/components/features/signup/ProgressIndicator";
import { PersonalInfoStep } from "@/components/features/signup/PersonalInfoStep";
import { EmployeeBasicInfoStep } from "@/components/features/signup/EmployeeBasicInfoStep";
import { EmployeeDetailsStep } from "@/components/features/signup/EmployeeDetailsStep";
import { AccountSetupStep } from "@/components/features/signup/AccountSetupStep";
import styles from "./page.module.css";

const TOTAL_STEPS = 4;

const signupSchema = z
  .object({
    // Step 1: Personal Information
    firstName: z.string().min(1, "First name is required").min(2, "First name must be at least 2 characters"),
    lastName: z.string().min(1, "Last name is required").min(2, "Last name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    phone: z
      .string()
      .regex(
        /^(\+63|0)?9\d{9}$/,
        "Please enter a valid Philippines phone number (e.g., 09123456789 or +639123456789)"
      )
      .min(10, "Phone number must be at least 10 characters"),
    // Step 2: Employee Details
    employeeNumber: z.string().min(1, "Employee number is required"),
    hireType: z.enum(["DIRECT_HIRE", "AGENCY"], {
      required_error: "Please select a hire type",
    }),
    companyId: z.string().min(1, "Please select a company or agency"),
    positionId: z.string().min(1, "Please select a position"),
    department: z.string().min(1, "Department is required"),
    branch: z.string().min(1, "Branch is required"),
    hireDate: z
      .string()
      .min(1, "Hire date is required")
      .refine(
        (date) => {
          if (!date) return false;
          const selectedDate = new Date(date);
          const today = new Date();
          today.setHours(23, 59, 59, 999); // End of today
          return selectedDate <= today;
        },
        {
          message: "Hire date cannot be in the future",
        }
      ),
    // Step 3: Account Setup
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(
        /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
        "Password must contain at least one special character"
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type SignupFormData = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const stepContentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number | "auto">("auto");

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    trigger,
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    mode: "onChange",
  });

  const validateStep = async (step: number): Promise<boolean> => {
    let fieldsToValidate: (keyof SignupFormData)[] = [];

    switch (step) {
      case 1:
        fieldsToValidate = ["firstName", "lastName", "email", "phone"];
        break;
      case 2:
        fieldsToValidate = ["employeeNumber", "hireType", "companyId"];
        break;
      case 3:
        fieldsToValidate = ["positionId", "department", "branch", "hireDate"];
        break;
      case 4:
        fieldsToValidate = ["password", "confirmPassword"];
        break;
    }

    const result = await trigger(fieldsToValidate);
    return result;
  };

  const handleNext = async () => {
    const isValid = await validateStep(currentStep);
    if (!isValid) {
      // Show toast for validation errors instead of inline
      const stepErrors = Object.keys(errors).filter((key) => {
        const fieldKey = key as keyof SignupFormData;
        switch (currentStep) {
          case 1:
            return ["name", "email", "phone"].includes(key);
          case 2:
            return ["employeeNumber", "hireType", "companyId"].includes(key);
          case 3:
            return ["positionId", "department", "branch", "hireDate"].includes(key);
          case 4:
            return ["password", "confirmPassword"].includes(key);
          default:
            return false;
        }
      });

      if (stepErrors.length > 0) {
        const firstError = stepErrors[0] as keyof SignupFormData;
        const errorMessage = errors[firstError]?.message || "Please fill in all required fields";
        toast.error(errorMessage);
      } else {
        toast.error("Please fill in all required fields");
      }
      return;
    }
    if (isValid && currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        const errorMessage = result.error || "An error occurred. Please try again.";
        toast.error(errorMessage);
        setIsLoading(false);
        return;
      }

      // Show success toast notification
      toast.success(
        "Account created successfully! Your enrollment is subject to approval. Please check your email for confirmation.",
        {
          duration: 5000,
        }
      );

      // Redirect to login page after a short delay to show the toast
      setTimeout(() => {
        router.push("/login");
      }, 500);
    } catch (err) {
      toast.error("An error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  // Measure content height and update on step change or error changes
  useEffect(() => {
    // Small delay to ensure DOM is updated
    const timer = setTimeout(() => {
      if (stepContentRef.current) {
        const height = stepContentRef.current.scrollHeight;
        setContentHeight(height);
      }
    }, 10);
    return () => clearTimeout(timer);
  }, [currentStep, errors]);

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <PersonalInfoStep
            register={register}
            errors={errors}
          />
        );
      case 2:
        return (
          <EmployeeBasicInfoStep
            register={register}
            errors={errors}
            watch={watch}
            setValue={setValue}
          />
        );
      case 3:
        return (
          <EmployeeDetailsStep
            register={register}
            errors={errors}
            watch={watch}
            setValue={setValue}
          />
        );
        case 4:
          return (
            <AccountSetupStep
              register={register}
              errors={errors}
              watch={watch}
            />
          );
      default:
        return null;
    }
  };

  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <CardHeader>
          <h1 className={styles.title}>Join the Squad!</h1>
          <p className={styles.subtitle}>Start your learning adventure today</p>
          <ProgressIndicator
            currentStep={currentStep}
            totalSteps={TOTAL_STEPS}
            className={styles.progress}
          />
        </CardHeader>
        <CardBody>
          <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
            <motion.div
              animate={{ height: contentHeight }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className={styles.stepContentWrapper}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  ref={stepContentRef}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ 
                    duration: 0.2
                  }}
                  className={styles.stepContent}
                  onAnimationComplete={() => {
                    // Re-measure height after animation completes
                    setTimeout(() => {
                      if (stepContentRef.current) {
                        const height = stepContentRef.current.scrollHeight;
                        setContentHeight(height);
                      }
                    }, 50);
                  }}
                >
                  {renderStep()}
                </motion.div>
              </AnimatePresence>
            </motion.div>

            <div className={styles.navigation}>
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="secondary"
                  size="lg"
                  onClick={handleBack}
                  disabled={isLoading}
                >
                  Back
                </Button>
              )}
              {currentStep < TOTAL_STEPS ? (
                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  onClick={handleNext}
                  disabled={isLoading}
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={isLoading}
                >
                  Create Account
                </Button>
              )}
            </div>
          </form>
        </CardBody>
        <CardFooter>
          <p className={styles.footerText}>
            Already have an account?{" "}
            <Link href="/login" className={styles.link}>
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
