import React from "react";
import { Header } from "@/components/layout/Header";
import { Navigation } from "@/components/layout/Navigation";
import { ConditionalGalaxyBackground } from "@/components/ui/ConditionalGalaxyBackground";
import { ConditionalContainer } from "@/components/layout/ConditionalContainer";
import { getCurrentUser } from "@/lib/auth/utils";
import styles from "./layout.module.css";

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get user for navigation, but don't block rendering if there's an error
  // Individual pages will handle authentication
  let user;
  try {
    user = await getCurrentUser();
  } catch (error) {
    console.error("Error getting user in layout:", error);
    // Continue rendering - pages will handle auth
  }

  return (
    <>
      <ConditionalGalaxyBackground starCount={150} meteorCount={3} />
      {/* ConditionalContainer will not render container div for admin routes */}
      <ConditionalContainer className={styles.container}>
        {/* Header removed */}
        <main className={styles.main}>{children}</main>
        <div className={styles.regularNavigation}>
          <Navigation />
        </div>
      </ConditionalContainer>
    </>
  );
}

