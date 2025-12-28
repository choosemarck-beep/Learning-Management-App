"use client";

import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Plus, Trash2, Edit2, FileQuestion, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Modal } from "@/components/ui/Modal";
import { QuizBuilder } from "./QuizBuilder";
import { AdminPasswordVerification } from "./AdminPasswordVerification";
import styles from "./MiniTrainingManager.module.css";

interface MiniTraining {
  id: string;
  title: string;
  description: string | null;
  videoUrl: string | null;
  videoDuration: number | null;
  order: number;
  isRequired: boolean;
  miniQuiz?: {
    id: string;
    title: string;
  } | null;
}

interface MiniTrainingManagerProps {
  isOpen: boolean;
  onClose: () => void;
  trainingId: string;
  onSuccess?: () => void;
}

export const MiniTrainingManager: React.FC<MiniTrainingManagerProps> = ({
  isOpen,
  onClose,
  trainingId,
  onSuccess,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [miniTrainings, setMiniTrainings] = useState<MiniTraining[]>([]);
  const [editingMiniTraining, setEditingMiniTraining] = useState<MiniTraining | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isQuizBuilderOpen, setIsQuizBuilderOpen] = useState(false);
  const [selectedMiniTrainingId, setSelectedMiniTrainingId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchMiniTrainings();
    }
  }, [isOpen, trainingId]);

  const fetchMiniTrainings = async () => {
    try {
      const response = await fetch(`/api/trainer/trainings/${trainingId}/mini-trainings`);
      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || "Failed to load mini trainings");
        return;
      }

      setMiniTrainings(result.data.miniTrainings || []);
    } catch (error) {
      console.error("Error fetching mini trainings:", error);
      toast.error("Failed to load mini trainings");
    }
  };

  const handleAddMiniTraining = () => {
    setEditingMiniTraining(null);
    setIsEditorOpen(true);
  };

  const handleEditMiniTraining = (miniTraining: MiniTraining) => {
    setEditingMiniTraining(miniTraining);
    setIsEditorOpen(true);
  };

  const handleToggleRequired = async (miniTrainingId: string, currentStatus: boolean) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/trainer/mini-trainings/${miniTrainingId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isRequired: !currentStatus,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || "Failed to update required status");
        return;
      }

      toast.success(`Mini training marked as ${!currentStatus ? "required" : "optional"}`);
      fetchMiniTrainings();
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error toggling required status:", error);
      toast.error("Failed to update required status");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteMiniTraining = async (miniTrainingId: string) => {
    if (!confirm("Are you sure you want to delete this mini training?")) {
      return;
    }

    try {
      const response = await fetch(`/api/trainer/mini-trainings/${miniTrainingId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || "Failed to delete mini training");
        return;
      }

      toast.success("Mini training deleted successfully");
      fetchMiniTrainings();
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error deleting mini training:", error);
      toast.error("Failed to delete mini training");
    }
  };

  const handleOpenQuizBuilder = (miniTrainingId: string) => {
    setSelectedMiniTrainingId(miniTrainingId);
    setIsQuizBuilderOpen(true);
  };

  const handleEditorSuccess = () => {
    setIsEditorOpen(false);
    setEditingMiniTraining(null);
    fetchMiniTrainings();
    if (onSuccess) {
      onSuccess();
    }
  };

  const handleQuizBuilderSuccess = () => {
    setIsQuizBuilderOpen(false);
    setSelectedMiniTrainingId(null);
    fetchMiniTrainings();
    if (onSuccess) {
      onSuccess();
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Manage Mini Trainings"
        className={styles.modal}
      >
        <div className={styles.container}>
          <div className={styles.header}>
            <p className={styles.description}>
              Mini trainings are updates or additional content nested under the main training.
              They can include videos and quizzes.
            </p>
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={handleAddMiniTraining}
            >
              <Plus size={18} /> Add Mini Training
            </Button>
          </div>

          {miniTrainings.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No mini trainings yet. Add your first mini training above.</p>
            </div>
          ) : (
            <div className={styles.miniTrainingsList}>
              {miniTrainings.map((miniTraining, index) => (
                <div key={miniTraining.id} className={styles.miniTrainingCard}>
                  <div className={styles.miniTrainingHeader}>
                    <div className={styles.miniTrainingInfo}>
                      <span className={styles.miniTrainingNumber}>#{index + 1}</span>
                      <h4 className={styles.miniTrainingTitle}>{miniTraining.title}</h4>
                    </div>
                    <div className={styles.miniTrainingActions}>
                      <Button
                        type="button"
                        variant={miniTraining.isRequired ? "primary" : "secondary"}
                        size="sm"
                        onClick={() => handleToggleRequired(miniTraining.id, miniTraining.isRequired)}
                        disabled={isLoading}
                      >
                        {miniTraining.isRequired ? "Required" : "Optional"}
                      </Button>
                      {miniTraining.miniQuiz ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenQuizBuilder(miniTraining.id)}
                        >
                          Edit Quiz
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenQuizBuilder(miniTraining.id)}
                        >
                          Add Quiz
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditMiniTraining(miniTraining)}
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteMiniTraining(miniTraining.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                  {miniTraining.description && (
                    <p className={styles.miniTrainingDescription}>{miniTraining.description}</p>
                  )}
                  {miniTraining.videoUrl && (
                    <p className={styles.miniTrainingVideo}>
                      Video: {miniTraining.videoUrl}
                    </p>
                  )}
                  {miniTraining.miniQuiz && (
                    <div className={styles.quizIndicator}>
                      <FileQuestion size={14} />
                      <span>Quiz: {miniTraining.miniQuiz.title}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {isEditorOpen && (
        <MiniTrainingEditor
          isOpen={isEditorOpen}
          onClose={() => {
            setIsEditorOpen(false);
            setEditingMiniTraining(null);
          }}
          trainingId={trainingId}
          miniTrainingId={editingMiniTraining?.id}
          onSuccess={handleEditorSuccess}
        />
      )}

      {isQuizBuilderOpen && selectedMiniTrainingId && (
        <MiniQuizBuilder
          isOpen={isQuizBuilderOpen}
          onClose={() => {
            setIsQuizBuilderOpen(false);
            setSelectedMiniTrainingId(null);
          }}
          miniTrainingId={selectedMiniTrainingId}
          onSuccess={handleQuizBuilderSuccess}
        />
      )}
    </>
  );
};

interface MiniTrainingEditorProps {
  isOpen: boolean;
  onClose: () => void;
  trainingId: string;
  miniTrainingId?: string;
  onSuccess?: () => void;
}

const MiniTrainingEditor: React.FC<MiniTrainingEditorProps> = ({
  isOpen,
  onClose,
  trainingId,
  miniTrainingId,
  onSuccess,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoDuration, setVideoDuration] = useState<number | undefined>(undefined);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [isRequired, setIsRequired] = useState(true);
  const [isDetectingDuration, setIsDetectingDuration] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [formData, setFormData] = useState<any>(null);
  // Multi-step form state
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 2;

  useEffect(() => {
    if (isOpen && miniTrainingId) {
      fetchMiniTraining();
    } else if (isOpen && !miniTrainingId) {
      resetForm();
    }
    if (isOpen) {
      setCurrentStep(1);
    }
  }, [isOpen, miniTrainingId]);

  // Update video preview when URL changes
  useEffect(() => {
    if (videoUrl && videoUrl.trim()) {
      setVideoPreviewUrl(videoUrl.trim());
    } else {
      setVideoPreviewUrl(null);
    }
  }, [videoUrl]);

  // Auto-detect video duration when URL changes (deferred to avoid render-time updates)
  useEffect(() => {
    if (!videoUrl || !videoUrl.trim()) {
      return;
    }

    const trimmedUrl = videoUrl.trim();
    const currentDuration = videoDuration;
    
    // Skip if we're editing and already have duration set
    if (miniTrainingId && currentDuration) {
      return;
    }

    // Debounce detection to avoid too many requests
    const timeoutId = setTimeout(async () => {
      setIsDetectingDuration(true);

      try {
        // Check if it's a direct video file - use client-side detection
        if (trimmedUrl.match(/\.(mp4|webm|ogg|mov|avi|mkv)$/i)) {
          // Create video element to get duration
          const video = document.createElement("video");
          video.preload = "metadata";
          video.src = trimmedUrl;
          
          video.onloadedmetadata = () => {
            const duration = Math.floor(video.duration);
            if (duration > 0 && duration !== currentDuration) {
              // Defer state updates to next tick to avoid render-time updates
              setTimeout(() => {
                setVideoDuration(duration);
                toast.success(`Video duration detected: ${Math.floor(duration / 60)}:${String(duration % 60).padStart(2, "0")}`);
                setIsDetectingDuration(false);
              }, 0);
            } else {
              setIsDetectingDuration(false);
            }
          };

          video.onerror = () => {
            setIsDetectingDuration(false);
          };
        } else {
          // For YouTube/Vimeo, try API endpoint
          const response = await fetch("/api/video/metadata", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ videoUrl: trimmedUrl }),
          });

          const result = await response.json();

          if (result.success && result.duration && result.duration !== currentDuration) {
            const duration = result.duration;
            // Defer state updates to next tick
            setTimeout(() => {
              setVideoDuration(duration);
              toast.success(`Video duration detected: ${Math.floor(duration / 60)}:${String(duration % 60).padStart(2, "0")}`);
              setIsDetectingDuration(false);
            }, 0);
          } else {
            setIsDetectingDuration(false);
          }
        }
      } catch (error) {
        console.error("Error detecting video duration:", error);
        setIsDetectingDuration(false);
      }
    }, 1000); // Wait 1 second after user stops typing

    return () => clearTimeout(timeoutId);
  }, [videoUrl, miniTrainingId]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setVideoUrl("");
    setVideoDuration(undefined);
    setVideoPreviewUrl(null);
    setIsRequired(true);
    setIsDetectingDuration(false);
    setCurrentStep(1);
  };

  const fetchMiniTraining = async () => {
    try {
      const response = await fetch(`/api/trainer/mini-trainings/${miniTrainingId}`);
      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || "Failed to load mini training");
        return;
      }

      const miniTraining = result.data.miniTraining;
      setTitle(miniTraining.title || "");
      setDescription(miniTraining.description || "");
      setVideoUrl(miniTraining.videoUrl || "");
      setVideoPreviewUrl(miniTraining.videoUrl || null);
      setVideoDuration(miniTraining.videoDuration || undefined);
      setIsRequired(miniTraining.isRequired !== undefined ? miniTraining.isRequired : true);
    } catch (error) {
      console.error("Error fetching mini training:", error);
      toast.error("Failed to load mini training");
    }
  };

  const getVideoEmbedUrl = (url: string): string | null => {
    if (!url) return null;

    // YouTube
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const youtubeMatch = url.match(youtubeRegex);
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
    }

    // Vimeo
    const vimeoRegex = /(?:vimeo\.com\/)(?:.*\/)?(\d+)/;
    const vimeoMatch = url.match(vimeoRegex);
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }

    // Direct video URL (MP4, WebM, etc.)
    if (url.match(/\.(mp4|webm|ogg|mov)$/i)) {
      return url;
    }

    return null;
  };

  // Step validation
  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!title.trim() && title.trim().length >= 3;
      case 2:
        return true; // Video is optional
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep) && currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else if (currentStep === 1 && !title.trim()) {
      toast.error("Title is required");
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (currentStep < totalSteps) {
      return;
    }

    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    // If editing, require password verification
    if (miniTrainingId) {
      setFormData({
        title,
        description: description || null,
        videoUrl: videoUrl || null,
        videoDuration: videoDuration || null,
        isRequired,
      });
      setIsPasswordModalOpen(true);
      return;
    }

    // Creating new mini training - no password required
    await saveMiniTraining({
      title,
      description: description || null,
      videoUrl: videoUrl || null,
      videoDuration: videoDuration || null,
      isRequired,
    });
  };

  const saveMiniTraining = async (data: any, password?: string) => {
    setIsLoading(true);

    try {
      const url = miniTrainingId
        ? `/api/trainer/mini-trainings/${miniTrainingId}`
        : `/api/trainer/trainings/${trainingId}/mini-trainings`;
      const method = miniTrainingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...(password && { password }),
          ...data,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        const errorMessage = result.error || "Failed to save mini training";
        toast.error(errorMessage);
        setIsLoading(false);
        return;
      }

      toast.success(miniTrainingId ? "Mini training updated!" : "Mini training created!");
      
      if (onSuccess) {
        onSuccess();
      }
      
      setIsPasswordModalOpen(false);
      setFormData(null);
      onClose();
      setIsLoading(false);
    } catch (err) {
      console.error("Error saving mini training:", err);
      toast.error("An error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  const embedUrl = videoPreviewUrl ? getVideoEmbedUrl(videoPreviewUrl) : null;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        className={styles.editorModal}
        showCloseButton={false}
        closeOnBackdropClick={true}
      >
        <form className={styles.editorForm}>
          {/* Header with Title and Progress Dots */}
          <div className={styles.modalHeader}>
            <h2 className={styles.modalTitle}>{miniTrainingId ? "Edit Mini Training" : "Create Mini Training"}</h2>
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
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <div className={styles.stepContent}>
                <div className={styles.stepFields}>
                  <Input
                    label="Title"
                    placeholder="e.g., Q4 2024 Policy Update"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                  <Textarea
                    label="Description (Optional)"
                    placeholder="Describe what changed or what this update covers..."
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                  <div className={styles.checkboxField}>
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={isRequired}
                        onChange={(e) => setIsRequired(e.target.checked)}
                      />
                      <span>Required for 100% completion</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Video Content */}
            {currentStep === 2 && (
              <div className={styles.stepContent}>
                <div className={styles.stepFields}>
                  <Input
                    label="Video URL (Optional)"
                    placeholder="YouTube, Vimeo, or direct video URL"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                  />
                  {isDetectingDuration && (
                    <p className={styles.helperText}>
                      Detecting video duration...
                    </p>
                  )}
                  {embedUrl && (
                    <div className={styles.videoContainer}>
                      {embedUrl.includes("youtube.com") || embedUrl.includes("youtu.be") ? (
                        <iframe
                          src={embedUrl}
                          className={styles.videoIframe}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          title="Video preview"
                        />
                      ) : embedUrl.includes("vimeo.com") ? (
                        <iframe
                          src={embedUrl}
                          className={styles.videoIframe}
                          allow="autoplay; fullscreen; picture-in-picture"
                          allowFullScreen
                          title="Video preview"
                        />
                      ) : (
                        <video
                          src={embedUrl}
                          controls
                          className={styles.videoElement}
                        />
                      )}
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
                {miniTrainingId ? "Save Changes" : "Create Mini Training"}
              </Button>
            )}
          </div>
        </form>
      </Modal>

      {isPasswordModalOpen && formData && (
        <AdminPasswordVerification
          isOpen={isPasswordModalOpen}
          onClose={() => {
            setIsPasswordModalOpen(false);
            setFormData(null);
          }}
          onVerify={async (password) => {
            await saveMiniTraining(formData, password);
          }}
          action="save changes to this mini training"
          isLoading={isLoading}
          passwordType="trainer"
        />
      )}
    </>
  );
};

interface MiniQuizBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  miniTrainingId: string;
  onSuccess?: () => void;
}

const MiniQuizBuilder: React.FC<MiniQuizBuilderProps> = ({
  isOpen,
  onClose,
  miniTrainingId,
  onSuccess,
}) => {
  const [quizId, setQuizId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (isOpen) {
      fetchMiniQuiz();
    }
  }, [isOpen, miniTrainingId]);

  const fetchMiniQuiz = async () => {
    try {
      const response = await fetch(`/api/trainer/mini-trainings/${miniTrainingId}/mini-quiz`);
      const result = await response.json();

      if (response.ok && result.data.miniQuiz) {
        setQuizId(result.data.miniQuiz.id);
      } else {
        setQuizId(undefined);
      }
    } catch (error) {
      console.error("Error fetching mini quiz:", error);
      setQuizId(undefined);
    }
  };

  const handleSuccess = () => {
    if (onSuccess) {
      onSuccess();
    }
    onClose();
  };

  // MiniQuiz uses the same structure as Quiz, so we can reuse QuizBuilder
  // but we need to create a wrapper that uses the mini-quiz endpoint
  return (
    <MiniQuizBuilderWrapper
      isOpen={isOpen}
      onClose={onClose}
      miniTrainingId={miniTrainingId}
      quizId={quizId}
      onSuccess={handleSuccess}
    />
  );
};

// Import Question type from QuizBuilder
type QuestionType = "multiple-choice" | "true-false" | "short-answer";

interface Question {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[];
  correctAnswer: string | number;
  points: number;
  explanation?: string;
}

// Wrapper component that adapts QuizBuilder for mini quizzes
const MiniQuizBuilderWrapper: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  miniTrainingId: string;
  quizId?: string;
  onSuccess?: () => void;
}> = ({ isOpen, onClose, miniTrainingId, quizId, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [quizTitle, setQuizTitle] = useState("");
  const [passingScore, setPassingScore] = useState(70);
  const [questionsToShow, setQuestionsToShow] = useState<number | null>(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [formData, setFormData] = useState<any>(null);
  // Multi-step form state
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 2;

  useEffect(() => {
    if (isOpen && quizId) {
      fetchMiniQuiz();
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
    setQuestionsToShow(null);
    setEditingQuestion(null);
    setCurrentStep(1);
  };

  const fetchMiniQuiz = async () => {
    try {
      const response = await fetch(`/api/trainer/mini-trainings/${miniTrainingId}/mini-quiz`);
      const result = await response.json();

      if (!response.ok || !result.data.miniQuiz) {
        resetForm();
        return;
      }

      const quiz = result.data.miniQuiz;
      setQuizTitle(quiz.title || "");
      setPassingScore(quiz.passingScore || 70);
      setQuestionsToShow(quiz.questionsToShow || null);
      
      try {
        const parsedQuestions = JSON.parse(quiz.questions || "[]");
        if (Array.isArray(parsedQuestions) && parsedQuestions.length > 0) {
          setQuestions(parsedQuestions);
          console.log(`Loaded ${parsedQuestions.length} questions from database`);
        } else {
          setQuestions([]);
          console.log("Mini quiz exists but has no questions");
        }
      } catch (e) {
        console.error("Error parsing mini quiz questions:", e);
        setQuestions([]);
        toast.error("Failed to parse mini quiz questions. Please check the format.");
      }
    } catch (error) {
      console.error("Error fetching mini quiz:", error);
      resetForm();
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
    if (currentStep < totalSteps) {
      return;
    }

    if (!quizTitle.trim()) {
      toast.error("Quiz title is required");
      return;
    }

    if (questions.length === 0) {
      toast.error("At least one question is required");
      return;
    }

    // If updating existing quiz, require password
    if (quizId) {
      setFormData({
        title: quizTitle,
        passingScore,
        questionsToShow,
        questions,
      });
      setIsPasswordModalOpen(true);
      return;
    }

    // Creating new quiz - no password required
    await saveMiniQuiz({
      title: quizTitle,
      passingScore,
      questionsToShow,
      questions,
    });
  };

  const saveMiniQuiz = async (data: any, password?: string) => {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/trainer/mini-trainings/${miniTrainingId}/mini-quiz`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...(password && { password }),
          ...data,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        const errorMessage = result.error || "Failed to save mini quiz";
        toast.error(errorMessage);
        setIsLoading(false);
        return;
      }

      toast.success(quizId ? "Mini quiz updated!" : "Mini quiz created!");
      
      if (onSuccess) {
        onSuccess();
      }
      
      setIsPasswordModalOpen(false);
      setFormData(null);
      onClose();
      setIsLoading(false);
    } catch (err) {
      console.error("Error saving mini quiz:", err);
      toast.error("An error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        className={styles.quizModal}
        showCloseButton={false}
        closeOnBackdropClick={true}
      >
        <form className={styles.quizForm}>
          {/* Header with Title and Progress Dots */}
          <div className={styles.modalHeader}>
            <h2 className={styles.modalTitle}>{quizId ? "Edit Mini Quiz" : "Create Mini Quiz"}</h2>
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
            {/* Step 1: Settings */}
            {currentStep === 1 && (
              <div className={styles.stepContent}>
                <div className={styles.stepFields}>
                  <Input
                    label="Quiz Title"
                    placeholder="e.g., Policy Update Quiz"
                    value={quizTitle}
                    onChange={(e) => setQuizTitle(e.target.value)}
                    required
                  />
                  <Input
                    label="Passing Score (%)"
                    type="number"
                    min={0}
                    max={100}
                    value={passingScore}
                    onChange={(e) => setPassingScore(parseInt(e.target.value) || 70)}
                  />
                  <Input
                    label="Questions to Show (optional)"
                    type="number"
                    min={1}
                    value={questionsToShow || ""}
                    onChange={(e) => setQuestionsToShow(e.target.value ? parseInt(e.target.value) : null)}
                    placeholder="Show all questions"
                    helperText="Leave empty to show all questions. Set a number to randomly select that many questions per attempt (helps prevent cheating)."
                  />
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
                {quizId ? "Save Changes" : "Create Quiz"}
              </Button>
            )}
          </div>
        </form>
      </Modal>

      {isPasswordModalOpen && formData && (
        <AdminPasswordVerification
          isOpen={isPasswordModalOpen}
          onClose={() => {
            setIsPasswordModalOpen(false);
            setFormData(null);
          }}
          onVerify={async (password) => {
            await saveMiniQuiz(formData, password);
          }}
          action="save changes to this mini quiz"
          isLoading={isLoading}
          passwordType="trainer"
        />
      )}

      {isQuestionModalOpen && editingQuestion && (
        <MiniQuestionEditor
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

// Question Editor for Mini Quizzes
interface MiniQuestionEditorProps {
  isOpen: boolean;
  onClose: () => void;
  question: Question;
  onSave: (question: Question) => void;
}

const MiniQuestionEditor: React.FC<MiniQuestionEditorProps> = ({
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

