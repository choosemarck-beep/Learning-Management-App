"use client";

import React from "react";
import { usePathname } from "next/navigation";
import styles from "./ConditionalContainer.module.css";

interface ConditionalContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const ConditionalContainer: React.FC<ConditionalContainerProps> = ({
  children,
  className,
}) => {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith("/admin") || pathname.startsWith("/super-admin");
  const isTrainerRoute = pathname.startsWith("/employee/trainer");

  // Don't render container for admin or trainer routes (both use desktop layouts)
  if (isAdminRoute || isTrainerRoute) {
    return <>{children}</>;
  }

  return <div className={className}>{children}</div>;
};

