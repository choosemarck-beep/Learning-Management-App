import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/utils";

export default async function AdminUsersPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Role check - only ADMIN and SUPER_ADMIN can access
  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
    redirect("/login");
  }

  // Redirect to dashboard which has the user management table
  redirect("/admin/dashboard");
}

