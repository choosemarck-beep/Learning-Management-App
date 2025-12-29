import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma/client";
import { ProfileBottomNav } from "@/components/layout/ProfileBottomNav";
import { TrainingQuizPageClient } from "@/components/features/courses/TrainingQuizPageClient";
import { randomizeQuizQuestions } from "@/lib/utils/quizRandomization";
import styles from "./page.module.css";

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ trainingId: string }>;
}

export default async function TrainingQuizPage({ params }: PageProps) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  // Await params in Next.js 14+ App Router
  const { trainingId } = await params;

  // Get dashboard route based on role
  const getDashboardRoute = () => {
    switch (currentUser.role) {
      case "BRANCH_MANAGER":
        return "/employee/branch-manager/dashboard";
      case "AREA_MANAGER":
        return "/employee/area-manager/dashboard";
      case "REGIONAL_MANAGER":
        return "/employee/regional-manager/dashboard";
      case "TRAINER":
        return "/employee/trainer/dashboard";
      case "EMPLOYEE":
      default:
        return "/employee/staff/dashboard";
    }
  };

  const dashboardRoute = getDashboardRoute();

  // Fetch training and quiz
  try {
    const training = await prisma.training.findUnique({
      where: { id: trainingId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            isPublished: true,
          },
        },
        quiz: {
          select: {
            id: true,
            title: true,
            passingScore: true,
            timeLimit: true,
            allowRetake: true,
            maxAttempts: true,
            questions: true,
            questionsToShow: true,
          },
        },
        trainingProgress: {
          where: {
            userId: currentUser.id,
          },
          take: 1,
        },
      },
    });

    if (!training) {
      redirect("/courses");
    }

    // Check if course is published
    if (!training.course.isPublished) {
      redirect("/courses");
    }

    // Check if training is published
    if (!training.isPublished) {
      redirect("/courses");
    }

    if (!training.quiz) {
      redirect(`/training/${trainingId}/video`);
    }

    // Check if user can take quiz
    const progress = training.trainingProgress[0];
    const minimumWatchTime = training.minimumWatchTime || 0;
    const watchedSeconds = progress?.videoWatchedSeconds || 0;
    const canTakeQuiz = watchedSeconds >= minimumWatchTime;

    if (!canTakeQuiz) {
      redirect(`/training/${trainingId}/video`);
    }

    // Check if quiz allows retake
    const existingAttempts = await prisma.quizAttempt.findMany({
      where: {
        userId: currentUser.id,
        quizId: training.quiz.id,
      },
      orderBy: {
        completedAt: "desc",
      },
    });

    const canRetake = training.quiz.allowRetake || existingAttempts.length === 0;
    const maxAttemptsReached = training.quiz.maxAttempts
      ? existingAttempts.length >= training.quiz.maxAttempts
      : false;

    if (!canRetake && existingAttempts.length > 0) {
      redirect(`/training/${trainingId}/video`);
    }

    if (maxAttemptsReached) {
      redirect(`/training/${trainingId}/video`);
    }

    // Calculate attempt number (1-based)
    const attemptNumber = existingAttempts.length + 1;

    // Parse and normalize quiz questions
    let parsedQuestions = [];
    try {
      parsedQuestions = JSON.parse(training.quiz.questions || "[]");
      // Normalize question options: convert string arrays to object arrays
      parsedQuestions = parsedQuestions.map((question: any) => {
        if (question.options && Array.isArray(question.options)) {
          // Check if options are strings (from trainer form) or objects
          const normalizedOptions = question.options.map((option: any, index: number) => {
            if (typeof option === 'string') {
              // Convert string to object format
              return {
                id: `opt-${question.id || `q-${index}`}-${index}`,
                text: option,
              };
            } else {
              // Already an object, ensure it has id and text
              return {
                id: option.id || `opt-${question.id || `q-${index}`}-${index}`,
                text: option.text || option.label || String(option),
              };
            }
          });
          return {
            ...question,
            options: normalizedOptions,
          };
        }
        return question;
      });
    } catch (error) {
      console.error("Error parsing quiz questions:", error);
      parsedQuestions = [];
    }

    // Apply randomization if questionsToShow is set
    let finalQuestions = parsedQuestions;
    if (training.quiz.questionsToShow && parsedQuestions.length > 0) {
      const randomized = randomizeQuizQuestions(
        parsedQuestions,
        training.quiz.questionsToShow,
        currentUser.id,
        attemptNumber
      );
      // Convert randomized questions back to the format expected by the client
      finalQuestions = randomized.map((q) => ({
        id: q.id,
        type: q.type,
        question: q.question,
        options: q.options.map(opt => ({
          id: opt.id,
          text: opt.text,
        })),
        correctAnswer: q.correctAnswer,
        points: q.points,
        explanation: q.explanation,
      }));
    }

    const quizData = {
      id: training.quiz.id,
      title: training.quiz.title,
      passingScore: training.quiz.passingScore,
      timeLimit: training.quiz.timeLimit,
      questions: finalQuestions,
    };

    const trainingData = {
      id: training.id,
      title: training.title,
      totalXP: training.totalXP,
    };

    const courseData = {
      id: training.course.id,
      title: training.course.title,
    };

    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <TrainingQuizPageClient
            trainingId={trainingId}
            quiz={quizData}
            training={trainingData}
            course={courseData}
          />
        </div>
        <ProfileBottomNav
          userRole={currentUser.role}
          dashboardRoute={dashboardRoute}
          disabled={true}
        />
      </div>
    );
  } catch (error) {
    console.error("Error loading training quiz:", error);
    redirect("/courses");
  }
}

