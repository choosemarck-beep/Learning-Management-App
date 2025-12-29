/**
 * Admin Dashboard Page - DESKTOP ONLY
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
import { Card, CardBody } from "@/components/ui/Card";
import { AdminLayout } from "@/components/layout/admin/AdminLayout";

export const dynamic = 'force-dynamic';
import { StatsCard } from "@/components/features/admin/StatsCard";
import { AdminDashboardClient } from "@/components/features/admin/AdminDashboardClient";
import styles from "./page.module.css";

export default async function AdminDashboardPage() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      redirect("/login");
    }

    // Role check - only ADMIN and SUPER_ADMIN can access
    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      if (user.role === "REGIONAL_MANAGER") {
        redirect("/employee/regional-manager/dashboard");
      } else if (user.role === "AREA_MANAGER") {
        redirect("/employee/area-manager/dashboard");
      } else if (user.role === "BRANCH_MANAGER") {
        redirect("/employee/branch-manager/dashboard");
      } else if (user.role === "EMPLOYEE") {
        redirect("/employee/staff/dashboard");
      } else if (user.role === "TRAINER") {
        redirect("/employee/trainer/dashboard");
      } else {
        redirect("/login");
      }
    }

    // Fetch all users for initial render with error handling
    let allUsers: Array<{
      id: string;
      name: string;
      email: string;
      company: { id: string; name: string; type: string } | null;
      position: { id: string; title: string; role: string } | null;
    }> = [];
    let companies: Array<{ id: string; name: string }> = [];
    let totalUsers = 0;
    let rejectedUsers = 0;
    let pendingUsers = 0;
    try {
      [allUsers, companies, totalUsers, rejectedUsers, pendingUsers] = await Promise.all([
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
        // Fetch companies for trainer creation (positions no longer needed - default to Trainer)
        prisma.company.findMany({
          where: { isActive: true },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        }),
        // Get total counts for stats
        prisma.user.count(),
        prisma.user.count({ where: { status: "REJECTED" } }),
        prisma.user.count({ where: { status: "PENDING" } }),
      ]);
    } catch (dbError) {
      console.error("Error fetching admin dashboard data:", dbError);
      // Use empty defaults if database query fails
      allUsers = [];
      companies = [];
      totalUsers = 0;
      rejectedUsers = 0;
      pendingUsers = 0;
    }

  return (
    <AdminLayout
      userRole={user.role as "ADMIN" | "SUPER_ADMIN"}
      userName={user.name}
      userEmail={user.email}
      userAvatar={user.avatar}
      pageTitle="Dashboard"
      pageDescription="Overview of users and system statistics."
    >
      <AdminDashboardClient
        initialUsers={allUsers}
        companies={companies}
        stats={{
          totalUsers,
          rejectedUsers,
          pendingUsers,
        }}
      />
    </AdminLayout>
  );
  } catch (error) {
    console.error("Error in AdminDashboardPage:", error);
    redirect("/login");
  }
}
