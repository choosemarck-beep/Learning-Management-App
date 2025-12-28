import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/utils";

export default async function AdminPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Redirect to admin dashboard
  redirect("/admin/dashboard");
}

