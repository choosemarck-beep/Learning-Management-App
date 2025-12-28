"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, Eye } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ProfileBottomNav } from "@/components/layout/ProfileBottomNav";
import { QuizReviewScreen } from "./QuizReviewScreen";
import toast from "react-hot-toast";
import styles from "./QuizQuestionsClient.module.css";

interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface QuizQuestion {
  id: string;
  question: string;
  type: string;
  options: QuizOption[];
}

interface QuizQuestionsClientProps {
  taskId: string;
}

export const QuizQuestionsClient: React.FC<QuizQuestionsClientProps> = ({
  taskId,
}) => {
  const router = useRouter();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReview, setShowReview] = useState(false);

  useEffect(() => {
    fetchQuizQuestions();
  }, [taskId]);

  const fetchQuizQuestions = async () => {
    try {
      setIsLoading(true);
      // Placeholder: Fetch quiz questions
      const response = await fetch(`/api/tasks/${taskId}`);
      const data = await response.json();

      if (data.success) {
        const quizContent = JSON.parse(data.data.task.content || "{}");
        setQuestions(quizContent.questions || []);
      } else {
        // Placeholder questions for preview
        setQuestions([
          {
            id: "q1",
            question: "What is the main purpose of this training?",
            type: "multiple-choice",
            options: [
              { id: "a1", text: "Option A", isCorrect: false },
              { id: "a2", text: "Option B", isCorrect: true },
              { id: "a3", text: "Option C", isCorrect: false },
              { id: "a4", text: "Option D", isCorrect: false },
            ],
          },
          {
            id: "q2",
            question: "Which of the following is a best practice?",
            type: "multiple-choice",
            options: [
              { id: "b1", text: "Option A", isCorrect: true },
              { id: "b2", text: "Option B", isCorrect: false },
              { id: "b3", text: "Option C", isCorrect: false },
            ],
          },
        ]);
      }
    } catch (error) {
      console.error("Error fetching quiz questions:", error);
      toast.error("Failed to load quiz questions");
      // Placeholder questions on error
      setQuestions([
        {
          id: "q1",
          question: "Placeholder Question 1?",
          type: "multiple-choice",
          options: [
            { id: "a1", text: "Answer A", isCorrect: false },
            { id: "a2", text: "Answer B", isCorrect: true },
          ],
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerSelect = (questionId: string, answerId: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answerId,
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Last question - show review screen
      setShowReview(true);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = async () => {
    // Check if all questions are answered
    const unansweredQuestions = questions.filter((q) => !answers[q.id]);
    if (unansweredQuestions.length > 0) {
      toast.error(
        `Please answer all questions. ${unansweredQuestions.length} question(s) remaining.`
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/tasks/${taskId}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ answers }),
      });

      const data = await response.json();

      if (data.success) {
        // Store results in sessionStorage for detailed review
        sessionStorage.setItem(
          `quiz_results_${taskId}`,
          JSON.stringify({
            results: data.data.results,
            score: data.data.score,
            xpEarned: data.data.xpEarned,
            timestamp: Date.now(),
          })
        );

        // Navigate to results page with score and XP
        router.push(
          `/quiz/${taskId}/results?score=${data.data.score}&xpEarned=${data.data.xpEarned}`
        );
      } else {
        toast.error(data.error || "Failed to submit quiz");
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error("Error submitting quiz:", error);
      toast.error("Failed to submit quiz. Please try again.");
      setIsSubmitting(false);
    }
  };

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const allAnswered = questions.every((q) => answers[q.id]);
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <p>Loading quiz questions...</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className={styles.errorContainer}>
        <p>No questions available for this quiz.</p>
      </div>
    );
  }

  // Show review screen if enabled
  if (showReview) {
    return (
      <>
        <QuizReviewScreen
          questions={questions}
          answers={answers}
          onBack={() => setShowReview(false)}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
        <ProfileBottomNav
          userRole="EMPLOYEE"
          dashboardRoute="/employee/staff/dashboard"
        />
      </>
    );
  }

  return (
    <>
      <div className={styles.container}>
        {/* Progress Bar */}
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.questionCounter}>
            Question {currentQuestionIndex + 1} of {questions.length}
          </div>
        </div>

        {/* Question Content */}
        <div className={styles.content}>
          {currentQuestion && (
            <div className={styles.questionContainer}>
              <h2 className={styles.question}>{currentQuestion.question}</h2>

              <div className={styles.options}>
                {currentQuestion.options.map((option) => {
                  const isSelected = answers[currentQuestion.id] === option.id;
                  return (
                    <button
                      key={option.id}
                      className={`${styles.option} ${
                        isSelected ? styles.optionSelected : ""
                      }`}
                      onClick={() =>
                        handleAnswerSelect(currentQuestion.id, option.id)
                      }
                      disabled={isSubmitting}
                    >
                      <span className={styles.optionText}>{option.text}</span>
                      {isSelected && (
                        <CheckCircle2 size={20} className={styles.checkIcon} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className={styles.navigation}>
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0 || isSubmitting}
              className={styles.navButton}
            >
              <ArrowLeft size={18} />
              Previous
            </Button>

            {isLastQuestion ? (
              <Button
                variant="primary"
                onClick={() => setShowReview(true)}
                disabled={!allAnswered || isSubmitting}
                className={styles.reviewButton}
              >
                <Eye size={18} />
                Review Answers
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={handleNext}
                disabled={!answers[currentQuestion.id] || isSubmitting}
                className={styles.navButton}
              >
                Next
                <ArrowRight size={18} />
              </Button>
            )}
          </div>
        </div>
      </div>
      <ProfileBottomNav
        userRole="EMPLOYEE"
        dashboardRoute="/employee/staff/dashboard"
      />
    </>
  );
};

