"use client";

import React, { useState, useEffect } from "react";
import { X, CheckCircle2, XCircle, Award, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import toast from "react-hot-toast";
import styles from "./MiniQuizModal.module.css";

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

interface MiniQuiz {
  id: string;
  title: string;
  passingScore: number;
  questions: QuizQuestion[];
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

interface MiniQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  miniTrainingId: string;
  quiz: MiniQuiz;
  onComplete: () => void;
}

export const MiniQuizModal: React.FC<MiniQuizModalProps> = ({
  isOpen,
  onClose,
  miniTrainingId,
  quiz,
  onComplete,
}) => {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState<QuizResult[] | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [xpEarned, setXpEarned] = useState<number | null>(null);
  const [quizStartTime, setQuizStartTime] = useState<Date | null>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setAnswers({});
      setCurrentQuestionIndex(0);
      setResults(null);
      setScore(null);
      setXpEarned(null);
      setIsSubmitting(false);
      setQuizStartTime(new Date());
    }
  }, [isOpen]);

  const handleAnswerSelect = (questionId: string, answerId: string) => {
    if (!answerId) {
      console.warn("Attempted to select answer without ID");
      return;
    }
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
      const response = await fetch(`/api/mini-trainings/${miniTrainingId}/quiz/submit`, {
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
        
        if (data.data.passed) {
          toast.success(`Quiz passed! Score: ${data.data.score}%`);
          // Call onComplete after a short delay to show the success message
          setTimeout(() => {
            onComplete();
          }, 1500);
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

  if (!isOpen) return null;

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;
  const allAnswered = quiz.questions.every((q) => answers[q.id]);
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;

  // Show results screen
  if (results && score !== null) {
    const passed = score >= quiz.passingScore;
    const correctCount = results.filter((r) => r.isCorrect).length;

    return (
      <div className={styles.modalOverlay} onClick={onClose}>
        <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
          <button className={styles.closeButton} onClick={onClose} aria-label="Close">
            <X size={24} />
          </button>

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
                onClick={onClose}
                className={styles.closeButton}
              >
                {passed ? "Close" : "Try Again"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show quiz questions
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose} aria-label="Close">
          <X size={24} />
        </button>

        <div className={styles.header}>
          <h2 className={styles.quizTitle}>{quiz.title}</h2>
        </div>

        {/* Progress Bar */}
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Question Counter */}
        <div className={styles.questionCounter}>
          Question {currentQuestionIndex + 1} of {quiz.questions.length}
        </div>

        {/* Question Content */}
        <div className={styles.content}>
          {currentQuestion && (
            <Card className={styles.questionCard}>
              <CardBody>
                <h3 className={styles.question}>{currentQuestion.question}</h3>

                <div className={styles.options}>
                  {currentQuestion.options && Array.isArray(currentQuestion.options) && currentQuestion.options.map((option, optionIndex) => {
                    // Handle both string options and object options
                    // String format: ["Option 1", "Option 2"] (from trainer form)
                    // Object format: [{id: "opt1", text: "Option 1"}, ...] (transformed format)
                    const optionText = typeof option === 'string' ? option : (option.text || option.label || String(option));
                    const optionId = typeof option === 'string' 
                      ? `opt-${currentQuestion.id}-${optionIndex}` 
                      : (option.id || `opt-${currentQuestion.id}-${optionIndex}`);
                    const isSelected = answers[currentQuestion.id] === optionId;
                    
                    return (
                      <button
                        key={optionId}
                        className={`${styles.option} ${
                          isSelected ? styles.optionSelected : ""
                        }`}
                        onClick={() =>
                          handleAnswerSelect(currentQuestion.id, optionId)
                        }
                        disabled={isSubmitting}
                      >
                        <span className={styles.optionText}>{optionText}</span>
                      </button>
                    );
                  })}
                </div>
              </CardBody>
            </Card>
          )}

          {/* Navigation */}
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
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className={styles.spinner} />
                    Submitting...
                  </>
                ) : (
                  "Submit Quiz"
                )}
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={handleNext}
                disabled={!answers[currentQuestion.id] || isSubmitting}
                className={styles.navButton}
              >
                Next
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

