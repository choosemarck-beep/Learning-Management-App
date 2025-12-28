"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2, XCircle, Award, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import styles from "./QuizModal.module.css";

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

interface QuizContent {
  questions: QuizQuestion[];
}

interface QuizResult {
  questionId: string;
  question: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  options: QuizOption[];
}

interface QuizModalProps {
  taskId: string;
  quizContent: string; // JSON string
  xpReward: number;
  isOpen: boolean;
  onClose: () => void;
  onComplete: (score: number, xpEarned: number) => void;
}

export const QuizModal: React.FC<QuizModalProps> = ({
  taskId,
  quizContent,
  xpReward,
  isOpen,
  onClose,
  onComplete,
}) => {
  const [mounted, setMounted] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState<QuizResult[] | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [xpEarned, setXpEarned] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && quizContent) {
      try {
        const parsed: QuizContent = JSON.parse(quizContent);
        setQuestions(parsed.questions || []);
        setAnswers({});
        setCurrentQuestionIndex(0);
        setResults(null);
        setScore(null);
        setXpEarned(null);
      } catch (error) {
        console.error("Error parsing quiz content:", error);
      }
    }
  }, [isOpen, quizContent]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSubmitting && !results) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose, isSubmitting, results]);

  const handleAnswerSelect = (questionId: string, answerId: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answerId,
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
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
    const unansweredQuestions = questions.filter(
      (q) => !answers[q.id]
    );
    if (unansweredQuestions.length > 0) {
      alert(`Please answer all questions. ${unansweredQuestions.length} question(s) remaining.`);
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
        setResults(data.data.results);
        setScore(data.data.score);
        setXpEarned(data.data.xpEarned);
        onComplete(data.data.score, data.data.xpEarned);
      } else {
        alert(data.error || "Failed to submit quiz");
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error("Error submitting quiz:", error);
      alert("Failed to submit quiz. Please try again.");
      setIsSubmitting(false);
    }
  };

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const allAnswered = questions.every((q) => answers[q.id]);

  if (!mounted || !isOpen) return null;

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={styles.backdrop}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={results ? undefined : onClose}
        >
          <motion.div
            className={styles.modal}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3, type: "spring", damping: 25 }}
            onClick={(e) => e.stopPropagation()}
          >
            {!results ? (
              <>
                {/* Quiz Questions */}
                <div className={styles.header}>
                  <button
                    className={styles.closeButton}
                    onClick={onClose}
                    aria-label="Close quiz"
                    disabled={isSubmitting}
                  >
                    <X size={24} />
                  </button>
                  <div className={styles.progress}>
                    Question {currentQuestionIndex + 1} of {questions.length}
                  </div>
                </div>

                <div className={styles.content}>
                  {currentQuestion && (
                    <div className={styles.questionContainer}>
                      <h2 className={styles.question}>
                        {currentQuestion.question}
                      </h2>

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
                              <span className={styles.optionText}>
                                {option.text}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className={styles.navigation}>
                    <Button
                      variant="outline"
                      onClick={handlePrevious}
                      disabled={currentQuestionIndex === 0 || isSubmitting}
                      className={styles.navButton}
                    >
                      Previous
                    </Button>

                    {isLastQuestion ? (
                      <Button
                        variant="primary"
                        onClick={handleSubmit}
                        disabled={!allAnswered || isSubmitting}
                        className={styles.submitButton}
                      >
                        {isSubmitting ? "Submitting..." : "Submit Quiz"}
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
              </>
            ) : (
              <>
                {/* Results Screen */}
                <div className={styles.resultsHeader}>
                  <div className={styles.scoreContainer}>
                    <Award size={48} className={styles.awardIcon} />
                    <h2 className={styles.scoreTitle}>Quiz Complete!</h2>
                    <div className={styles.scoreValue}>{score}%</div>
                    <div className={styles.xpEarned}>
                      +{xpEarned} XP Earned
                    </div>
                  </div>
                </div>

                <div className={styles.resultsContent}>
                  <h3 className={styles.resultsTitle}>Your Results</h3>
                  <div className={styles.resultsList}>
                    {results.map((result, index) => (
                      <div
                        key={result.questionId}
                        className={styles.resultItem}
                      >
                        <div className={styles.resultQuestion}>
                          <span className={styles.resultNumber}>
                            {index + 1}.
                          </span>
                          {result.question}
                        </div>
                        <div className={styles.resultAnswer}>
                          {result.isCorrect ? (
                            <div className={styles.correctAnswer}>
                              <CheckCircle2 size={20} />
                              <span>Correct</span>
                            </div>
                          ) : (
                            <div className={styles.incorrectAnswer}>
                              <XCircle size={20} />
                              <span>Incorrect</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={styles.resultsActions}>
                  <Button
                    variant="primary"
                    onClick={onClose}
                    className={styles.continueButton}
                  >
                    Continue
                  </Button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};

