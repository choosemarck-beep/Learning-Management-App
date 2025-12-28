"use client";

import React, { useState } from "react";
import { SplashScreen } from "@/components/ui/SplashScreen";
import { Button } from "@/components/ui/Button";
import styles from "./page.module.css";

export default function SplashDemoPage() {
  const [showSplash, setShowSplash] = useState(false);
  const [progress, setProgress] = useState<number | undefined>(undefined);

  const handleShowSplash = () => {
    setShowSplash(true);
    setProgress(undefined); // Use internal animation
  };

  const handleShowSplashWithCustomProgress = () => {
    setShowSplash(true);
    setProgress(0);
    // Simulate progress
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 10;
      setProgress(currentProgress);
      if (currentProgress >= 100) {
        clearInterval(interval);
      }
    }, 200);
  };

  const handleComplete = () => {
    setShowSplash(false);
    console.log("Splash screen completed!");
  };

  return (
    <div className={styles.container}>
      {showSplash ? (
        <SplashScreen
          duration={3000}
          onComplete={handleComplete}
          showProgress={true}
          progress={progress}
        />
      ) : (
        <div className={styles.demoContent}>
          <h1 className={styles.title}>Splash Screen Demo</h1>
          <p className={styles.description}>
            Click the buttons below to see the splash screen in action.
          </p>
          <div className={styles.buttons}>
            <Button
              variant="primary"
              size="lg"
              onClick={handleShowSplash}
              className={styles.button}
            >
              Show Splash (Auto Progress)
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={handleShowSplashWithCustomProgress}
              className={styles.button}
            >
              Show Splash (Custom Progress)
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

