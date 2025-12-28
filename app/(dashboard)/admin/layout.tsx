import React from "react";
import styles from "./layout.module.css";

// Admin routes use AdminLayout, so we don't need the regular dashboard layout
// This layout bypasses the mobile constraints from the parent dashboard layout
export default function AdminLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={styles.adminWrapper}>{children}</div>;
}

