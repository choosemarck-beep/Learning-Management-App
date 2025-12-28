"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Clock, Award, HelpCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ProfileBottomNav } from "@/components/layout/ProfileBottomNav";
import toast from "react-hot-toast";
import styles from "./QuizStartClient.module.css";

interface QuizStartClientProps {
  taskId: string;
}

export const QuizStartClient: React.FC<QuizStartClientProps> = ({ taskId }) => {
  const router = useRouter();
  const [quizInfo, setQuizInfo] = useState<{
    title: string;
    description: string;
    questionCount: number;
    estimatedTime: number; // minutes
    xpReward: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchQuizInfo();
  }, [taskId]);

  const fetchQuizInfo = async () => {
    try {
      setIsLoading(true);
      // Placeholder: Fetch quiz information
      // In real implementation, this would call /api/tasks/[taskId]
      const response = await fetch(`/api/tasks/${taskId}`);
      const data = await response.json();

      if (data.success) {
        // Parse quiz content to get question count
        const quizContent = JSON.parse(data.data.task.content || "{}");
        const questionCount = quizContent.questions?.length || 0;
        const estimatedTime = Math.ceil(questionCount * 1.5); // 1.5 min per question

        setQuizInfo({
          title: data.data.task.title || "Quiz",
          description: "Complete this quiz to test your knowledge and earn XP!",
          questionCount,
          estimatedTime,
          xpReward: data.data.task.xpReward || 10,
        });
      } else {
        // Placeholder data if API fails
        setQuizInfo({
          title: "Training Quiz",
          description: "Complete this quiz to test your knowledge and earn XP!",
          questionCount: 5,
          estimatedTime: 8,
          xpReward: 50,
        });
      }
    } catch (error) {
      console.error("Error fetching quiz info:", error);
      // Placeholder data on error
      setQuizInfo({
        title: "Training Quiz",
        description: "Complete this quiz to test your knowledge and earn XP!",
        questionCount: 5,
        estimatedTime: 8,
        xpReward: 50,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartQuiz = () => {
    router.push(`/quiz/${taskId}/questions`);
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <p>Loading quiz...</p>
      </div>
    );
  }

  if (!quizInfo) {
    return (
      <div className={styles.errorContainer}>
        <p>Failed to load quiz information.</p>
      </div>
    );
  }

  return (
    <>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Quiz: {quizInfo.title}</h1>
          <p className={styles.description}>{quizInfo.description}</p>
        </div>

        <div className={styles.infoCards}>
          <div className={styles.infoCard}>
            <HelpCircle size={24} className={styles.infoIcon} />
            <div className={styles.infoContent}>
              <span className={styles.infoLabel}>Questions</span>
              <span className={styles.infoValue}>{quizInfo.questionCount}</span>
            </div>
          </div>

          <div className={styles.infoCard}>
            <Clock size={24} className={styles.infoIcon} />
            <div className={styles.infoContent}>
              <span className={styles.infoLabel}>Estimated Time</span>
              <span className={styles.infoValue}>{quizInfo.estimatedTime} min</span>
            </div>
          </div>

          <div className={styles.infoCard}>
            <Award size={24} className={styles.infoIcon} />
            <div className={styles.infoContent}>
              <span className={styles.infoLabel}>XP Reward</span>
              <span className={styles.infoValue}>+{quizInfo.xpReward}</span>
            </div>
          </div>
        </div>

        <div className={styles.instructions}>
          <h2 className={styles.instructionsTitle}>Instructions</h2>
          <ul className={styles.instructionsList}>
            <li>Read each question carefully</li>
            <li>Select the best answer for each question</li>
            <li>You can navigate between questions</li>
            <li>Review your answers before submitting</li>
            <li>You'll see your results immediately after submission</li>
          </ul>
        </div>

        <div className={styles.actions}>
          <Button
            variant="primary"
            onClick={handleStartQuiz}
            className={styles.startButton}
          >
            Start Quiz
            <ArrowRight size={20} />
          </Button>
        </div>
      </div>
      <ProfileBottomNav
        userRole="EMPLOYEE"
        dashboardRoute="/employee/staff/dashboard"
      />
    </>
  );
};

