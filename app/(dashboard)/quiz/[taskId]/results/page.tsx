import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/utils";
import { QuizResultsClient } from "@/components/features/quiz/QuizResultsClient";
import styles from "./page.module.css";

interface PageProps {
  params: { taskId: string };
  searchParams: { score?: string; xpEarned?: string };
}

export default async function QuizResultsPage({
  params,
  searchParams,
}: PageProps) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  return (
    <div className={styles.container}>
      <QuizResultsClient
        taskId={params.taskId}
        score={searchParams.score ? parseInt(searchParams.score) : null}
        xpEarned={searchParams.xpEarned ? parseInt(searchParams.xpEarned) : null}
      />
    </div>
  );
}

