import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma/client";
import { userUpdateSchema } from "@/lib/validation/schemas";
import { z } from "zod";

export const dynamic = 'force-dynamic';

// DELETE user
export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // Wrap getCurrentUser in try-catch
    let user;
    try {
      user = await getCurrentUser();
    } catch (authError) {
      console.error("Error getting current user:", authError);
      return NextResponse.json(
        { success: false, error: "Authentication error" },
        { status: 401 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is admin or super admin
    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    const { userId } = params;

    // Prevent self-deletion
    if (userId === user.id) {
      return NextResponse.json(
        { success: false, error: "Cannot delete your own account" },
        { status: 400 }
      );
    }

    // Wrap Prisma queries in try-catch
    try {
      // Check if user exists
      const userToDelete = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!userToDelete) {
        return NextResponse.json(
          { success: false, error: "User not found" },
          { status: 404 }
        );
      }

      // Prevent deleting super admin (only super admin can delete super admin)
      if (userToDelete.role === "SUPER_ADMIN" && user.role !== "SUPER_ADMIN") {
        return NextResponse.json(
          { success: false, error: "Forbidden - Only super admin can delete super admin accounts" },
          { status: 403 }
        );
      }

      // Delete user (cascade will handle related records)
      await prisma.user.delete({
        where: { id: userId },
      });

      return NextResponse.json(
        {
          success: true,
          message: "User deleted successfully",
        },
        { status: 200 }
      );
    } catch (dbError) {
      console.error("Database error deleting user:", dbError);
      return NextResponse.json(
        { success: false, error: "Failed to delete user" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Unexpected error in DELETE /api/admin/users/[userId]:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

// UPDATE user
export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // Wrap getCurrentUser in try-catch
    let user;
    try {
      user = await getCurrentUser();
    } catch (authError) {
      console.error("Error getting current user:", authError);
      return NextResponse.json(
        { success: false, error: "Authentication error" },
        { status: 401 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is admin or super admin
    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    const { userId } = params;
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        { success: false, error: "Invalid request body" },
        { status: 400 }
      );
    }

    // Validate request body
    let validatedData;
    try {
      validatedData = userUpdateSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            success: false,
            error: "Validation error",
            details: error.errors,
          },
          { status: 400 }
        );
      }
      throw error;
    }

    // Wrap Prisma queries in try-catch
    try {
      // Check if user exists
      const userToUpdate = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!userToUpdate) {
        return NextResponse.json(
          { success: false, error: "User not found" },
          { status: 404 }
        );
      }

      // Prevent editing super admin (only super admin can edit super admin)
      if (userToUpdate.role === "SUPER_ADMIN" && user.role !== "SUPER_ADMIN") {
        return NextResponse.json(
          { success: false, error: "Forbidden - Only super admin can edit super admin accounts" },
          { status: 403 }
        );
      }

      // Update user
      const updateData: any = {};
      if (validatedData.name !== undefined) updateData.name = validatedData.name;
      if (validatedData.email !== undefined) updateData.email = validatedData.email;
      if (validatedData.phone !== undefined) updateData.phone = validatedData.phone;
      if (validatedData.employeeNumber !== undefined) updateData.employeeNumber = validatedData.employeeNumber;
      if (validatedData.department !== undefined) updateData.department = validatedData.department;
      if (validatedData.branch !== undefined) updateData.branch = validatedData.branch;
      if (validatedData.hireDate !== undefined) {
        updateData.hireDate = validatedData.hireDate ? new Date(validatedData.hireDate) : null;
      }
      if (validatedData.companyId !== undefined) updateData.companyId = validatedData.companyId;
      if (validatedData.positionId !== undefined) updateData.positionId = validatedData.positionId;
      if (validatedData.role !== undefined) updateData.role = validatedData.role;
      if (validatedData.status !== undefined) updateData.status = validatedData.status;

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
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
      });

      return NextResponse.json(
        {
          success: true,
          message: "User updated successfully",
          data: updatedUser,
        },
        { status: 200 }
      );
    } catch (dbError) {
      console.error("Database error updating user:", dbError);
      return NextResponse.json(
        { success: false, error: "Failed to update user" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Unexpected error in PATCH /api/admin/users/[userId]:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

