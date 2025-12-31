"use client";

import React from "react";
import { usePathname } from "next/navigation";
import styles from "./ConditionalMain.module.css";

interface ConditionalMainProps {
  children: React.ReactNode;
  className?: string;
}

export const ConditionalMain: React.FC<ConditionalMainProps> = ({
  children,
  className,
}) => {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith("/admin") || pathname.startsWith("/super-admin");
  const isTrainerRoute = pathname.startsWith("/employee/trainer");

  // Don't render main wrapper for admin or trainer routes (both use desktop layouts)
  if (isAdminRoute || isTrainerRoute) {
    return <>{children}</>;
  }

  return <main className={className}>{children}</main>;
};

