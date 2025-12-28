import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/utils";
import { QuizResultsClient } from "@/components/features/quiz/QuizResultsClient";
import styles from "./page.module.css";

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ taskId: string }>;
  searchParams: Promise<{ score?: string; xpEarned?: string }>;
}

export default async function QuizResultsPage({
  params,
  searchParams,
}: PageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  return (
    <div className={styles.container}>
      <QuizResultsClient
        taskId={resolvedParams.taskId}
        score={resolvedSearchParams.score ? parseInt(resolvedSearchParams.score) : null}
        xpEarned={resolvedSearchParams.xpEarned ? parseInt(resolvedSearchParams.xpEarned) : null}
      />
    </div>
  );
}

