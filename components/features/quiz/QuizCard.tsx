"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { CheckCircle2, XCircle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import styles from "./QuizCard.module.css";

export interface Question {
  questionNumber: number;
  question: string;
  answerOptions: {
    text: string;
    rationale: string;
    isCorrect: boolean;
  }[];
  hint?: string;
}

// Adapter interface for existing quiz system
export interface LegacyQuizQuestion {
  id: string;
  question: string;
  type: string;
  options: Array<{ id: string; text: string } | string>;
  correctAnswer?: number | string;
  explanation?: string;
}

interface QuizCardProps {
  questions?: Question[];
  // Support for legacy quiz format
  legacyQuestions?: LegacyQuizQuestion[];
  onComplete?: (score: number, totalQuestions: number) => void;
  onRestart?: () => void;
  onSubmit?: (answers: Record<string, string>) => Promise<void>;
  trainingId?: string;
}

// Test data initialization
const defaultTestData: Question[] = [
  {
    questionNumber: 1,
    question: "In the context of customer service, what is the definition of a 'Customer Touchpoint'?",
    answerOptions: [
      { text: "The final transaction where the customer pays.", isCorrect: false, rationale: "Payment is just one interaction." },
      { text: "Any point of contact between a customer and a brand.", isCorrect: true, rationale: "It encompasses every interaction, physical or digital." },
      { text: "The physical counter where a rep sits.", isCorrect: false, rationale: "Touchpoints are interactions, not just furniture." },
      { text: "A complaint filed by a customer.", isCorrect: false, rationale: "Touchpoints include positive and neutral interactions too." }
    ]
  },
  {
    questionNumber: 2,
    question: "Why is personal grooming considered critical in Customer Service?",
    answerOptions: [
      { text: "It ensures employees look identical.", isCorrect: false, rationale: "Uniformity is a goal, but not the primary purpose." },
      { text: "It creates a positive first impression and signals respect.", isCorrect: true, rationale: "Appearance signals competence and respect." },
      { text: "It is a legal requirement everywhere.", isCorrect: false, rationale: "It is not a universal law." },
      { text: "It reduces marketing costs.", isCorrect: false, rationale: "Grooming and marketing budgets are separate." }
    ]
  }
];

// Helper function to convert legacy quiz format to QuizCard format
const convertLegacyQuestions = (legacyQuestions: LegacyQuizQuestion[]): Question[] => {
  return legacyQuestions
    .filter((q: LegacyQuizQuestion) => q && q.question && q.options && Array.isArray(q.options) && q.options.length >= 2) // Filter out invalid questions
    .map((q: LegacyQuizQuestion, index: number) => {
      // Normalize options - handle missing or undefined options
      const options = q.options || [];
      const normalizedOptions = options.map((option: { id: string; text: string } | string, optIndex: number) => {
        const optionText = typeof option === 'string' ? option : (option?.text || String(option));
        return optionText;
      });

    // Determine correct answer index
    let correctIndex = -1;
    if (typeof q.correctAnswer === 'number') {
      correctIndex = q.correctAnswer;
    } else if (typeof q.correctAnswer === 'string' && options.length > 0) {
      // Try to find option by ID or text
      const firstOption = options[0];
      correctIndex = normalizedOptions.findIndex((opt: string) => 
        opt === q.correctAnswer || 
        (typeof firstOption !== 'string' && (firstOption as any)?.id === q.correctAnswer)
      );
    }

    // Create answer options with rationale
    const answerOptions = normalizedOptions.map((text: string, optIndex: number) => {
      const isCorrect = optIndex === correctIndex;
      // Use question explanation as rationale, or default message
      const rationale = q.explanation || (isCorrect 
        ? "This is the correct answer." 
        : "This is not the correct answer.");
      
      return {
        text,
        rationale,
        isCorrect,
      };
    });

    return {
      questionNumber: index + 1,
      question: q.question,
      answerOptions,
    };
  });
};

export const QuizCard: React.FC<QuizCardProps> = ({
  questions,
  legacyQuestions,
  onComplete,
  onRestart,
  onSubmit,
  trainingId,
}) => {
  // Memoize converted questions to prevent unnecessary re-renders
  const convertedQuestions = useMemo(() => {
    if (legacyQuestions) {
      return convertLegacyQuestions(legacyQuestions);
    }
    return questions || defaultTestData;
  }, [legacyQuestions, questions]);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [userAnswers, setUserAnswers] = useState<boolean[]>([]);
  const [showRationale, setShowRationale] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userAnswerMap, setUserAnswerMap] = useState<Record<string, string>>({});

  const currentQuestion = convertedQuestions[currentQuestionIndex];
  const totalQuestions = convertedQuestions.length;
  const progressPercentage = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  // Reset state when questions change
  useEffect(() => {
    setCurrentQuestionIndex(0);
    setSelectedAnswerIndex(null);
    setIsAnswered(false);
    setShowConfirmation(false);
    setShowAnswer(false);
    setUserAnswers([]);
    setShowRationale(false);
    setIsComplete(false);
    setUserAnswerMap({});
  }, [convertedQuestions]);

  const handleOptionClick = (optionIndex: number) => {
    if (isAnswered || showConfirmation) return; // Prevent re-selection

    // Show confirmation first
    setSelectedAnswerIndex(optionIndex);
    setShowConfirmation(true);
  };

  const handleConfirmAnswer = () => {
    if (selectedAnswerIndex === null) return;

    // Hide confirmation, show answer
    setShowConfirmation(false);
    setIsAnswered(true);
    setShowAnswer(true);
    setShowRationale(true);

    const isCorrect = currentQuestion.answerOptions[selectedAnswerIndex].isCorrect;
    setUserAnswers([...userAnswers, isCorrect]);
    
    // Store answer for submission (if using legacy format)
    if (legacyQuestions && currentQuestionIndex < legacyQuestions.length && selectedAnswerIndex !== null) {
      const legacyQuestion = legacyQuestions[currentQuestionIndex];
      // Safety check: ensure options exist and selectedAnswerIndex is valid
      if (legacyQuestion && legacyQuestion.options && Array.isArray(legacyQuestion.options) && selectedAnswerIndex >= 0 && selectedAnswerIndex < legacyQuestion.options.length) {
        const optionId = typeof legacyQuestion.options[selectedAnswerIndex] === 'string'
          ? `opt-${legacyQuestion.id}-${selectedAnswerIndex}`
          : (legacyQuestion.options[selectedAnswerIndex] as any)?.id || `opt-${legacyQuestion.id}-${selectedAnswerIndex}`;
        setUserAnswerMap(prev => ({
          ...prev,
          [legacyQuestion.id]: optionId,
        }));
      }
    }
  };

  const handleCancelAnswer = () => {
    // Cancel selection, go back to choosing
    setSelectedAnswerIndex(null);
    setShowConfirmation(false);
  };

  const handleNextQuestion = async () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswerIndex(null);
      setIsAnswered(false);
      setShowConfirmation(false);
      setShowAnswer(false);
      setShowRationale(false);
    } else {
      // Quiz is complete - submit if onSubmit handler provided
      if (onSubmit) {
        setIsSubmitting(true);
        try {
          await onSubmit(userAnswerMap);
          setIsComplete(true);
          const score = userAnswers.filter(answer => answer).length;
          if (onComplete) {
            onComplete(score, totalQuestions);
          }
        } catch (error) {
          console.error("Error submitting quiz:", error);
          setIsSubmitting(false);
        }
      } else {
        // No submit handler, just mark as complete
        setIsComplete(true);
        const score = userAnswers.filter(answer => answer).length;
        if (onComplete) {
          onComplete(score, totalQuestions);
        }
      }
    }
  };

  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswerIndex(null);
    setIsAnswered(false);
    setUserAnswers([]);
    setShowRationale(false);
    setIsComplete(false);
    if (onRestart) {
      onRestart();
    }
  };

  // Find the correct answer index
  const correctAnswerIndex = currentQuestion?.answerOptions.findIndex(
    option => option.isCorrect
  ) ?? -1;

  // Calculate final score
  const finalScore = userAnswers.filter(answer => answer).length;
  const finalPercentage = totalQuestions > 0 
    ? Math.round((finalScore / totalQuestions) * 100) 
    : 0;

  // Completion state
  if (isComplete) {
    return (
      <div className={styles.container}>
        <Card className={styles.completionCard}>
          <CardBody>
            <div className={styles.completionContent}>
              <h2 className={styles.completionTitle}>Quiz Complete!</h2>
              <div className={styles.scoreContainer}>
                <div className={styles.scoreText}>
                  You scored <span className={styles.scoreHighlight}>{finalScore}</span> out of{" "}
                  <span className={styles.scoreHighlight}>{totalQuestions}</span> questions correctly
                </div>
                <div className={styles.scorePercentage}>
                  {finalPercentage}%
                </div>
              </div>
              <Button
                variant="primary"
                size="lg"
                onClick={handleRestart}
                className={styles.restartButton}
              >
                Restart Quiz
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  // Question display state
  return (
    <div className={styles.container}>
      {/* Progress Bar */}
      <div className={styles.progressSection}>
        <div className={styles.progressLabel}>
          Question {currentQuestionIndex + 1} of {totalQuestions}
        </div>
        <ProgressBar
          value={progressPercentage}
          className={styles.progressBar}
        />
      </div>

      {/* Question Card */}
      <Card className={styles.questionCard}>
        <CardBody>
          <h2 className={styles.questionText}>{currentQuestion?.question}</h2>

          {/* Answer Options */}
          <div className={styles.optionsContainer}>
            {currentQuestion?.answerOptions.map((option, index) => {
              const isSelected = selectedAnswerIndex === index;
              const isCorrect = option.isCorrect;
              // Show as correct if: it's the correct answer AND answer is revealed
              const showAsCorrect = showAnswer && isCorrect;
              // Show as incorrect if: user selected it AND it's wrong AND answer is revealed
              const showAsIncorrect = showAnswer && isSelected && !isCorrect;
              // Show as pending selection (confirmation needed)
              const showAsPending = showConfirmation && isSelected && !showAnswer;

              return (
                <button
                  key={index}
                  className={cn(
                    styles.optionButton,
                    isSelected && !showAnswer && styles.optionSelected,
                    showAsPending && styles.optionPending,
                    showAsCorrect && styles.optionCorrect,
                    showAsIncorrect && styles.optionIncorrect
                  )}
                  onClick={() => handleOptionClick(index)}
                  disabled={isAnswered || showConfirmation}
                  aria-label={`Option ${index + 1}: ${option.text}`}
                >
                  <span className={styles.optionText}>{option.text}</span>
                  {showAsCorrect && (
                    <CheckCircle2 size={18} className={styles.correctIcon} />
                  )}
                  {showAsIncorrect && (
                    <XCircle size={18} className={styles.incorrectIcon} />
                  )}
                </button>
              );
            })}
          </div>

          {/* Confirmation Message */}
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

          {/* Rationale Display - Only show after answer is confirmed and revealed */}
          {showAnswer && showRationale && selectedAnswerIndex !== null && (
            <div className={styles.rationaleContainer}>
              <div className={styles.rationaleHeader}>
                {currentQuestion.answerOptions[selectedAnswerIndex].isCorrect ? (
                  <>
                    <CheckCircle2 size={16} className={styles.rationaleIcon} />
                    <span className={styles.rationaleLabel}>Correct!</span>
                  </>
                ) : (
                  <>
                    <XCircle size={16} className={styles.rationaleIconError} />
                    <span className={styles.rationaleLabelError}>Incorrect</span>
                  </>
                )}
              </div>
              <div className={styles.rationaleText}>
                {currentQuestion.answerOptions[selectedAnswerIndex].rationale}
              </div>
            </div>
          )}

          {/* Next Question Button - Only show after answer is revealed */}
          {showAnswer && isAnswered && (
            <div className={styles.actionContainer}>
              <Button
                variant="primary"
                size="lg"
                onClick={handleNextQuestion}
                className={styles.nextButton}
                disabled={isSubmitting}
                isLoading={isSubmitting}
              >
                {currentQuestionIndex < totalQuestions - 1 ? "Continue" : "Complete Quiz"}
              </Button>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};

