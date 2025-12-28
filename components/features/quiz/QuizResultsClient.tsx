"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Award,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Trophy,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ProfileBottomNav } from "@/components/layout/ProfileBottomNav";
import toast from "react-hot-toast";
import styles from "./QuizResultsClient.module.css";

interface QuizResult {
  questionId: string;
  question: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  options: Array<{ id: string; text: string; isCorrect: boolean }>;
}

interface QuizResultsClientProps {
  taskId: string;
  score: number | null;
  xpEarned: number | null;
}

export const QuizResultsClient: React.FC<QuizResultsClientProps> = ({
  taskId,
  score: initialScore,
  xpEarned: initialXpEarned,
}) => {
  const router = useRouter();
  const [results, setResults] = useState<QuizResult[]>([]);
  const [score, setScore] = useState<number | null>(initialScore);
  const [xpEarned, setXpEarned] = useState<number | null>(initialXpEarned);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchQuizResults();
  }, [taskId]);

  const fetchQuizResults = async () => {
    try {
      setIsLoading(true);
      
      // First, try to get results from sessionStorage (most recent)
      const storedResults = sessionStorage.getItem(`quiz_results_${taskId}`);
      if (storedResults) {
        try {
          const parsed = JSON.parse(storedResults);
          // Check if results are recent (within last hour)
          if (parsed.timestamp && Date.now() - parsed.timestamp < 3600000) {
            setResults(parsed.results || []);
            setScore(parsed.score || initialScore || 0);
            setXpEarned(parsed.xpEarned || initialXpEarned || 0);
            setIsLoading(false);
            return;
          }
        } catch (e) {
          console.error("Error parsing stored results:", e);
        }
      }

      // If we have score and xpEarned from URL params, use them
      if (initialScore !== null && initialXpEarned !== null) {
        setScore(initialScore);
        setXpEarned(initialXpEarned);
      }

      // Try to fetch detailed results from API
      const response = await fetch(`/api/tasks/${taskId}/results`);
      const data = await response.json();

      if (data.success && data.data.results) {
        setResults(data.data.results);
        if (data.data.score !== undefined) setScore(data.data.score);
        if (data.data.xpEarned !== undefined) setXpEarned(data.data.xpEarned);
      } else {
        // Fallback to URL params
        setResults([]);
        if (initialScore === null) setScore(0);
        if (initialXpEarned === null) setXpEarned(0);
      }
    } catch (error) {
      console.error("Error fetching quiz results:", error);
      // Use URL params if available, otherwise use placeholders
      if (initialScore === null) setScore(0);
      if (initialXpEarned === null) setXpEarned(0);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

    // If we have score and xpEarned from URL params, use them
    if (initialScore !== null && initialXpEarned !== null) {
      setScore(initialScore);
      setXpEarned(initialXpEarned);
    }

    // Try to fetch detailed results from API
    try {
      const response = await fetch(`/api/tasks/${taskId}/results`);
      const data = await response.json();

      if (data.success && data.data.results) {
        setResults(data.data.results);
        if (data.data.score !== undefined) setScore(data.data.score);
        if (data.data.xpEarned !== undefined) setXpEarned(data.data.xpEarned);
      } else {
        // Fallback to URL params
        setResults([]);
        if (initialScore === null) setScore(0);
        if (initialXpEarned === null) setXpEarned(0);
      }
    } catch (error) {
      console.error("Error fetching quiz results:", error);
      // Use URL params if available, otherwise use placeholders
      if (initialScore === null) setScore(0);
      if (initialXpEarned === null) setXpEarned(0);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreMessage = (score: number) => {
    if (score >= 90) return "Excellent! Outstanding performance!";
    if (score >= 75) return "Great job! Well done!";
    if (score >= 60) return "Good effort! Keep learning!";
    return "Keep practicing! You'll improve!";
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "var(--color-status-success)";
    if (score >= 75) return "var(--color-primary-purple)";
    if (score >= 60) return "var(--color-status-warning)";
    return "var(--color-status-error)";
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <p>Loading results...</p>
      </div>
    );
  }

  const finalScore = score || 0;
  const finalXpEarned = xpEarned || 0;
  const correctCount = results.filter((r) => r.isCorrect).length;
  const totalQuestions = results.length || 1;

  return (
    <>
      <div className={styles.container}>
        {/* Score Header */}
        <div className={styles.scoreHeader}>
          <div
            className={styles.scoreCircle}
            style={{ borderColor: getScoreColor(finalScore) }}
          >
            <Trophy
              size={48}
              className={styles.trophyIcon}
              style={{ color: getScoreColor(finalScore) }}
            />
            <div
              className={styles.scoreValue}
              style={{ color: getScoreColor(finalScore) }}
            >
              {finalScore}%
            </div>
          </div>
          <h1 className={styles.scoreTitle}>Quiz Complete!</h1>
          <p className={styles.scoreMessage}>{getScoreMessage(finalScore)}</p>
          <div className={styles.xpBadge}>
            <Star size={20} />
            <span>+{finalXpEarned} XP Earned</span>
          </div>
        </div>

        {/* Summary Stats */}
        <div className={styles.summaryStats}>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{correctCount}</div>
            <div className={styles.statLabel}>Correct</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{totalQuestions - correctCount}</div>
            <div className={styles.statLabel}>Incorrect</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{totalQuestions}</div>
            <div className={styles.statLabel}>Total</div>
          </div>
        </div>

        {/* Results List */}
        {results.length > 0 && (
          <div className={styles.resultsSection}>
            <h2 className={styles.resultsTitle}>Question Review</h2>
            <div className={styles.resultsList}>
              {results.map((result, index) => (
                <div
                  key={result.questionId}
                  className={`${styles.resultItem} ${
                    result.isCorrect ? styles.resultCorrect : styles.resultIncorrect
                  }`}
                >
                  <div className={styles.resultHeader}>
                    <span className={styles.resultNumber}>{index + 1}.</span>
                    <span className={styles.resultQuestion}>{result.question}</span>
                  </div>
                  <div className={styles.resultStatus}>
                    {result.isCorrect ? (
                      <div className={styles.correctBadge}>
                        <CheckCircle2 size={18} />
                        <span>Correct</span>
                      </div>
                    ) : (
                      <div className={styles.incorrectBadge}>
                        <XCircle size={18} />
                        <span>Incorrect</span>
                      </div>
                    )}
                  </div>
                  {/* Show user's answer */}
                  {result.userAnswer && (
                    <div className={styles.userAnswerSection}>
                      <span className={styles.answerLabel}>Your answer:</span>
                      <span className={styles.userAnswerText}>
                        {
                          result.options.find((opt) => opt.id === result.userAnswer)?.text ||
                          result.userAnswer
                        }
                      </span>
                    </div>
                  )}

                  {/* Show correct answer if incorrect or always show for review */}
                  {(!result.isCorrect || result.isCorrect === null) && (
                    <div className={styles.correctAnswerHint}>
                      <span className={styles.hintLabel}>Correct answer:</span>
                      <span className={styles.hintAnswer}>
                        {result.correctAnswerText || result.correctAnswer}
                      </span>
                    </div>
                  )}

                  {/* Show explanation if available */}
                  {result.explanation && (
                    <div className={styles.explanationSection}>
                      <span className={styles.explanationLabel}>Explanation:</span>
                      <p className={styles.explanationText}>{result.explanation}</p>
                    </div>
                  )}

                  {/* Show all options with indicators */}
                  {result.options && result.options.length > 0 && (
                    <div className={styles.optionsReview}>
                      {result.options.map((option: any) => {
                        const isUserAnswer = result.userAnswer === option.id;
                        const isCorrectOption = option.isCorrect || 
                          (result.correctAnswer === option.id);
                        
                        return (
                          <div
                            key={option.id}
                            className={`${styles.optionReviewItem} ${
                              isUserAnswer ? styles.optionUserAnswer : ""
                            } ${isCorrectOption ? styles.optionCorrect : ""}`}
                          >
                            <span className={styles.optionReviewText}>{option.text}</span>
                            {isUserAnswer && (
                              <span className={styles.optionLabel}>Your Answer</span>
                            )}
                            {isCorrectOption && (
                              <span className={styles.optionLabelCorrect}>Correct</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className={styles.actions}>
          <Button
            variant="primary"
            onClick={() => router.push("/courses")}
            className={styles.continueButton}
          >
            Continue Learning
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

