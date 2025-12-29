"use client";

import React from "react";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import styles from "./page.module.css";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error("[TrainerDashboardError] Error boundary caught:", {
    message: error.message,
    stack: error.stack,
    digest: error.digest,
  });

  return (
    <div className={styles.container}>
      <Card>
        <CardBody>
          <h2 style={{ color: "var(--color-error)", marginBottom: "var(--spacing-md)" }}>
            Dashboard Error
          </h2>
          <p style={{ marginBottom: "var(--spacing-md)", color: "var(--color-text-secondary)" }}>
            {error.message || "An unexpected error occurred while loading the dashboard."}
          </p>
          <div style={{ display: "flex", gap: "var(--spacing-sm)" }}>
            <Button
              onClick={() => reset()}
              variant="primary"
            >
              Try Again
            </Button>
            <Button
              onClick={() => window.location.href = "/employee/trainer/dashboard"}
              variant="secondary"
            >
              Reload Page
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

