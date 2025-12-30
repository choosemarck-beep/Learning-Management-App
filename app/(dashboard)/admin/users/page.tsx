import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma/client";
import { AdminLayout } from "@/components/layout/admin/AdminLayout";
import { UsersManagementPage } from "@/components/features/admin/UsersManagementPage";

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Role check - only ADMIN and SUPER_ADMIN can access
  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
    redirect("/login");
  }

  try {
    // Fetch all users for user management table
    let allUsers: Array<{
      id: string;
      name: string;
      email: string;
      employeeNumber: string | null;
      phone: string | null;
      hireType: "DIRECT_HIRE" | "AGENCY" | null;
      department: string | null;
      branch: string | null;
      hireDate: Date | null;
      status: string;
      role: string;
      createdAt: Date;
      updatedAt: Date;
      approvedAt: Date | null;
      company: { id: string; name: string; type: string } | null;
      position: { id: string; title: string; role: string } | null;
    }> = [];
    let companies: Array<{ id: string; name: string }> = [];
    
    try {
      console.log("[AdminUsers] Fetching users data for admin:", user.id);
      [allUsers, companies] = await Promise.all([
        prisma.user.findMany({
          select: {
            id: true,
            name: true,
            email: true,
            employeeNumber: true,
            phone: true,
            hireType: true,
            department: true,
            branch: true,
            hireDate: true,
            status: true,
            role: true,
            createdAt: true,
            updatedAt: true,
            approvedAt: true,
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
        prisma.company.findMany({
          where: { isActive: true },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        }),
      ]);
      
      console.log("[AdminUsers] Successfully fetched users data:", {
        usersCount: allUsers.length,
        companiesCount: companies.length,
      });
    } catch (dbError) {
      console.error("[AdminUsers] Error fetching users data:", dbError);
      allUsers = [];
      companies = [];
    }

    // Serialize users data
    const serializableUsers = allUsers.map((u) => ({
      id: String(u.id),
      name: String(u.name || ''),
      email: String(u.email || ''),
      employeeNumber: u.employeeNumber ? String(u.employeeNumber) : null,
      phone: u.phone ? String(u.phone) : null,
      hireType: u.hireType,
      department: u.department ? String(u.department) : null,
      branch: u.branch ? String(u.branch) : null,
      hireDate: u.hireDate instanceof Date ? u.hireDate.toISOString() : null,
      status: String(u.status || ''),
      role: String(u.role || ''),
      createdAt: u.createdAt instanceof Date ? u.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: u.updatedAt instanceof Date ? u.updatedAt.toISOString() : new Date().toISOString(),
      approvedAt: u.approvedAt instanceof Date ? u.approvedAt.toISOString() : null,
      company: u.company ? {
        id: String(u.company.id),
        name: String(u.company.name || ''),
        type: String(u.company.type || ''),
      } : null,
      position: u.position ? {
        id: String(u.position.id),
        title: String(u.position.title || ''),
        role: String(u.position.role || ''),
      } : null,
    }));

    // Serialize companies data
    const serializableCompanies = companies.map((c) => ({
      id: String(c.id),
      name: String(c.name || ''),
    }));

    const safeUserName = String(user.name || 'Admin');
    const safeUserEmail = String(user.email || '');
    const safeUserAvatar = user.avatar ? String(user.avatar) : null;
    const safeUserRole = (user.role === "ADMIN" || user.role === "SUPER_ADMIN") 
      ? user.role as "ADMIN" | "SUPER_ADMIN"
      : "ADMIN";

    return (
      <AdminLayout
        userRole={safeUserRole}
        userName={safeUserName}
        userEmail={safeUserEmail}
        userAvatar={safeUserAvatar}
        pageTitle="Users Management"
        pageDescription="Manage users, approve applications, and create trainer accounts."
      >
        <UsersManagementPage
          initialUsers={serializableUsers}
          companies={serializableCompanies}
        />
      </AdminLayout>
    );
  } catch (error) {
    console.error("[AdminUsers] Error:", error);
    return (
      <div style={{ padding: "var(--spacing-lg)", textAlign: "center" }}>
        <h2 style={{ color: "var(--color-error)", marginBottom: "var(--spacing-md)" }}>
          Error Loading Users
        </h2>
        <p style={{ color: "var(--color-text-secondary)" }}>
          An error occurred while loading users. Please try refreshing the page.
        </p>
      </div>
    );
  }
}

