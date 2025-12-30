import { getCurrentUser } from "@/lib/auth/utils";
import { redirect } from "next/navigation";
import { LeaderboardPageClient } from "@/components/features/leaderboard/LeaderboardPageClient";

export const dynamic = 'force-dynamic';

export default async function LeaderboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Pass null initial data - client component will fetch on mount
  // This avoids server-side fetch complexity with cookies
  return <LeaderboardPageClient initialData={null} />;
}

