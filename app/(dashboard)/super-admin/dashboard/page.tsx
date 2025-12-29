/**
 * Super Admin Dashboard Page - DESKTOP ONLY
 * 
 * This page uses UserManagementTabs and UsersTable components which are
 * desktop-optimized and should NOT be used on mobile devices.
 * 
 * For Regional/Area/Branch Managers, use ManagementPage component which
 * is mobile-first (320px-428px viewport).
 */
import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma/client";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { AdminLayout } from "@/components/layout/admin/AdminLayout";

export const dynamic = 'force-dynamic';
import { StatsCard } from "@/components/features/admin/StatsCard";
import { UserManagementTabs } from "@/components/features/admin/UserManagementTabs";
import { Shield } from "lucide-react";
import styles from "./page.module.css";

export default async function SuperAdminDashboardPage() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      redirect("/login");
    }

    // Role check - only SUPER_ADMIN can access
    if (user.role !== "SUPER_ADMIN") {
      if (user.role === "ADMIN") {
        redirect("/admin/dashboard");
      } else {
        redirect("/employee/profile");
      }
    }

    // Fetch all users for initial render with error handling
    let allUsers, totalUsers, rejectedUsers, pendingUsers, adminCount;
    try {
      [allUsers, totalUsers, rejectedUsers, pendingUsers, adminCount] = await Promise.all([
        prisma.user.findMany({
          include: {
            company: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
            position: {
              select: {
                id: true,
                title: true,
                role: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        }),
        // Get total counts for stats
        prisma.user.count(),
        prisma.user.count({ where: { status: "REJECTED" } }),
        prisma.user.count({ where: { status: "PENDING" } }),
        prisma.user.count({ where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } } }),
      ]);
    } catch (dbError) {
      console.error("Error fetching super admin dashboard data:", dbError);
      // Use empty defaults if database query fails
      allUsers = [];
      totalUsers = 0;
      rejectedUsers = 0;
      pendingUsers = 0;
      adminCount = 0;
    }

  return (
    <AdminLayout
      userRole="SUPER_ADMIN"
      userName={user.name}
      userEmail={user.email}
      userAvatar={user.avatar}
      pageTitle="Dashboard"
      pageDescription="Overview of users and system statistics."
    >
      <div className={styles.container}>

        {/* Stats Grid */}
        <div className={styles.statsGrid}>
          <StatsCard
            label="Total Users"
            value={totalUsers}
          />
          <StatsCard
            label="Pending"
            value={pendingUsers}
          />
          <StatsCard
            label="Rejected"
            value={rejectedUsers}
          />
          <StatsCard
            label="Admins"
            value={adminCount}
            icon={<Shield size={18} />}
          />
        </div>

        {/* User Management Table */}
        <Card className={styles.tableSection}>
          <CardBody>
            <UserManagementTabs initialUsers={allUsers} />
          </CardBody>
        </Card>
      </div>
    </AdminLayout>
  );
  } catch (error) {
    console.error("Error in SuperAdminDashboardPage:", error);
    redirect("/login");
  }
}

