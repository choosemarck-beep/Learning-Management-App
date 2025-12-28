import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/utils";
import { QuizStartClient } from "@/components/features/quiz/QuizStartClient";
import styles from "./page.module.css";

interface PageProps {
  params: { taskId: string };
}

export default async function QuizStartPage({ params }: PageProps) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  return (
    <div className={styles.container}>
      <QuizStartClient taskId={params.taskId} />
    </div>
  );
}

