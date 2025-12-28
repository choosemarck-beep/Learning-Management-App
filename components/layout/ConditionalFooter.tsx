"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Footer } from "./Footer";

interface ConditionalFooterProps {
  className?: string;
}

export const ConditionalFooter: React.FC<ConditionalFooterProps> = ({
  className,
}) => {
  const pathname = usePathname();
  
  // Hide footer for admin routes
  const isAdminRoute = pathname.startsWith("/admin/") || pathname.startsWith("/super-admin/");
  
  if (isAdminRoute) {
    return null;
  }
  
  return (
    <div className={className}>
      <Footer />
    </div>
  );
};

