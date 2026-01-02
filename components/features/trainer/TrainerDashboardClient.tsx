"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { ChevronUp, ChevronDown, BookOpen, Users, CheckCircle, Trophy, Settings } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Card, CardBody } from "@/components/ui/Card";
import { Accordion } from "@/components/ui/Accordion";
import { StatsCard } from "../admin/StatsCard";
import { TrainingCompletionCard } from "./TrainingCompletionCard";
import { CourseCompletionCard } from "./CourseCompletionCard";
import { TrainerAnalyticsDashboard } from "./analytics/TrainerAnalyticsDashboard";
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
  const [stats, setStats] = useState<DashboardStats>(initialStats);
  const [trainingPreferences, setTrainingPreferences] = useState<string[]>(initialTrainingPreferences);
  const [coursePreferences, setCoursePreferences] = useState<string[]>(initialCoursePreferences);
  const [allTrainingsList, setAllTrainingsList] = useState(allTrainings);
  const [allCoursesList, setAllCoursesList] = useState(allCourses);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"training" | "course">("training");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Mount guard to prevent state updates after unmount
  const isMountedRef = useRef(false);

  // Log component initialization for debugging - Only run once on mount
  useEffect(() => {
    isMountedRef.current = true; // Mark as mounted
    
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
    
    // Check for any undefined or null critical props (only on mount)
    if (!initialStats) {
      console.error("[TrainerDashboardClient] CRITICAL: initialStats is missing!");
      if (isMountedRef.current) {
        setError("Dashboard stats are missing. Please refresh the page.");
      }
    }
    if (!Array.isArray(allTrainings)) {
      console.error("[TrainerDashboardClient] CRITICAL: allTrainings is not an array!", typeof allTrainings);
      if (isMountedRef.current) {
        setError("Trainings data is invalid. Please refresh the page.");
      }
    }
    if (!Array.isArray(allCourses)) {
      console.error("[TrainerDashboardClient] CRITICAL: allCourses is not an array!", typeof allCourses);
      if (isMountedRef.current) {
        setError("Courses data is invalid. Please refresh the page.");
      }
    }
    
    return () => {
      isMountedRef.current = false; // Mark as unmounted in cleanup
    };
  }, []); // Empty dependency array - only run once on mount

  // Get trainings currently on dashboard - Memoized to prevent unnecessary recalculations
  // CRITICAL: Must be called before early return to maintain consistent hook order
  const displayedTrainings = useMemo(() => {
    // Safety check: ensure allTrainingsList is an array
    if (!Array.isArray(allTrainingsList) || !Array.isArray(trainingPreferences)) {
      return [];
    }
    return trainingPreferences
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
  }, [trainingPreferences, stats.trainingStats, allTrainingsList]);

  // Get courses currently on dashboard - Memoized to prevent unnecessary recalculations
  // CRITICAL: Must be called before early return to maintain consistent hook order
  const displayedCourses = useMemo(() => {
    // Safety check: ensure allCoursesList is an array
    if (!Array.isArray(allCoursesList) || !Array.isArray(coursePreferences)) {
      return [];
    }
    return coursePreferences
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
  }, [coursePreferences, stats.courseStats, allCoursesList]);

  // Get trainings not on dashboard - Memoized to prevent unnecessary recalculations
  // CRITICAL: Must be called before early return to maintain consistent hook order
  const availableTrainings = useMemo(() => {
    // Safety check: ensure allTrainingsList is an array
    if (!Array.isArray(allTrainingsList) || !Array.isArray(trainingPreferences)) {
      return [];
    }
    return allTrainingsList.filter(
      (t) => !trainingPreferences.includes(t.id)
    );
  }, [allTrainingsList, trainingPreferences]);

  // Get courses not on dashboard - Memoized to prevent unnecessary recalculations
  // CRITICAL: Must be called before early return to maintain consistent hook order
  const availableCourses = useMemo(() => {
    // Safety check: ensure allCoursesList is an array
    if (!Array.isArray(allCoursesList) || !Array.isArray(coursePreferences)) {
      return [];
    }
    return allCoursesList.filter(
      (c) => !coursePreferences.includes(c.id)
    );
  }, [allCoursesList, coursePreferences]);

  const fetchStats = useCallback(async () => {
    if (!isMountedRef.current) return; // Guard: Don't proceed if unmounted
    
    try {
      console.log("[TrainerDashboardClient] Fetching stats...");
      const response = await fetch("/api/trainer/dashboard/stats");
      
      if (!isMountedRef.current) return; // Guard: Check again before setting state
      
      if (!response.ok) {
        console.error("[TrainerDashboardClient] Stats API error:", {
          status: response.status,
          statusText: response.statusText,
        });
        if (isMountedRef.current) {
          setError(`Failed to fetch stats: ${response.status}`);
        }
        return;
      }

      const data = await response.json();
      
      if (!isMountedRef.current) return; // Guard: Check again before setting state
      
      console.log("[TrainerDashboardClient] Stats fetched:", {
        success: data.success,
        statsCount: data.data?.trainingStats?.length || 0,
      });

      if (data.success) {
        if (isMountedRef.current) {
          setStats(data.data);
          setError(null);
        }
      } else {
        console.error("[TrainerDashboardClient] Stats API returned error:", data.error);
        if (isMountedRef.current) {
          setError(data.error || "Failed to fetch stats");
        }
      }
    } catch (error) {
      if (!isMountedRef.current) return; // Guard: Check before error handling
      console.error("[TrainerDashboardClient] Error fetching stats:", {
        error,
        message: error instanceof Error ? error.message : String(error),
      });
      if (isMountedRef.current) {
        setError("Failed to fetch stats. Please refresh the page.");
      }
    }
  }, []);

  const savePreferences = useCallback(
    async (newTrainingPreferences: string[], newCoursePreferences: string[]) => {
      if (!isMountedRef.current) return; // Guard: Don't proceed if unmounted
      
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

        if (!isMountedRef.current) return; // Guard: Check again before setting state

        const data = await response.json();
        if (data.success) {
          // Update preferences with the sanitized list from server
          if (isMountedRef.current) {
            setTrainingPreferences(data.data.trainingIds);
            setCoursePreferences(data.data.courseIds);
            if (data.warning) {
              toast.success(data.warning, { duration: 4000 });
            } else {
              toast.success("Dashboard updated");
            }
          }
        } else {
          if (isMountedRef.current) {
            toast.error(data.error || "Failed to save preferences");
          }
        }
      } catch (error) {
        if (!isMountedRef.current) return; // Guard: Check before error handling
        console.error("Error saving preferences:", error);
        if (isMountedRef.current) {
          toast.error("Failed to save preferences");
        }
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
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

  // Use refs to track previous prop values for comparison
  const prevTrainingsRef = useRef<string>("");
  const prevCoursesRef = useRef<string>("");

  // Sync allTrainingsList and allCoursesList with props when they change
  // Only update if the array contents actually changed (not just reference)
  useEffect(() => {
    if (!isMountedRef.current) return; // Guard: Don't proceed if unmounted
    
    // Create a stable string representation of the trainings array for comparison
    const trainingsKey = Array.isArray(allTrainings) 
      ? allTrainings.map(t => t.id).sort().join(",")
      : "";
    
    // Only update if the contents actually changed
    if (prevTrainingsRef.current !== trainingsKey) {
      prevTrainingsRef.current = trainingsKey;
      console.log("[TrainerDashboardClient] Updating trainings list:", allTrainings?.length || 0);
      if (Array.isArray(allTrainings)) {
        if (isMountedRef.current) {
          setAllTrainingsList(allTrainings);
        }
      } else {
        console.error("[TrainerDashboardClient] Invalid allTrainings prop:", typeof allTrainings);
        if (isMountedRef.current) {
          setError("Invalid trainings data received");
        }
      }
    }
  }, [allTrainings]);

  useEffect(() => {
    if (!isMountedRef.current) return; // Guard: Don't proceed if unmounted
    
    // Create a stable string representation of the courses array for comparison
    const coursesKey = Array.isArray(allCourses)
      ? allCourses.map(c => c.id).sort().join(",")
      : "";
    
    // Only update if the contents actually changed
    if (prevCoursesRef.current !== coursesKey) {
      prevCoursesRef.current = coursesKey;
      console.log("[TrainerDashboardClient] Updating courses list:", allCourses?.length || 0);
      if (Array.isArray(allCourses)) {
        if (isMountedRef.current) {
          setAllCoursesList(allCourses);
        }
      } else {
        console.error("[TrainerDashboardClient] Invalid allCourses prop:", typeof allCourses);
        if (isMountedRef.current) {
          setError("Invalid courses data received");
        }
      }
    }
  }, [allCourses]);

  // Refresh stats periodically
  useEffect(() => {
    const interval = setInterval(fetchStats, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [fetchStats]);

  // Calculate overview stats - Memoized to prevent unnecessary recalculations
  // CRITICAL: This useMemo MUST be called BEFORE any early returns to maintain consistent hook order
  const { totalTrainings, totalCourses, pendingCompletions } = useMemo(() => {
    // Safety checks to prevent errors if stats structure is invalid
    const trainingStatsLength = Array.isArray(stats?.trainingStats) ? stats.trainingStats.length : 0;
    const courseStatsLength = Array.isArray(stats?.courseStats) ? stats.courseStats.length : 0;
    const totalAssigned = typeof stats?.totalAssigned === 'number' ? stats.totalAssigned : 0;
    const totalCompleted = typeof stats?.totalCompleted === 'number' ? stats.totalCompleted : 0;
    
    return {
      totalTrainings: trainingStatsLength,
      totalCourses: courseStatsLength,
      pendingCompletions: totalAssigned - totalCompleted,
    };
  }, [stats?.trainingStats?.length, stats?.courseStats?.length, stats?.totalAssigned, stats?.totalCompleted]);

  // Show error state if there's an error
  // CRITICAL: Early return MUST be AFTER all hooks (useState, useEffect, useCallback, useMemo)
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
      {/* Overview Stats - Matching Admin Dashboard */}
      <div className={styles.overviewSection}>
        <h2 className={styles.sectionTitle}>Overview</h2>
        <div className={styles.overviewGrid}>
          <StatsCard
            label="Total Trainings"
            value={totalTrainings}
            icon={<BookOpen size={16} />}
          />
          <StatsCard
            label="Total Courses"
            value={totalCourses}
            icon={<BookOpen size={16} />}
          />
          <StatsCard
            label="Total Assigned"
            value={stats.totalAssigned}
            icon={<Users size={16} />}
          />
          <StatsCard
            label="Total Completed"
            value={stats.totalCompleted}
            icon={<CheckCircle size={16} />}
          />
          <StatsCard
            label="Completion Rate"
            value={`${Math.round(stats.overallCompletionRate)}%`}
            icon={<Trophy size={16} />}
          />
          <StatsCard
            label="Pending"
            value={pendingCompletions}
            icon={<CheckCircle size={16} />}
          />
        </div>
      </div>

      {/* Analytics Widgets - Accordion Format (Matching Admin) */}
      <div className={styles.analyticsSection}>
        {/* Training Completion Tracking */}
        <Accordion
          title="Training Completion Tracking"
          icon={<BookOpen size={18} />}
          defaultOpen={false}
        >
          <div className={styles.completionContent}>
            {displayedTrainings.length === 0 ? (
              <Card>
                <CardBody>
                  <p className={styles.emptyMessage}>
                    No trainings added to dashboard. Use "Customize Dashboard" to add trainings.
                  </p>
                </CardBody>
              </Card>
            ) : (
              <div className={styles.grid}>
                {displayedTrainings.map((training) => {
                  const stat = stats.trainingStats.find(
                    (s) => s.trainingId === training.id
                  );
                  return (
                    <TrainingCompletionCard
                      key={training.id}
                      trainingId={training.id}
                      title={training.title}
                      completionRate={stat?.completionRate ?? 0}
                      totalAssigned={stat?.totalAssigned ?? 0}
                      totalCompleted={stat?.totalCompleted ?? 0}
                      courseId={training.course?.id}
                      courseTitle={training.course?.title}
                      onRemove={handleRemoveTraining}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </Accordion>

        {/* Course Completion Tracking */}
        <Accordion
          title="Course Completion Tracking"
          icon={<BookOpen size={18} />}
          defaultOpen={false}
        >
          <div className={styles.completionContent}>
            {displayedCourses.length === 0 ? (
              <Card>
                <CardBody>
                  <p className={styles.emptyMessage}>
                    No courses added to dashboard. Use "Customize Dashboard" to add courses.
                  </p>
                </CardBody>
              </Card>
            ) : (
              <div className={styles.grid}>
                {displayedCourses.map((course) => {
                  const stat = stats.courseStats?.find(
                    (s) => s.courseId === course.id
                  );
                  return (
                    <CourseCompletionCard
                      key={course.id}
                      courseId={course.id}
                      title={course.title}
                      completionRate={stat?.completionRate ?? 0}
                      totalAssigned={stat?.totalAssigned ?? 0}
                      totalCompleted={stat?.totalCompleted ?? 0}
                      trainingCount={course._count.trainings}
                      onRemove={handleRemoveCourse}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </Accordion>

        {/* Customize Dashboard */}
        <Accordion
          title="Customize Dashboard"
          icon={<Settings size={18} />}
          defaultOpen={false}
        >
          <div className={styles.customizeContent}>
            <div className={styles.customizeSection}>
              <h3 className={styles.customizeTitle}>Manage Trainings</h3>
              <p className={styles.customizeDescription}>
                Add, remove, or reorder trainings on your dashboard.
              </p>
              <div className={styles.customizeActions}>
                <Button
                  variant="primary"
                  onClick={() => {
                    setModalType("training");
                    setIsAddModalOpen(true);
                  }}
                >
                  Add Training
                </Button>
              </div>
              {displayedTrainings.length > 0 && (
                <div className={styles.reorderList}>
                  {displayedTrainings.map((training, index) => (
                    <div key={training.id} className={styles.reorderItem}>
                      <span className={styles.reorderItemText}>{training.title}</span>
                      <div className={styles.reorderButtons}>
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveTraining(training.id)}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={styles.customizeSection}>
              <h3 className={styles.customizeTitle}>Manage Courses</h3>
              <p className={styles.customizeDescription}>
                Add, remove, or reorder courses on your dashboard.
              </p>
              <div className={styles.customizeActions}>
                <Button
                  variant="primary"
                  onClick={() => {
                    setModalType("course");
                    setIsAddModalOpen(true);
                  }}
                >
                  Add Course
                </Button>
              </div>
              {displayedCourses.length > 0 && (
                <div className={styles.reorderList}>
                  {displayedCourses.map((course, index) => (
                    <div key={course.id} className={styles.reorderItem}>
                      <span className={styles.reorderItemText}>{course.title}</span>
                      <div className={styles.reorderButtons}>
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveCourse(course.id)}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Accordion>

        {/* Analytics Dashboard */}
        <TrainerAnalyticsDashboard />
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

