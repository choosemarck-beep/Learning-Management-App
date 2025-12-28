import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/utils";
import { QuizQuestionsClient } from "@/components/features/quiz/QuizQuestionsClient";
import styles from "./page.module.css";

interface PageProps {
  params: { taskId: string };
}

export default async function QuizQuestionsPage({ params }: PageProps) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  return (
    <div className={styles.container}>
      <QuizQuestionsClient taskId={params.taskId} />
    </div>
  );
}

