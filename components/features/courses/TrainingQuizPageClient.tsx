"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Award, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { QuizCard, LegacyQuizQuestion } from "@/components/features/quiz/QuizCard";
import toast from "react-hot-toast";
import styles from "./TrainingQuizPageClient.module.css";

interface QuizOption {
  id: string;
  text: string;
  isCorrect?: boolean;
}

interface QuizQuestion {
  id: string;
  question: string;
  type: string;
  options: QuizOption[];
  correctAnswer?: number | string;
  explanation?: string;
}

interface Quiz {
  id: string;
  title: string;
  passingScore: number;
  timeLimit: number | null;
  questions: QuizQuestion[];
}

interface Training {
  id: string;
  title: string;
  totalXP: number;
}

interface Course {
  id: string;
  title: string;
}

interface QuizResult {
  questionId: string;
  question: string;
  userAnswer: string;
  correctAnswer: string;
  correctAnswerText: string;
  isCorrect: boolean;
  options: QuizOption[];
  explanation?: string;
}

interface TrainingQuizPageClientProps {
  trainingId: string;
  quiz: Quiz;
  training: Training;
  course: Course;
}

export const TrainingQuizPageClient: React.FC<TrainingQuizPageClientProps> = ({
  trainingId,
  quiz,
  training,
  course,
}) => {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState<QuizResult[] | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [xpEarned, setXpEarned] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [quizStartTime, setQuizStartTime] = useState<Date | null>(null);
  const [quizTiming, setQuizTiming] = useState<{
    startedAt: string | null;
    completedAt: string | null;
    timeSpent: number | null;
  } | null>(null);

  // Track quiz start time when component mounts
  useEffect(() => {
    if (!quizStartTime && !results && !isSubmitting) {
      setQuizStartTime(new Date());
    }
  }, [quizStartTime, results, isSubmitting]);

  // Timer for quiz
  useEffect(() => {
    if (quiz.timeLimit && !results && !isSubmitting) {
      setTimeRemaining(quiz.timeLimit);
      const interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(interval);
            if (prev === 1) {
              handleSubmit(); // Auto-submit when time runs out
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [quiz.timeLimit, results, isSubmitting]);

  const handleAnswerSelect = (questionId: string, answerId: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answerId,
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = async () => {
    // Check if all questions are answered
    const unansweredQuestions = quiz.questions.filter(
      (q) => !answers[q.id]
    );
    if (unansweredQuestions.length > 0) {
      toast.error(`Please answer all questions. ${unansweredQuestions.length} question(s) remaining.`);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/trainings/${trainingId}/quiz/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          answers,
          startedAt: quizStartTime?.toISOString() || new Date().toISOString(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResults(data.data.results);
        setScore(data.data.score);
        setXpEarned(data.data.xpEarned);
        setQuizTiming({
          startedAt: data.data.startedAt || null,
          completedAt: data.data.completedAt || null,
          timeSpent: data.data.timeSpent || null,
        });
        
        if (data.data.passed) {
          toast.success(`Quiz passed! Score: ${data.data.score}%`);
        } else {
          toast.error(`Quiz failed. Score: ${data.data.score}%. Passing score: ${quiz.passingScore}%`);
        }
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

  const handleBack = () => {
    if (results) {
      router.push(`/training/${trainingId}/video`);
    } else {
      router.back();
    }
  };

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds} second${seconds !== 1 ? 's' : ''}`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (remainingSeconds === 0) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ${remainingSeconds} second${remainingSeconds !== 1 ? 's' : ''}`;
  };

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;
  const allAnswered = quiz.questions.every((q) => answers[q.id]);
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;

  // Convert quiz questions to legacy format for QuizCard
  const legacyQuestions: LegacyQuizQuestion[] = quiz.questions.map((q) => ({
    id: q.id,
    question: q.question,
    type: q.type,
    options: q.options,
    correctAnswer: q.correctAnswer,
    explanation: q.explanation,
  }));

  // Handle quiz submission from QuizCard
  const handleQuizSubmit = async (userAnswers: Record<string, string>) => {
    // Set answers and submit
    setAnswers(userAnswers);
    await handleSubmit();
  };

  // Show results screen
  if (results && score !== null) {
    const passed = score >= quiz.passingScore;
    const correctCount = results.filter((r) => r.isCorrect).length;

    return (
      <div className={styles.container}>

        <div className={styles.resultsContainer}>
          <div className={styles.resultsHeader}>
            {passed ? (
              <CheckCircle2 size={64} className={styles.passedIcon} />
            ) : (
              <XCircle size={64} className={styles.failedIcon} />
            )}
            <h1 className={styles.resultsTitle}>
              {passed ? "Quiz Passed!" : "Quiz Failed"}
            </h1>
            <div className={styles.scoreContainer}>
              <span className={styles.score}>{score}%</span>
              <span className={styles.scoreLabel}>
                {correctCount} of {quiz.questions.length} correct
              </span>
            </div>
            {xpEarned !== null && xpEarned > 0 && (
              <div className={styles.xpEarned}>
                <Award size={20} />
                <span>+{xpEarned} XP</span>
              </div>
            )}
            {quizTiming && (
              <div className={styles.quizTiming}>
                {quizTiming.startedAt && (
                  <div className={styles.timingItem}>
                    <span className={styles.timingLabel}>Started:</span>
                    <span className={styles.timingValue}>
                      {new Date(quizTiming.startedAt).toLocaleString()}
                    </span>
                  </div>
                )}
                {quizTiming.completedAt && (
                  <div className={styles.timingItem}>
                    <span className={styles.timingLabel}>Completed:</span>
                    <span className={styles.timingValue}>
                      {new Date(quizTiming.completedAt).toLocaleString()}
                    </span>
                  </div>
                )}
                {quizTiming.timeSpent !== null && (
                  <div className={styles.timingItem}>
                    <span className={styles.timingLabel}>Duration:</span>
                    <span className={styles.timingValue}>
                      {formatDuration(quizTiming.timeSpent)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className={styles.resultsList}>
            <h2 className={styles.resultsSectionTitle}>Review Answers</h2>
            {results.map((result, index) => (
              <Card
                key={result.questionId}
                className={`${styles.resultCard} ${
                  result.isCorrect ? styles.correct : styles.incorrect
                }`}
              >
                <CardBody>
                  <div className={styles.resultHeader}>
                    <span className={styles.questionNumber}>Question {index + 1}</span>
                    {result.isCorrect ? (
                      <CheckCircle2 size={20} className={styles.correctIcon} />
                    ) : (
                      <XCircle size={20} className={styles.incorrectIcon} />
                    )}
                  </div>
                  <p className={styles.resultQuestion}>{result.question}</p>
                  <div className={styles.resultAnswers}>
                    <div className={styles.answerRow}>
                      <span className={styles.answerLabel}>Your answer:</span>
                      <div
                        className={`${styles.answerValue} ${
                          result.isCorrect ? styles.correct : styles.incorrect
                        }`}
                      >
                        {result.userAnswer || "No answer provided"}
                      </div>
                    </div>
                    {!result.isCorrect && (
                      <div className={styles.answerRow}>
                        <span className={styles.answerLabel}>Correct answer:</span>
                        <div className={`${styles.answerValue} ${styles.correct}`}>
                          {result.correctAnswerText || "Not available"}
                        </div>
                      </div>
                    )}
                    {result.explanation && (
                      <div className={styles.explanation}>
                        <span className={styles.explanationLabel}>Explanation:</span>
                        <p>{result.explanation}</p>
                      </div>
                    )}
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>

          <div className={styles.resultsActions}>
            <Button
              variant="primary"
              onClick={handleBack}
              className={styles.backToTrainingButton}
            >
              Back to Training
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show quiz questions using QuizCard
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <QuizCard
          legacyQuestions={legacyQuestions}
          trainingId={trainingId}
          onSubmit={handleQuizSubmit}
          onComplete={(score, total) => {
            // Quiz completion is handled by handleSubmit
            console.log(`Quiz completed: ${score}/${total}`);
          }}
        />
      </div>
    </div>
  );
};

