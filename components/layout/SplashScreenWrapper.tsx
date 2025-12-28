"use client";

import React, { useState, useEffect } from "react";
import { SplashScreen } from "@/components/ui/SplashScreen";
import { usePathname } from "next/navigation";

interface SplashScreenWrapperProps {
  children: React.ReactNode;
}

export const SplashScreenWrapper: React.FC<SplashScreenWrapperProps> = ({
  children,
}) => {
  const [showSplash, setShowSplash] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsClient(true);
    
    // Check if splash screen should be shown
    // Show splash screen on first visit (not in sessionStorage)
    // Don't show on admin/super-admin pages
    const hasSeenSplash = sessionStorage.getItem("splashShown");
    const isAdminRoute = pathname?.startsWith("/admin") || pathname?.startsWith("/super-admin");
    
    if (!hasSeenSplash && !isAdminRoute) {
      setShowSplash(true);
      // Mark as shown in sessionStorage
      sessionStorage.setItem("splashShown", "true");
    }
  }, [pathname]);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  // Don't render anything until client-side hydration is complete
  if (!isClient) {
    return <>{children}</>;
  }

  return (
    <>
      {showSplash && (
        <SplashScreen
          duration={3000}
          onComplete={handleSplashComplete}
          showProgress={true}
        />
      )}
      {!showSplash && children}
    </>
  );
};

