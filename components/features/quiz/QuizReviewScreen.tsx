"use client";

import React from "react";
import { CheckCircle2, XCircle, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import styles from "./QuizReviewScreen.module.css";

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

interface QuizReviewScreenProps {
  questions: QuizQuestion[];
  answers: Record<string, string>;
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export const QuizReviewScreen: React.FC<QuizReviewScreenProps> = ({
  questions,
  answers,
  onBack,
  onSubmit,
  isSubmitting,
}) => {
  const getSelectedOption = (question: QuizQuestion) => {
    const selectedId = answers[question.id];
    return question.options.find((opt) => opt.id === selectedId);
  };

  const getCorrectOption = (question: QuizQuestion) => {
    return question.options.find((opt) => opt.isCorrect);
  };

  const isQuestionCorrect = (question: QuizQuestion) => {
    const selected = getSelectedOption(question);
    return selected?.isCorrect === true;
  };

  const unansweredCount = questions.filter((q) => !answers[q.id]).length;
  const correctCount = questions.filter((q) => isQuestionCorrect(q)).length;
  const totalQuestions = questions.length;

  return (
    <div className={styles.container}>
      {/* Review Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Review Your Answers</h1>
        <p className={styles.subtitle}>
          Review all your answers before submitting. You can go back to change any answer.
        </p>
      </div>

      {/* Summary Stats */}
      <div className={styles.summary}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{totalQuestions}</div>
          <div className={styles.statLabel}>Total Questions</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{totalQuestions - unansweredCount}</div>
          <div className={styles.statLabel}>Answered</div>
        </div>
        {unansweredCount > 0 && (
          <div className={`${styles.statCard} ${styles.statCardWarning}`}>
            <div className={styles.statValue}>{unansweredCount}</div>
            <div className={styles.statLabel}>Unanswered</div>
          </div>
        )}
      </div>

      {/* Questions Review List */}
      <div className={styles.questionsList}>
        {questions.map((question, index) => {
          const selected = getSelectedOption(question);
          const correct = getCorrectOption(question);
          const isCorrect = isQuestionCorrect(question);
          const isUnanswered = !answers[question.id];

          return (
            <div
              key={question.id}
              className={`${styles.questionCard} ${
                isUnanswered
                  ? styles.questionUnanswered
                  : isCorrect
                  ? styles.questionCorrect
                  : styles.questionIncorrect
              }`}
            >
              <div className={styles.questionHeader}>
                <span className={styles.questionNumber}>Question {index + 1}</span>
                {isUnanswered ? (
                  <span className={styles.statusBadgeUnanswered}>Unanswered</span>
                ) : isCorrect ? (
                  <span className={styles.statusBadgeCorrect}>
                    <CheckCircle2 size={16} />
                    Correct
                  </span>
                ) : (
                  <span className={styles.statusBadgeIncorrect}>
                    <XCircle size={16} />
                    Incorrect
                  </span>
                )}
              </div>

              <h3 className={styles.questionText}>{question.question}</h3>

              <div className={styles.optionsList}>
                {question.options.map((option) => {
                  const isSelected = selected?.id === option.id;
                  const isCorrectOption = option.isCorrect;

                  return (
                    <div
                      key={option.id}
                      className={`${styles.optionItem} ${
                        isSelected ? styles.optionSelected : ""
                      } ${isCorrectOption ? styles.optionCorrect : ""}`}
                    >
                      <div className={styles.optionContent}>
                        <span className={styles.optionText}>{option.text}</span>
                        {isSelected && (
                          <span className={styles.selectedLabel}>Your Answer</span>
                        )}
                        {isCorrectOption && (
                          <span className={styles.correctLabel}>Correct Answer</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        <Button
          variant="outline"
          onClick={onBack}
          disabled={isSubmitting}
          className={styles.backButton}
        >
          <ArrowLeft size={18} />
          Back to Quiz
        </Button>
        <Button
          variant="primary"
          onClick={onSubmit}
          disabled={isSubmitting || unansweredCount > 0}
          className={styles.submitButton}
        >
          {isSubmitting ? "Submitting..." : "Submit Quiz"}
          <ArrowRight size={18} />
        </Button>
      </div>

      {unansweredCount > 0 && (
        <div className={styles.warning}>
          <p>Please answer all {unansweredCount} remaining question(s) before submitting.</p>
        </div>
      )}
    </div>
  );
};

