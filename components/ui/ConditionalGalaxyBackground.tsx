"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { GalaxyBackground } from "@/components/ui/GalaxyBackground";

interface ConditionalGalaxyBackgroundProps {
  starCount?: number;
  meteorCount?: number;
}

export const ConditionalGalaxyBackground: React.FC<ConditionalGalaxyBackgroundProps> = ({ 
  starCount = 150, 
  meteorCount = 3 
}) => {
  const [galaxyEnabled, setGalaxyEnabled] = useState<boolean>(true);
  const pathname = usePathname();

  useEffect(() => {
    // Disable galaxy background for Reels page (full screen videos)
    if (pathname === "/reels") {
      setGalaxyEnabled(false);
      return;
    }

    // Check theme settings from data attribute
    const checkTheme = () => {
      const root = document.documentElement;
      const enabled = root.getAttribute("data-galaxy-enabled");
      setGalaxyEnabled(enabled !== "false"); // Default to true if not set
    };

    // Check immediately
    checkTheme();

    // Watch for changes (when theme is updated)
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-galaxy-enabled"],
    });

    return () => observer.disconnect();
  }, [pathname]);

  if (!galaxyEnabled) {
    return null;
  }

  return <GalaxyBackground starCount={starCount} meteorCount={meteorCount} />;
};

