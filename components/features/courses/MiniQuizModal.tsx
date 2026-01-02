"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, CheckCircle2, XCircle, Award, Loader2, Clock } from "lucide-react";
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
  timeLimit?: number | null;
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
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [quizTiming, setQuizTiming] = useState<{
    startedAt: string | null;
    completedAt: string | null;
    timeSpent: number | null;
  } | null>(null);
  
  // Confirmation popup state (like QuizCard)
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isAnswered, setIsAnswered] = useState<Record<string, boolean>>({});
  
  // Use ref to prevent accidental state resets
  const previousQuestionIndexRef = useRef<number>(0);

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
      setTimeRemaining(null);
      setQuizTiming(null);
      setSelectedAnswerIndex(null);
      setShowConfirmation(false);
      setIsAnswered({});
      previousQuestionIndexRef.current = 0;
    }
  }, [isOpen]);

  // Timer for quiz
  useEffect(() => {
    if (quiz.timeLimit && !results && !isSubmitting && isOpen) {
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
  }, [quiz.timeLimit, results, isSubmitting, isOpen]);

  // Handle option click with confirmation popup (like QuizCard)
  const handleOptionClick = (questionId: string, optionId: string, optionIndex: number) => {
    if (!optionId) {
      console.warn("Attempted to select answer without ID");
      return;
    }
    
    // If already answered this question, don't allow re-selection
    if (isAnswered[questionId] || showConfirmation) {
      return;
    }

    // Show confirmation first
    setSelectedAnswerIndex(optionIndex);
    setShowConfirmation(true);
    
    // Scroll confirmation into view after a brief delay
    setTimeout(() => {
      const confirmationElement = document.querySelector(`.${styles.confirmationContainer}`);
      if (confirmationElement) {
        confirmationElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'nearest',
          inline: 'nearest'
        });
      }
    }, 100);
  };

  // Handle confirm answer
  const handleConfirmAnswer = () => {
    if (selectedAnswerIndex === null || !currentQuestion) return;

    const optionId = typeof currentQuestion.options[selectedAnswerIndex] === 'string'
      ? `opt-${currentQuestion.id}-${selectedAnswerIndex}`
      : (currentQuestion.options[selectedAnswerIndex] as QuizOption).id || `opt-${currentQuestion.id}-${selectedAnswerIndex}`;

    // Hide confirmation, mark as answered
    setShowConfirmation(false);
    setIsAnswered(prev => ({ ...prev, [currentQuestion.id]: true }));
    setSelectedAnswerIndex(null);

    // Store answer
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: optionId,
    }));
  };

  // Handle cancel answer
  const handleCancelAnswer = () => {
    setSelectedAnswerIndex(null);
    setShowConfirmation(false);
  };

  // Legacy handler for backward compatibility (not used with confirmation flow)
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
      // Reset confirmation state when moving to next question
      setSelectedAnswerIndex(null);
      setShowConfirmation(false);
      previousQuestionIndexRef.current = currentQuestionIndex + 1;
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      // Reset confirmation state when moving to previous question
      setSelectedAnswerIndex(null);
      setShowConfirmation(false);
      previousQuestionIndexRef.current = currentQuestionIndex - 1;
    }
  };


  if (!isOpen) return null;

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;
  const allAnswered = quiz.questions.every((q) => answers[q.id]);
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;
  
  // Format duration helper
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

  // Format time remaining for timer display
  const formatTimeRemaining = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

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
          {/* Timer Display */}
          {timeRemaining !== null && (
            <div className={styles.timerContainer}>
              <Clock size={18} className={styles.timerIcon} />
              <span className={styles.timerText}>{formatTimeRemaining(timeRemaining)}</span>
            </div>
          )}
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
                  {currentQuestion.options && Array.isArray(currentQuestion.options) && currentQuestion.options.map((option: QuizOption | string, optionIndex: number) => {
                    // Handle both string options and object options
                    // String format: ["Option 1", "Option 2"] (from trainer form)
                    // Object format: [{id: "opt1", text: "Option 1"}, ...] (transformed format)
                    const optionText = typeof option === 'string' ? option : (option.text || String(option));
                    const optionId = typeof option === 'string' 
                      ? `opt-${currentQuestion.id}-${optionIndex}` 
                      : (option.id || `opt-${currentQuestion.id}-${optionIndex}`);
                    const isSelected = answers[currentQuestion.id] === optionId;
                    const isPending = showConfirmation && selectedAnswerIndex === optionIndex;
                    const isQuestionAnswered = isAnswered[currentQuestion.id];
                    
                    return (
                      <button
                        key={optionId}
                        className={`${styles.option} ${
                          isSelected ? styles.optionSelected : ""
                        } ${isPending ? styles.optionPending : ""}`}
                        onClick={() =>
                          handleOptionClick(currentQuestion.id, optionId, optionIndex)
                        }
                        disabled={isSubmitting || isQuestionAnswered || showConfirmation}
                      >
                        <span className={styles.optionText}>{optionText}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Confirmation Message (like QuizCard) */}
                {showConfirmation && selectedAnswerIndex !== null && (
                  <div className={styles.confirmationContainer}>
                    <div className={styles.confirmationMessage}>
                      Are you sure about this answer?
                    </div>
                    <div className={styles.confirmationActions}>
                      <Button
                        variant="outline"
                        size="md"
                        onClick={handleCancelAnswer}
                        className={styles.cancelButton}
                      >
                        Change Answer
                      </Button>
                      <Button
                        variant="primary"
                        size="md"
                        onClick={handleConfirmAnswer}
                        className={styles.confirmButton}
                      >
                        Confirm
                      </Button>
                    </div>
                  </div>
                )}
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
                disabled={!allAnswered || isSubmitting || showConfirmation}
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
                disabled={!answers[currentQuestion.id] || isSubmitting || showConfirmation}
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

