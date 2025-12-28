import React from "react";
import { GalaxyBackground } from "@/components/ui/GalaxyBackground";
import styles from "./layout.module.css";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <GalaxyBackground starCount={150} meteorCount={3} />
      <div className={styles.container}>
        <div className={styles.content}>{children}</div>
      </div>
    </>
  );
}

