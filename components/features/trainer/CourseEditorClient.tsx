"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { TrainingEditor } from "./TrainingEditor";
import { QuizBuilder } from "./QuizBuilder";
import { MiniTrainingManager } from "./MiniTrainingManager";
import { CourseEditModal } from "./CourseEditModal";
import { AdminPasswordVerification } from "./AdminPasswordVerification";
import toast from "react-hot-toast";
import styles from "./CourseEditorClient.module.css";

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string | null;
  totalXP: number;
  isPublished: boolean;
  trainings?: Array<{
    id: string;
    title: string;
    shortDescription: string | null;
    videoUrl: string | null;
    category: string | null;
    order: number;
    isPublished: boolean;
    quiz: {
      id: string;
      title: string;
      passingScore: number;
      _count?: {
        quizAttempts: number;
      };
    } | null;
    miniTrainings?: Array<{
      id: string;
      title: string;
      miniQuiz: {
        id: string;
        title: string;
      } | null;
    }>;
    _count?: {
      trainingProgress: number;
    };
  }>;
  _count?: {
    courseProgresses: number;
  };
}

interface CourseEditorClientProps {
  course: Course;
}

export const CourseEditorClient: React.FC<CourseEditorClientProps> = ({ course: initialCourse }) => {
  const router = useRouter();
  const [course, setCourse] = useState(initialCourse);
  const [isCourseEditModalOpen, setIsCourseEditModalOpen] = useState(false);
  const [isTrainingEditorOpen, setIsTrainingEditorOpen] = useState(false);
  const [isQuizBuilderOpen, setIsQuizBuilderOpen] = useState(false);
  const [isMiniTrainingManagerOpen, setIsMiniTrainingManagerOpen] = useState(false);
  const [selectedTrainingId, setSelectedTrainingId] = useState<string | null>(null);
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<"edit" | "delete" | "publish" | null>(null);
  const [pendingTrainingPublish, setPendingTrainingPublish] = useState<{trainingId: string, action: "publish" | "unpublish"} | null>(null);

  // Sync course state when initialCourse prop changes (from router.refresh())
  useEffect(() => {
    if (initialCourse.id !== course.id) {
      setCourse(initialCourse);
    }
  }, [initialCourse.id, initialCourse]);

  const handleCourseEditSuccess = async () => {
    // Refresh course data
    try {
      const response = await fetch(`/api/trainer/courses/${course.id}`);
      const result = await response.json();
      if (result.success) {
        setCourse(result.data.course);
      }
    } catch (error) {
      console.error("Error fetching course:", error);
    }
    router.refresh();
  };

  const handleTogglePublish = async (password: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/trainer/courses/${course.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password,
          isPublished: !course.isPublished,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || "Failed to update course");
        setIsLoading(false);
        return;
      }

      toast.success(course.isPublished ? "Course unpublished" : "Course published");
      setCourse(result.data.course);
      router.refresh();
    } catch (error) {
      console.error("Error updating course:", error);
      toast.error("Failed to update course");
      setIsLoading(false);
    }
  };

  const handleDeleteCourse = async (password: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/trainer/courses/${course.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        const result = await response.json();
        toast.error(result.error || "Failed to delete course");
        setIsLoading(false);
        return;
      }

      toast.success("Course deleted successfully");
      router.push("/employee/trainer/workshop");
    } catch (error) {
      console.error("Error deleting course:", error);
      toast.error("Failed to delete course");
      setIsLoading(false);
    }
  };

  const handleAddTraining = () => {
    setSelectedTrainingId(null);
    setIsTrainingEditorOpen(true);
  };

  const handleEditTraining = (trainingId: string) => {
    setSelectedTrainingId(trainingId);
    setIsTrainingEditorOpen(true);
  };

  const handleAddQuiz = (trainingId: string) => {
    setSelectedTrainingId(trainingId);
    setSelectedQuizId(null); // Clear quiz ID to ensure create mode
    setIsQuizBuilderOpen(true);
  };

  const handleEditQuiz = (trainingId: string, quizId: string) => {
    setSelectedTrainingId(trainingId);
    setSelectedQuizId(quizId);
    setIsQuizBuilderOpen(true);
  };

  const handleToggleTrainingPublish = (training: { id: string; isPublished: boolean }) => {
    setPendingTrainingPublish({
      trainingId: training.id,
      action: training.isPublished ? "unpublish" : "publish",
    });
    setIsPasswordModalOpen(true);
  };

  const saveTrainingPublishToggle = async (password: string) => {
    if (!pendingTrainingPublish) return;

    setIsLoading(true);
    try {
      const training = course.trainings.find(t => t.id === pendingTrainingPublish.trainingId);
      if (!training) {
        toast.error("Training not found");
        setIsLoading(false);
        return;
      }

      const response = await fetch(`/api/trainer/trainings/${pendingTrainingPublish.trainingId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password,
          isPublished: !training.isPublished,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || "Failed to update training");
        setIsLoading(false);
        return;
      }

      toast.success(training.isPublished ? "Training unpublished" : "Training published");
      await handleTrainingSuccess();
      setIsPasswordModalOpen(false);
      setPendingTrainingPublish(null);
      setIsLoading(false);
    } catch (error) {
      console.error("Error updating training:", error);
      toast.error("Failed to update training");
      setIsLoading(false);
    }
  };

  const handleManageMiniTrainings = (trainingId: string) => {
    setSelectedTrainingId(trainingId);
    setIsMiniTrainingManagerOpen(true);
  };

  const handleTrainingSuccess = async () => {
    // Refresh course data
    try {
      const response = await fetch(`/api/trainer/courses/${course.id}`);
      const result = await response.json();
      if (result.success) {
        setCourse(result.data.course);
      }
    } catch (error) {
      console.error("Error fetching course:", error);
    }
    router.refresh();
  };

  return (
    <>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/employee/trainer/workshop")}
          >
            Back to Workshop
          </Button>
        </div>

        {/* Course Info Section */}
        <Card className={styles.courseInfoCard}>
          <CardHeader>
            <div className={styles.cardHeader}>
              <div className={styles.headerLeft}>
                <h2 className={styles.courseTitle}>{course.title}</h2>
                <p className={styles.courseDescription}>{course.description}</p>
              </div>
              <div className={styles.headerActions}>
                <Button
                  variant={course.isPublished ? "primary" : "outline"}
                  size="sm"
                  onClick={() => {
                    setPendingAction("publish");
                    setIsPasswordModalOpen(true);
                  }}
                  disabled={isLoading}
                  className={styles.actionButton}
                >
                  {course.isPublished ? "Published" : "Unpublish"}
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleAddTraining}
                  className={styles.actionButton}
                >
                  Add Training
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsCourseEditModalOpen(true);
                  }}
                  className={styles.actionButton}
                >
                  Edit
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardBody>
            <div className={styles.courseInfo}>
              <div className={styles.courseStats}>
                <div className={styles.statGroup}>
                  <div className={styles.statItem}>
                    <span className={styles.statValue}>{course.totalXP}</span>
                    <span className={styles.statLabel}>XP</span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statValue}>{course.trainings?.length ?? 0}</span>
                    <span className={styles.statLabel}>Trainings</span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statValue}>{course._count?.courseProgresses ?? 0}</span>
                    <span className={styles.statLabel}>Enrollments</span>
                  </div>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Trainings Section */}
        <Card className={styles.trainingsCard}>
          <CardHeader>
            <div className={styles.cardHeader}>
              <h2 className={styles.sectionTitle}>Trainings ({course.trainings.length})</h2>
            </div>
          </CardHeader>
          <CardBody>
            {!course.trainings || course.trainings.length === 0 ? (
              <div className={styles.emptyState}>
                <p>No trainings yet. Add your first training to get started!</p>
              </div>
            ) : (
              <div className={styles.trainingsList}>
                {course.trainings.map((training, index) => (
                  <div key={training.id} className={styles.trainingCard}>
                    <div className={styles.trainingMain}>
                      <div className={styles.trainingContent}>
                        <div className={styles.trainingHeader}>
                          <div className={styles.trainingNumber}>#{index + 1}</div>
                          <div className={styles.trainingTitleGroup}>
                            {training.category && (
                              <div className={styles.trainingCategory}>{training.category}</div>
                            )}
                            <h4 className={styles.trainingTitle}>{training.title}</h4>
                          </div>
                          <Button
                            variant={training.isPublished ? "primary" : "outline"}
                            size="sm"
                            onClick={() => handleToggleTrainingPublish(training)}
                            className={styles.actionButton}
                          >
                            {training.isPublished ? "Published" : "Unpublish"}
                          </Button>
                        </div>
                        {training.shortDescription && (
                          <p className={styles.trainingDescription}>{training.shortDescription}</p>
                        )}
                      </div>
                      <div className={styles.trainingActions}>
                        {training.videoUrl && (
                          <Button
                            variant="outline"
                            size="sm"
                            className={styles.actionButton}
                          >
                            Video
                          </Button>
                        )}
                        {training.quiz ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditQuiz(training.id, training.quiz!.id)}
                            className={styles.actionButton}
                          >
                            Edit Quiz
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddQuiz(training.id)}
                            className={styles.actionButton}
                          >
                            Add Quiz
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditTraining(training.id)}
                          className={styles.actionButton}
                        >
                          Edit
                        </Button>
                      </div>
                    </div>
                    <div className={styles.trainingFooter}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleManageMiniTrainings(training.id)}
                        className={styles.miniTrainingButton}
                      >
                        Mini Trainings ({training.miniTrainings?.length ?? 0})
                      </Button>
                      <div className={styles.trainingStats}>
                        <span className={styles.statBadge}>{training._count?.trainingProgress ?? 0} Enrollments</span>
                        {training.quiz && (
                          <span className={styles.statBadge}>
                            {training.quiz._count?.quizAttempts ?? 0} Quiz Attempts
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

      </div>

      {/* Modals */}
      {isTrainingEditorOpen && (
        <TrainingEditor
          isOpen={isTrainingEditorOpen}
          onClose={() => {
            setIsTrainingEditorOpen(false);
            setSelectedTrainingId(null);
          }}
          courseId={course.id}
          trainingId={selectedTrainingId || undefined}
          onSuccess={handleTrainingSuccess}
        />
      )}

      {isQuizBuilderOpen && selectedTrainingId && (
        <QuizBuilder
          isOpen={isQuizBuilderOpen}
          onClose={() => {
            setIsQuizBuilderOpen(false);
            setSelectedTrainingId(null);
            setSelectedQuizId(null); // Clear quiz ID on close
          }}
          trainingId={selectedTrainingId}
          quizId={selectedQuizId || undefined}
          onSuccess={handleTrainingSuccess}
        />
      )}

      {isPasswordModalOpen && (
        <AdminPasswordVerification
          isOpen={isPasswordModalOpen}
          onClose={() => {
            setIsPasswordModalOpen(false);
            setPendingAction(null);
            setPendingTrainingPublish(null);
          }}
          onVerify={async (password) => {
            if (pendingTrainingPublish) {
              await saveTrainingPublishToggle(password);
            } else if (pendingAction === "publish") {
              await handleTogglePublish(password);
              setIsPasswordModalOpen(false);
              setPendingAction(null);
            } else if (pendingAction === "delete") {
              await handleDeleteCourse(password);
              setIsPasswordModalOpen(false);
              setPendingAction(null);
            }
          }}
          action={
            pendingTrainingPublish
              ? pendingTrainingPublish.action === "publish"
                ? "publish this training"
                : "unpublish this training"
              : pendingAction === "publish"
              ? course.isPublished
                ? "unpublish this course"
                : "publish this course"
              : "delete this course"
          }
          isLoading={isLoading}
          passwordType="trainer"
        />
      )}

      {isMiniTrainingManagerOpen && selectedTrainingId && (
        <MiniTrainingManager
          isOpen={isMiniTrainingManagerOpen}
          onClose={() => {
            setIsMiniTrainingManagerOpen(false);
            setSelectedTrainingId(null);
          }}
          trainingId={selectedTrainingId}
          onSuccess={handleTrainingSuccess}
        />
      )}

      {isCourseEditModalOpen && (
        <CourseEditModal
          isOpen={isCourseEditModalOpen}
          onClose={() => {
            setIsCourseEditModalOpen(false);
          }}
          course={course}
          onSuccess={handleCourseEditSuccess}
          onDelete={handleDeleteCourse}
        />
      )}
    </>
  );
};

