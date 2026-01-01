"use client";

import React, { useState, useEffect } from "react";
import { SplashScreen } from "@/components/ui/SplashScreen";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface SplashScreenWrapperProps {
  children: React.ReactNode;
}

export const SplashScreenWrapper: React.FC<SplashScreenWrapperProps> = ({
  children,
}) => {
  const [showSplash, setShowSplash] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

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
    
    // Redirect to login if user is not authenticated
    // Only redirect if we're on the root path or a non-protected route
    if (!session && (pathname === "/" || pathname === "/login" || pathname === "/signup")) {
      router.push("/login");
    }
  };

  // Hide body/html background when splash is showing
  // CRITICAL: This useEffect must be called BEFORE any early returns to follow Rules of Hooks
  useEffect(() => {
    // Only run when client is ready
    if (!isClient) return;

    if (showSplash) {
      // Hide body and html backgrounds to prevent showing through
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
      // Set background to transparent so splash screen background shows
      document.body.style.backgroundColor = "transparent";
      document.documentElement.style.backgroundColor = "transparent";
    } else {
      // Restore defaults when splash is hidden
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      document.body.style.backgroundColor = "";
      document.documentElement.style.backgroundColor = "";
    }

    return () => {
      // Cleanup on unmount
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      document.body.style.backgroundColor = "";
      document.documentElement.style.backgroundColor = "";
    };
  }, [showSplash, isClient]);

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

