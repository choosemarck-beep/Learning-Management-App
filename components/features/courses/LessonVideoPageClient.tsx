"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { LessonVideoPlayer } from "./LessonVideoPlayer";
import { QuizModal } from "./QuizModal";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import styles from "./LessonVideoPageClient.module.css";

interface LessonData {
  lesson: {
    id: string;
    title: string;
    description: string;
    videoUrl: string | null;
    videoDuration: number | null;
    minimumWatchTime: number | null;
    videoThumbnail: string | null;
    order: number;
    totalXP: number;
  };
  module: {
    id: string;
    title: string;
    order: number;
  };
  course: {
    id: string;
    title: string;
  };
  quizTask: {
    id: string;
    title: string;
    content: string;
    xpReward: number;
  } | null;
  watchProgress: {
    watchedSeconds: number;
    isCompleted: boolean;
    lastWatchedAt: Date | null;
  };
  canTakeQuiz: boolean;
}

interface LessonVideoPageClientProps {
  lessonId: string;
  initialData: LessonData;
}

export const LessonVideoPageClient: React.FC<LessonVideoPageClientProps> = ({
  lessonId,
  initialData,
}) => {
  const router = useRouter();
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [canTakeQuiz, setCanTakeQuiz] = useState(initialData.canTakeQuiz);

  const handleQuizClick = () => {
    if (canTakeQuiz && initialData.quizTask) {
      setIsQuizOpen(true);
    }
  };

  const handleQuizComplete = (score: number, xpEarned: number) => {
    // Quiz completion is handled by the API
    // We can show a toast or update UI here if needed
    console.log(`Quiz completed! Score: ${score}%, XP: ${xpEarned}`);
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Button
          variant="ghost"
          onClick={handleBack}
          className={styles.backButton}
        >
          <ArrowLeft size={20} />
        </Button>
        <div className={styles.titleSection}>
          <span className={styles.courseLabel}>
            {initialData.course.title}
          </span>
          <h1 className={styles.title}>{initialData.lesson.title}</h1>
        </div>
      </div>

      <LessonVideoPlayer
        lessonId={lessonId}
        videoUrl={initialData.lesson.videoUrl}
        videoThumbnail={initialData.lesson.videoThumbnail}
        videoDuration={initialData.lesson.videoDuration}
        minimumWatchTime={initialData.lesson.minimumWatchTime || 0}
        initialWatchedSeconds={initialData.watchProgress.watchedSeconds}
        canTakeQuiz={canTakeQuiz}
        quizTaskId={initialData.quizTask?.id || null}
        quizTaskTitle={initialData.quizTask?.title}
        onQuizClick={handleQuizClick}
      />

      {initialData.quizTask && (
        <QuizModal
          taskId={initialData.quizTask.id}
          quizContent={initialData.quizTask.content}
          xpReward={initialData.quizTask.xpReward}
          isOpen={isQuizOpen}
          onClose={() => setIsQuizOpen(false)}
          onComplete={handleQuizComplete}
        />
      )}
    </div>
  );
};

