"use client";

import React from "react";
import { GalaxyBackground } from "@/components/ui/GalaxyBackground";
import styles from "./error.module.css";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  return (
    <>
      <GalaxyBackground starCount={150} meteorCount={3} />
      <div className={styles.container}>
        <div className={styles.content}>
          <h1 className={styles.title}>Something went wrong!</h1>
          <p className={styles.message}>
            {error.message || "An unexpected error occurred"}
          </p>
          <div className={styles.actions}>
            <button
              onClick={reset}
              className={`${styles.button} ${styles.primaryButton}`}
            >
              Try again
            </button>
            <button
              onClick={() => (window.location.href = "/")}
              className={`${styles.button} ${styles.secondaryButton}`}
            >
              Go home
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

