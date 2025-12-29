"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Card, CardBody } from "@/components/ui/Card";
import { CompletionRateCard } from "./CompletionRateCard";
import { TrainingCompletionCard } from "./TrainingCompletionCard";
import { CourseCompletionCard } from "./CourseCompletionCard";
import toast from "react-hot-toast";
import styles from "./TrainerDashboardClient.module.css";

interface TrainingStat {
  trainingId: string;
  title: string;
  courseTitle?: string;
  completionRate: number;
  totalAssigned: number;
  totalCompleted: number;
}

interface CourseStat {
  courseId: string;
  title: string;
  completionRate: number;
  totalAssigned: number;
  totalCompleted: number;
  trainingCount: number;
}

interface DashboardStats {
  overallCompletionRate: number;
  totalAssigned: number;
  totalCompleted: number;
  trainingStats: TrainingStat[];
  courseStats?: CourseStat[];
}

type DisplayedTraining = TrainingStat & {
  id: string;
  title: string;
  course: { id: string; title: string } | undefined;
};

interface TrainerDashboardClientProps {
  initialStats: DashboardStats;
  initialTrainingPreferences: string[]; // Array of training IDs in order
  initialCoursePreferences: string[]; // Array of course IDs in order
  allTrainings: Array<{ 
    id: string; 
    title: string;
    course?: {
      id: string;
      title: string;
    };
  }>; // All trainings created by trainer (from courses)
  allCourses: Array<{
    id: string;
    title: string;
    description: string;
    thumbnail: string | null;
    _count: {
      trainings: number;
    };
  }>; // All courses created by trainer
}

export const TrainerDashboardClient: React.FC<TrainerDashboardClientProps> = ({
  initialStats,
  initialTrainingPreferences,
  initialCoursePreferences,
  allTrainings,
  allCourses,
}) => {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>(initialStats);
  const [trainingPreferences, setTrainingPreferences] = useState<string[]>(initialTrainingPreferences);
  const [coursePreferences, setCoursePreferences] = useState<string[]>(initialCoursePreferences);
  const [allTrainingsList, setAllTrainingsList] = useState(allTrainings);
  const [allCoursesList, setAllCoursesList] = useState(allCourses);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"training" | "course">("training");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Log component initialization for debugging
  useEffect(() => {
    console.log("[TrainerDashboardClient] Component mounted and initialized:", {
      statsCount: initialStats?.trainingStats?.length || 0,
      trainingPreferencesCount: initialTrainingPreferences?.length || 0,
      coursePreferencesCount: initialCoursePreferences?.length || 0,
      allTrainingsCount: allTrainings?.length || 0,
      allCoursesCount: allCourses?.length || 0,
      hasStats: !!initialStats,
      hasTrainingPreferences: Array.isArray(initialTrainingPreferences),
      hasCoursePreferences: Array.isArray(initialCoursePreferences),
      hasAllTrainings: Array.isArray(allTrainings),
      hasAllCourses: Array.isArray(allCourses),
    });
    
    // Check for any undefined or null critical props
    if (!initialStats) {
      console.error("[TrainerDashboardClient] CRITICAL: initialStats is missing!");
      setError("Dashboard stats are missing. Please refresh the page.");
    }
    if (!Array.isArray(allTrainings)) {
      console.error("[TrainerDashboardClient] CRITICAL: allTrainings is not an array!", typeof allTrainings);
      setError("Trainings data is invalid. Please refresh the page.");
    }
    if (!Array.isArray(allCourses)) {
      console.error("[TrainerDashboardClient] CRITICAL: allCourses is not an array!", typeof allCourses);
      setError("Courses data is invalid. Please refresh the page.");
    }
  }, []);

  // Get trainings currently on dashboard
  const displayedTrainings = trainingPreferences
    .map((trainingId) => {
      const stat = stats.trainingStats.find((s) => s.trainingId === trainingId);
      const training = allTrainingsList.find((t) => t.id === trainingId);
      if (!training) return null;
      return {
        ...training,
        ...stat,
        course: training.course,
      };
    })
    .filter((t): t is DisplayedTraining => t !== null);

  // Get courses currently on dashboard
  const displayedCourses = coursePreferences
    .map((courseId) => {
      const stat = stats.courseStats?.find((s) => s.courseId === courseId);
      const course = allCoursesList.find((c) => c.id === courseId);
      if (!course) return null;
      return {
        ...course,
        ...stat,
      };
    })
    .filter((c): c is CourseStat & { id: string; title: string; description: string; thumbnail: string | null; _count: { trainings: number } } => c !== null);

  // Get trainings not on dashboard
  const availableTrainings = allTrainingsList.filter(
    (t) => !trainingPreferences.includes(t.id)
  );

  // Get courses not on dashboard
  const availableCourses = allCoursesList.filter(
    (c) => !coursePreferences.includes(c.id)
  );

  const fetchStats = useCallback(async () => {
    try {
      console.log("[TrainerDashboardClient] Fetching stats...");
      const response = await fetch("/api/trainer/dashboard/stats");
      
      if (!response.ok) {
        console.error("[TrainerDashboardClient] Stats API error:", {
          status: response.status,
          statusText: response.statusText,
        });
        setError(`Failed to fetch stats: ${response.status}`);
        return;
      }

      const data = await response.json();
      console.log("[TrainerDashboardClient] Stats fetched:", {
        success: data.success,
        statsCount: data.data?.trainingStats?.length || 0,
      });

      if (data.success) {
        setStats(data.data);
        setError(null);
      } else {
        console.error("[TrainerDashboardClient] Stats API returned error:", data.error);
        setError(data.error || "Failed to fetch stats");
      }
    } catch (error) {
      console.error("[TrainerDashboardClient] Error fetching stats:", {
        error,
        message: error instanceof Error ? error.message : String(error),
      });
      setError("Failed to fetch stats. Please refresh the page.");
    }
  }, []);

  const savePreferences = useCallback(
    async (newTrainingPreferences: string[], newCoursePreferences: string[]) => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/trainer/dashboard/preferences", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ 
            trainingIds: newTrainingPreferences,
            courseIds: newCoursePreferences,
          }),
        });

        const data = await response.json();
        if (data.success) {
          // Update preferences with the sanitized list from server
          setTrainingPreferences(data.data.trainingIds);
          setCoursePreferences(data.data.courseIds);
          if (data.warning) {
            toast.success(data.warning, { duration: 4000 });
          } else {
            toast.success("Dashboard updated");
          }
        } else {
          toast.error(data.error || "Failed to save preferences");
        }
      } catch (error) {
        console.error("Error saving preferences:", error);
        toast.error("Failed to save preferences");
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const handleAddTraining = (trainingId: string) => {
    const newPreferences = [...trainingPreferences, trainingId];
    savePreferences(newPreferences, coursePreferences);
    setIsAddModalOpen(false);
  };

  const handleAddCourse = (courseId: string) => {
    const newPreferences = [...coursePreferences, courseId];
    savePreferences(trainingPreferences, newPreferences);
    setIsAddModalOpen(false);
  };

  const handleRemoveTraining = (trainingId: string) => {
    const newPreferences = trainingPreferences.filter((id) => id !== trainingId);
    savePreferences(newPreferences, coursePreferences);
  };

  const handleRemoveCourse = (courseId: string) => {
    const newPreferences = coursePreferences.filter((id) => id !== courseId);
    savePreferences(trainingPreferences, newPreferences);
  };

  const handleMoveUp = (index: number, type: "training" | "course") => {
    if (index === 0) return;
    if (type === "training") {
      const newPreferences = [...trainingPreferences];
      [newPreferences[index - 1], newPreferences[index]] = [
        newPreferences[index],
        newPreferences[index - 1],
      ];
      savePreferences(newPreferences, coursePreferences);
    } else {
      const newPreferences = [...coursePreferences];
      [newPreferences[index - 1], newPreferences[index]] = [
        newPreferences[index],
        newPreferences[index - 1],
      ];
      savePreferences(trainingPreferences, newPreferences);
    }
  };

  const handleMoveDown = (index: number, type: "training" | "course") => {
    if (type === "training") {
      if (index === trainingPreferences.length - 1) return;
      const newPreferences = [...trainingPreferences];
      [newPreferences[index], newPreferences[index + 1]] = [
        newPreferences[index + 1],
        newPreferences[index],
      ];
      savePreferences(newPreferences, coursePreferences);
    } else {
      if (index === coursePreferences.length - 1) return;
      const newPreferences = [...coursePreferences];
      [newPreferences[index], newPreferences[index + 1]] = [
        newPreferences[index + 1],
        newPreferences[index],
      ];
      savePreferences(trainingPreferences, newPreferences);
    }
  };

  // Sync allTrainingsList and allCoursesList with props when they change
  useEffect(() => {
    console.log("[TrainerDashboardClient] Updating trainings list:", allTrainings?.length || 0);
    if (Array.isArray(allTrainings)) {
      setAllTrainingsList(allTrainings);
    } else {
      console.error("[TrainerDashboardClient] Invalid allTrainings prop:", typeof allTrainings);
      setError("Invalid trainings data received");
    }
  }, [allTrainings]);

  useEffect(() => {
    console.log("[TrainerDashboardClient] Updating courses list:", allCourses?.length || 0);
    if (Array.isArray(allCourses)) {
      setAllCoursesList(allCourses);
    } else {
      console.error("[TrainerDashboardClient] Invalid allCourses prop:", typeof allCourses);
      setError("Invalid courses data received");
    }
  }, [allCourses]);

  // Refresh stats periodically
  useEffect(() => {
    const interval = setInterval(fetchStats, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [fetchStats]);

  // Show error state if there's an error
  if (error) {
    return (
      <div className={styles.container}>
        <Card>
          <CardBody>
            <p className={styles.emptyMessage} style={{ color: "var(--color-error)" }}>
              {error}
            </p>
            <Button
              onClick={() => {
                setError(null);
                window.location.reload();
              }}
              variant="primary"
              style={{ marginTop: "var(--spacing-md)" }}
            >
              Refresh Page
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Overall Completion Rate Card */}
      <div className={styles.completionRateSection}>
        <CompletionRateCard
          overallCompletionRate={stats?.overallCompletionRate ?? 0}
          totalAssigned={stats?.totalAssigned ?? 0}
          totalCompleted={stats?.totalCompleted ?? 0}
        />
      </div>

      {/* Training Cards Section */}
      <div className={styles.trainingsSection}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>Training Completion</h2>
            <p className={styles.sectionDescription}>
              Trainings are created within courses. Go to <strong>Workshop</strong> → <strong>Courses</strong> to create courses and add trainings with videos, quizzes, and mini trainings.
            </p>
          </div>
        </div>

        {displayedTrainings.length === 0 ? (
          <Card>
            <CardBody>
              <p className={styles.emptyMessage}>
                No trainings added to dashboard. Click "Add Training" to get started!
              </p>
            </CardBody>
          </Card>
        ) : (
          <div className={styles.grid}>
            {displayedTrainings.map((training, index) => {
              const stat = stats.trainingStats.find(
                (s) => s.trainingId === training.id
              );
              return (
                <div key={training.id} className={styles.cardWrapper}>
                  <div className={styles.reorderControls}>
                    <button
                      className={styles.reorderButton}
                      onClick={() => handleMoveUp(index, "training")}
                      disabled={index === 0}
                      aria-label="Move up"
                      title="Move up"
                    >
                      <ChevronUp size={16} />
                    </button>
                    <button
                      className={styles.reorderButton}
                      onClick={() => handleMoveDown(index, "training")}
                      disabled={index === displayedTrainings.length - 1}
                      aria-label="Move down"
                      title="Move down"
                    >
                      <ChevronDown size={16} />
                    </button>
                  </div>
                  <TrainingCompletionCard
                    trainingId={training.id}
                    title={training.title}
                    completionRate={
                      stat?.completionRate ?? 0
                    }
                    totalAssigned={stat?.totalAssigned ?? 0}
                    totalCompleted={stat?.totalCompleted ?? 0}
                    courseId={training.course?.id}
                    courseTitle={training.course?.title}
                    onRemove={handleRemoveTraining}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Course Cards Section */}
      <div className={styles.trainingsSection}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>Course Completion</h2>
            <p className={styles.sectionDescription}>
              View completion rates for entire courses, aggregating all trainings within each course.
            </p>
          </div>
        </div>

        {displayedCourses.length === 0 ? (
          <Card>
            <CardBody>
              <p className={styles.emptyMessage}>
                No courses added to dashboard. Click "Add Course" to get started!
              </p>
            </CardBody>
          </Card>
        ) : (
          <div className={styles.grid}>
            {displayedCourses.map((course, index) => {
              const stat = stats.courseStats?.find(
                (s) => s.courseId === course.id
              );
              return (
                <div key={course.id} className={styles.cardWrapper}>
                  <div className={styles.reorderControls}>
                    <button
                      className={styles.reorderButton}
                      onClick={() => handleMoveUp(index, "course")}
                      disabled={index === 0}
                      aria-label="Move up"
                      title="Move up"
                    >
                      <ChevronUp size={16} />
                    </button>
                    <button
                      className={styles.reorderButton}
                      onClick={() => handleMoveDown(index, "course")}
                      disabled={index === displayedCourses.length - 1}
                      aria-label="Move down"
                      title="Move down"
                    >
                      <ChevronDown size={16} />
                    </button>
                  </div>
                  <CourseCompletionCard
                    courseId={course.id}
                    title={course.title}
                    completionRate={stat?.completionRate ?? 0}
                    totalAssigned={stat?.totalAssigned ?? 0}
                    totalCompleted={stat?.totalCompleted ?? 0}
                    trainingCount={course._count.trainings}
                    onRemove={handleRemoveCourse}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Training/Course Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={modalType === "training" ? "Add Training to Dashboard" : "Add Course to Dashboard"}
      >
        <div className={styles.modalContent}>
          {modalType === "training" ? (
            availableTrainings.length === 0 ? (
              <p className={styles.emptyMessage}>
                All trainings are already on your dashboard.
              </p>
            ) : (
              <div className={styles.trainingList}>
                {availableTrainings.map((training) => (
                  <button
                    key={training.id}
                    className={styles.trainingItem}
                    onClick={() => handleAddTraining(training.id)}
                  >
                    <div className={styles.trainingItemInfo}>
                      <span className={styles.trainingItemTitle}>{training.title}</span>
                      {training.course && (
                        <span className={styles.trainingItemCourse}>{training.course.title}</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )
          ) : (
            availableCourses.length === 0 ? (
              <p className={styles.emptyMessage}>
                All courses are already on your dashboard.
              </p>
            ) : (
              <div className={styles.trainingList}>
                {availableCourses.map((course) => (
                  <button
                    key={course.id}
                    className={styles.trainingItem}
                    onClick={() => handleAddCourse(course.id)}
                  >
                    <div className={styles.trainingItemInfo}>
                      <span className={styles.trainingItemTitle}>{course.title}</span>
                      <span className={styles.trainingItemCourse}>
                        {course._count.trainings} training{course._count.trainings !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )
          )}
        </div>
      </Modal>
    </div>
  );
};

