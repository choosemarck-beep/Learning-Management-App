"use client";

import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Modal } from "@/components/ui/Modal";
import { AdminPasswordVerification } from "./AdminPasswordVerification";
import { X, Plus } from "lucide-react";
import styles from "./QuizBuilder.module.css";

export type QuestionType = "multiple-choice" | "true-false" | "short-answer";

export interface Question {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[]; // For multiple-choice
  correctAnswer: string | number;
  points: number;
  explanation?: string;
}

interface QuizBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  trainingId: string;
  quizId?: string; // If provided, we're editing
  onSuccess?: () => void;
}

export const QuizBuilder: React.FC<QuizBuilderProps> = ({
  isOpen,
  onClose,
  trainingId,
  quizId,
  onSuccess,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [quizTitle, setQuizTitle] = useState("");
  const [passingScore, setPassingScore] = useState(70);
  const [timeLimit, setTimeLimit] = useState<number | undefined>(undefined);
  const [allowRetake, setAllowRetake] = useState(true);
  const [maxAttempts, setMaxAttempts] = useState<number | undefined>(3);
  const [isUnlimitedAttempts, setIsUnlimitedAttempts] = useState(false);
  const [questionsToShow, setQuestionsToShow] = useState<number | null>(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [hasExistingQuiz, setHasExistingQuiz] = useState(false);
  // Multi-step form state
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 2;

  // Load quiz data if editing
  useEffect(() => {
    if (isOpen && quizId) {
      fetchQuiz();
    } else if (isOpen && !quizId) {
      resetForm();
    }
    if (isOpen) {
      setCurrentStep(1);
    }
  }, [isOpen, quizId]);

  const resetForm = () => {
    setQuestions([]);
    setQuizTitle("");
    setPassingScore(70);
    setTimeLimit(undefined);
    setAllowRetake(true);
    setMaxAttempts(3);
    setIsUnlimitedAttempts(false);
    setQuestionsToShow(null);
    setEditingQuestion(null);
    setHasExistingQuiz(false);
  };

  const fetchQuiz = async () => {
    try {
      const response = await fetch(`/api/trainer/trainings/${trainingId}/quiz`);
      const result = await response.json();

      if (!response.ok) {
        if (response.status === 404) {
          // Quiz doesn't exist yet, reset form
          resetForm();
          return;
        }
        toast.error(result.error || "Failed to load quiz");
        return;
      }

      const quiz = result.data.quiz;
      if (quiz) {
        setHasExistingQuiz(true);
        setQuizTitle(quiz.title || "");
        setPassingScore(quiz.passingScore || 70);
        setTimeLimit(quiz.timeLimit || undefined);
        setAllowRetake(quiz.allowRetake !== undefined ? quiz.allowRetake : true);
        const isUnlimited = quiz.maxAttempts === null || quiz.maxAttempts === undefined;
        setIsUnlimitedAttempts(isUnlimited);
        setMaxAttempts(isUnlimited ? 3 : (quiz.maxAttempts || 3));
        setQuestionsToShow(quiz.questionsToShow || null);
        
        try {
          const parsedQuestions = JSON.parse(quiz.questions || "[]");
          if (Array.isArray(parsedQuestions) && parsedQuestions.length > 0) {
            setQuestions(parsedQuestions);
            console.log(`Loaded ${parsedQuestions.length} questions from database`);
          } else {
            setQuestions([]);
            console.log("Quiz exists but has no questions");
          }
        } catch (e) {
          console.error("Error parsing quiz questions:", e);
          setQuestions([]);
          toast.error("Failed to parse quiz questions. Please check the format.");
        }
      } else {
        setHasExistingQuiz(false);
        resetForm();
      }
    } catch (error) {
      console.error("Error fetching quiz:", error);
      toast.error("Failed to load quiz");
    }
  };

  const generateQuestionId = () => {
    return `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const handleAddQuestion = (type: QuestionType) => {
    const newQuestion: Question = {
      id: generateQuestionId(),
      type,
      question: "",
      options: type === "multiple-choice" ? ["", "", "", ""] : undefined,
      correctAnswer: type === "multiple-choice" ? 0 : type === "true-false" ? "true" : "",
      points: 1,
      explanation: "",
    };
    setEditingQuestion(newQuestion);
    setIsQuestionModalOpen(true);
  };

  const handleEditQuestion = (question: Question) => {
    setEditingQuestion({ ...question });
    setIsQuestionModalOpen(true);
  };

  const handleDeleteQuestion = (questionId: string) => {
    setQuestions(questions.filter((q) => q.id !== questionId));
    toast.success("Question deleted");
  };

  const handleSaveQuestion = (question: Question) => {
    if (!question.question.trim()) {
      toast.error("Question text is required");
      return;
    }

    if (question.type === "multiple-choice") {
      if (!question.options || question.options.length < 2) {
        toast.error("At least 2 options are required for multiple choice");
        return;
      }
      if (question.options.some((opt) => !opt.trim())) {
        toast.error("All options must have text");
        return;
      }
    }

    const existingIndex = questions.findIndex((q) => q.id === question.id);
    if (existingIndex >= 0) {
      const updated = [...questions];
      updated[existingIndex] = question;
      setQuestions(updated);
    } else {
      setQuestions([...questions, question]);
    }

    setIsQuestionModalOpen(false);
    setEditingQuestion(null);
    toast.success("Question saved");
  };

  // Step validation
  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!quizTitle.trim() && quizTitle.trim().length >= 3;
      case 2:
        return questions.length > 0;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep) && currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else if (currentStep === 1 && !quizTitle.trim()) {
      toast.error("Quiz title is required");
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!quizTitle.trim()) {
      toast.error("Quiz title is required");
      return;
    }

    if (questions.length === 0) {
      toast.error("At least one question is required");
      return;
    }

    // If updating existing quiz, require password
    if (hasExistingQuiz) {
      setIsPasswordModalOpen(true);
      return;
    }

    // Creating new quiz - no password required
    await saveQuiz();
  };

  const saveQuiz = async (password?: string) => {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/trainer/trainings/${trainingId}/quiz`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...(password && { password }),
          title: quizTitle,
          passingScore,
          timeLimit: timeLimit || null,
          allowRetake,
          maxAttempts: isUnlimitedAttempts ? null : (maxAttempts || 3),
          questionsToShow: questionsToShow || null,
          questions,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        const errorMessage = result.error || "Failed to save quiz";
        toast.error(errorMessage);
        setIsLoading(false);
        return;
      }

      toast.success(hasExistingQuiz ? "Quiz updated successfully!" : "Quiz created successfully!");
      
      if (onSuccess) {
        onSuccess();
      }
      
      setIsPasswordModalOpen(false);
      onClose();
      setIsLoading(false);
    } catch (err) {
      console.error("Error saving quiz:", err);
      toast.error("An error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        className={styles.modal}
        showCloseButton={false}
        closeOnBackdropClick={true}
      >
        <form className={styles.form}>
          {/* Header with Title and Progress Dots */}
          <div className={styles.modalHeader}>
            <h2 className={styles.modalTitle}>{quizId ? "Edit Quiz" : "Create Quiz"}</h2>
            <div className={styles.progressDots}>
              {[1, 2].map((step) => (
                <div
                  key={step}
                  className={`${styles.progressDot} ${
                    step === currentStep ? styles.active : step < currentStep ? styles.completed : ""
                  }`}
                >
                  {step < currentStep ? "✓" : step}
                </div>
              ))}
            </div>
          </div>

          <div className={styles.formContent}>
            {/* Step 1: Quiz Settings */}
            {currentStep === 1 && (
              <div className={styles.stepContent}>
                <div className={styles.stepFields}>
                  <Input
                    label="Quiz Title"
                    placeholder="e.g., Customer Service Assessment"
                    value={quizTitle}
                    onChange={(e) => setQuizTitle(e.target.value)}
                    required
                  />
                  <div className={styles.row}>
                    <Input
                      label="Passing Score (%)"
                      type="number"
                      min={0}
                      max={100}
                      value={passingScore}
                      onChange={(e) => setPassingScore(parseInt(e.target.value) || 70)}
                    />
                    <Input
                      label="Time Limit (seconds, optional)"
                      type="number"
                      min={0}
                      value={timeLimit || ""}
                      onChange={(e) => setTimeLimit(e.target.value ? parseInt(e.target.value) : undefined)}
                      placeholder="No limit"
                    />
                  </div>
                  <Input
                    label="Questions to Show (optional)"
                    type="number"
                    min={1}
                    value={questionsToShow || ""}
                    onChange={(e) => setQuestionsToShow(e.target.value ? parseInt(e.target.value) : null)}
                    placeholder="Show all questions"
                    helperText="Leave empty to show all questions. Set a number to randomly select that many questions per attempt (helps prevent cheating)."
                  />
                  <div className={styles.checkboxRow}>
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={allowRetake}
                        onChange={(e) => setAllowRetake(e.target.checked)}
                      />
                      <span>Allow retake</span>
                    </label>
                    {allowRetake && (
                      <div className={styles.maxAttemptsSection}>
                        <label className={styles.checkboxLabel}>
                          <input
                            type="checkbox"
                            checked={isUnlimitedAttempts}
                            onChange={(e) => {
                              setIsUnlimitedAttempts(e.target.checked);
                              if (e.target.checked) {
                                setMaxAttempts(undefined);
                              } else {
                                setMaxAttempts(3);
                              }
                            }}
                          />
                          <span>Unlimited attempts</span>
                        </label>
                        {!isUnlimitedAttempts && (
                          <Input
                            label="Max Attempts"
                            type="number"
                            min={1}
                            value={maxAttempts || ""}
                            onChange={(e) => setMaxAttempts(e.target.value ? parseInt(e.target.value) : 3)}
                            placeholder="3"
                          />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Questions */}
            {currentStep === 2 && (
              <div className={styles.stepContent}>
                <div className={styles.stepFields}>
                  <div className={styles.questionTypeButtons}>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddQuestion("multiple-choice")}
                    >
                      Multiple Choice
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddQuestion("true-false")}
                    >
                      True/False
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddQuestion("short-answer")}
                    >
                      Short Answer
                    </Button>
                  </div>

                  {questions.length === 0 ? (
                    <div className={styles.emptyState}>
                      <p>No questions yet. Add your first question above.</p>
                    </div>
                  ) : (
                    <div className={styles.questionsList}>
                      {questions.map((question, index) => (
                        <div key={question.id} className={styles.questionCard}>
                          <div className={styles.questionHeader}>
                            <span className={styles.questionNumber}>Q{index + 1}</span>
                            <span className={styles.questionType}>{question.type}</span>
                            <span className={styles.questionPoints}>{question.points} pts</span>
                          </div>
                          <p className={styles.questionText}>{question.question}</p>
                          <div className={styles.questionActions}>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditQuestion(question)}
                            >
                              Edit
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteQuestion(question.id)}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className={styles.actions}>
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={currentStep === 1 ? onClose : handleBack}
              disabled={isLoading}
            >
              {currentStep === 1 ? "Cancel" : "Back"}
            </Button>
            {currentStep < totalSteps ? (
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleNext}
                disabled={!validateStep(currentStep)}
              >
                Next
              </Button>
            ) : (
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleSubmit}
                isLoading={isLoading}
              >
                {hasExistingQuiz ? "Update Quiz" : "Create Quiz"}
              </Button>
            )}
          </div>
        </form>
      </Modal>

      {isPasswordModalOpen && (
        <AdminPasswordVerification
          isOpen={isPasswordModalOpen}
          onClose={() => {
            setIsPasswordModalOpen(false);
          }}
          onVerify={async (password) => {
            await saveQuiz(password);
          }}
          action="update this quiz"
          isLoading={isLoading}
          passwordType="trainer"
        />
      )}

      {isQuestionModalOpen && editingQuestion && (
        <QuestionEditor
          isOpen={isQuestionModalOpen}
          onClose={() => {
            setIsQuestionModalOpen(false);
            setEditingQuestion(null);
          }}
          question={editingQuestion}
          onSave={handleSaveQuestion}
        />
      )}
    </>
  );
};

interface QuestionEditorProps {
  isOpen: boolean;
  onClose: () => void;
  question: Question;
  onSave: (question: Question) => void;
}

const QuestionEditor: React.FC<QuestionEditorProps> = ({
  isOpen,
  onClose,
  question: initialQuestion,
  onSave,
}) => {
  const [question, setQuestion] = useState<Question>(initialQuestion);

  useEffect(() => {
    setQuestion(initialQuestion);
  }, [initialQuestion]);

  const handleSave = () => {
    onSave(question);
  };

  const handleOptionChange = (index: number, value: string) => {
    if (!question.options) return;
    const updated = [...question.options];
    updated[index] = value;
    setQuestion({ ...question, options: updated });
  };

  const handleAddOption = () => {
    if (!question.options) return;
    setQuestion({
      ...question,
      options: [...question.options, ""],
    });
  };

  const handleRemoveOption = (index: number) => {
    if (!question.options || question.options.length <= 2) {
      toast.error("At least 2 options are required");
      return;
    }
    const updated = question.options.filter((_, i) => i !== index);
    setQuestion({ ...question, options: updated });
    // Adjust correctAnswer if needed
    if (typeof question.correctAnswer === "number" && question.correctAnswer >= index) {
      setQuestion({
        ...question,
        options: updated,
        correctAnswer: Math.max(0, question.correctAnswer - 1),
      });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit ${question.type === "multiple-choice" ? "Multiple Choice" : question.type === "true-false" ? "True/False" : "Short Answer"} Question`}
      className={styles.questionModal}
    >
      <div className={styles.questionEditor}>
        <Textarea
          label="Question"
          placeholder="Enter your question..."
          rows={3}
          value={question.question}
          onChange={(e) => setQuestion({ ...question, question: e.target.value })}
          required
        />

        {question.type === "multiple-choice" && (
          <div className={styles.optionsSection}>
            <label className={styles.optionsLabel}>Answer Options</label>
            <p className={styles.optionsHelperText}>Click the box to mark an option as the correct answer</p>
            <div className={styles.optionsList}>
              {question.options?.map((option, index) => (
                <div key={index} className={styles.optionItem}>
                  <button
                    type="button"
                    className={`${styles.correctAnswerBox} ${
                      question.correctAnswer === index ? styles.correct : ""
                    }`}
                    onClick={() => setQuestion({ ...question, correctAnswer: index })}
                    aria-label={`Mark option ${index + 1} as correct answer`}
                    title={question.correctAnswer === index ? "Correct answer" : "Click to mark as correct answer"}
                  />
                  <div className={styles.optionInputWrapper}>
                    <Input
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      placeholder={`Enter option ${index + 1}...`}
                      className={styles.optionInput}
                    />
                  </div>
                  {question.options && question.options.length > 2 && (
                    <button
                      type="button"
                      className={styles.removeOptionButton}
                      onClick={() => handleRemoveOption(index)}
                      aria-label={`Remove option ${index + 1}`}
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddOption}
              className={styles.addOptionButton}
            >
              <Plus size={16} />
              Add Option
            </Button>
          </div>
        )}

        {question.type === "true-false" && (
          <div className={styles.trueFalseSection}>
            <label className={styles.optionsLabel}>Correct Answer</label>
            <p className={styles.optionsHelperText}>Click the box to mark the correct answer</p>
            <div className={styles.trueFalseOptions}>
              <div className={styles.trueFalseItem}>
                <button
                  type="button"
                  className={`${styles.correctAnswerBox} ${
                    question.correctAnswer === "true" ? styles.correct : ""
                  }`}
                  onClick={() => setQuestion({ ...question, correctAnswer: "true" })}
                  aria-label="Mark True as correct answer"
                  title={question.correctAnswer === "true" ? "Correct answer" : "Click to mark as correct answer"}
                />
                <span className={styles.trueFalseLabel}>True</span>
              </div>
              <div className={styles.trueFalseItem}>
                <button
                  type="button"
                  className={`${styles.correctAnswerBox} ${
                    question.correctAnswer === "false" ? styles.correct : ""
                  }`}
                  onClick={() => setQuestion({ ...question, correctAnswer: "false" })}
                  aria-label="Mark False as correct answer"
                  title={question.correctAnswer === "false" ? "Correct answer" : "Click to mark as correct answer"}
                />
                <span className={styles.trueFalseLabel}>False</span>
              </div>
            </div>
          </div>
        )}

        {question.type === "short-answer" && (
          <Input
            label="Correct Answer"
            placeholder="Enter the correct answer..."
            value={question.correctAnswer as string}
            onChange={(e) => setQuestion({ ...question, correctAnswer: e.target.value })}
            required
          />
        )}

        <div className={styles.row}>
          <Input
            label="Points"
            type="number"
            min={1}
            value={question.points}
            onChange={(e) => setQuestion({ ...question, points: parseInt(e.target.value) || 1 })}
          />
        </div>

        <Textarea
          label="Explanation (Optional)"
          placeholder="Explain why this is the correct answer..."
          rows={2}
          value={question.explanation || ""}
          onChange={(e) => setQuestion({ ...question, explanation: e.target.value })}
        />

        <div className={styles.questionActions}>
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={handleSave}
          >
            Save Question
          </Button>
        </div>
      </div>
    </Modal>
  );
};

