import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/utils";

export default async function AdminSettingsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Role check - only ADMIN and SUPER_ADMIN can access
  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
    redirect("/login");
  }

  // For now, redirect to dashboard (settings page can be implemented later)
  redirect("/admin/dashboard");
}

