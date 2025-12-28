"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, GraduationCap, FileQuestion, ClipboardCheck, Edit2, Trash2, Eye, EyeOff } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import toast from "react-hot-toast";
import { CourseCreationModal } from "./CourseCreationModal";
import styles from "./WorkshopClient.module.css";

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string | null;
  totalXP: number;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
  trainings?: Array<{
    id: string;
    title: string;
    order: number;
    isPublished: boolean;
  }>;
  _count?: {
    trainings: number;
    courseProgresses: number;
  };
}

interface Training {
  id: string;
  title: string;
  description: string | null;
  badgeIcon: string | null;
  badgeColor: string | null;
  createdAt: Date;
}

interface Quiz {
  id: string;
  title: string;
  type: string;
  lessonId: string;
  createdAt: Date;
}

interface Exam {
  id: string;
  title: string;
  type: string;
  lessonId: string;
  createdAt: Date;
}

interface WorkshopClientProps {
  initialCourses: Course[];
  initialTrainings: Training[];
  initialQuizzes: Quiz[];
  initialExams: Exam[];
}

type TabType = "courses" | "trainings" | "quizzes" | "exams";

export const WorkshopClient: React.FC<WorkshopClientProps> = ({
  initialCourses,
  initialTrainings,
  initialQuizzes,
  initialExams,
}) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("courses");
  const [courses, setCourses] = useState<Course[]>(initialCourses);
  const [trainings, setTrainings] = useState<Training[]>(initialTrainings);
  const [quizzes, setQuizzes] = useState<Quiz[]>(initialQuizzes);
  const [exams, setExams] = useState<Exam[]>(initialExams);
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);

  const tabs = [
    { id: "courses" as TabType, label: "Courses", icon: BookOpen },
    { id: "trainings" as TabType, label: "Trainings", icon: GraduationCap },
    { id: "quizzes" as TabType, label: "Quizzes", icon: FileQuestion },
    { id: "exams" as TabType, label: "Exams", icon: ClipboardCheck },
  ];

  const handleCreateCourse = () => {
    setIsCourseModalOpen(true);
  };

  const handleCourseSuccess = async () => {
    // Refresh courses list
    try {
      const response = await fetch("/api/trainer/courses");
      const result = await response.json();
      if (result.success) {
        setCourses(result.data.courses);
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
    }
    router.refresh();
  };

  const handleEditCourse = (courseId: string) => {
    router.push(`/employee/trainer/workshop/courses/${courseId}`);
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm("Are you sure you want to delete this course? This will also delete all trainings, quizzes, and mini trainings in this course.")) {
      return;
    }

    try {
      const response = await fetch(`/api/trainer/courses/${courseId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || "Failed to delete course");
        return;
      }

      toast.success("Course deleted successfully");
      setCourses(courses.filter((c) => c.id !== courseId));
      router.refresh();
    } catch (error) {
      console.error("Error deleting course:", error);
      toast.error("Failed to delete course");
    }
  };

  const handleTogglePublish = async (course: Course) => {
    try {
      const response = await fetch(`/api/trainer/courses/${course.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isPublished: !course.isPublished,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || "Failed to update course");
        return;
      }

      toast.success(course.isPublished ? "Course unpublished" : "Course published");
      setCourses(
        courses.map((c) =>
          c.id === course.id ? { ...c, isPublished: !c.isPublished } : c
        )
      );
      router.refresh();
    } catch (error) {
      console.error("Error updating course:", error);
      toast.error("Failed to update course");
    }
  };

  const handleCreateTraining = async () => {
    try {
      const response = await fetch("/api/trainer/mandatory-trainings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: "New Training",
          description: "",
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success("Training created successfully!");
        setTrainings([data.data.training, ...trainings]);
      } else {
        toast.error(data.error || "Failed to create training");
      }
    } catch (error) {
      console.error("Error creating training:", error);
      toast.error("Failed to create training");
    }
  };

  const handleCreateQuiz = () => {
    toast.success("Quiz creation coming soon!");
    // TODO: Open quiz creation modal
  };

  const handleCreateExam = () => {
    toast.success("Exam creation coming soon!");
    // TODO: Open exam creation modal
  };

  return (
    <div className={styles.container}>
      {/* Tabs */}
      <div className={styles.tabs}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              className={`${styles.tab} ${activeTab === tab.id ? styles.active : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={18} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className={styles.content}>
        {activeTab === "courses" && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Courses</h2>
              <Button
                variant="primary"
                size="md"
                onClick={handleCreateCourse}
                className={styles.createButton}
              >
                <span>Create Course</span>
              </Button>
            </div>
            <div className={styles.grid}>
              {courses.length === 0 ? (
                <Card>
                  <CardBody>
                    <p className={styles.emptyMessage}>
                      No courses yet. Create your first course to get started!
                    </p>
                  </CardBody>
                </Card>
              ) : (
                courses.map((course) => (
                  <Card key={course.id}>
                    <CardBody>
                      <div className={styles.cardHeader}>
                        <h3 className={styles.itemTitle}>{course.title}</h3>
                        <div className={styles.cardActions}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleTogglePublish(course)}
                            title={course.isPublished ? "Unpublish" : "Publish"}
                          >
                            {course.isPublished ? <EyeOff size={16} /> : <Eye size={16} />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditCourse(course.id)}
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCourse(course.id)}
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </div>
                      <p className={styles.itemDescription}>{course.description}</p>
                      <div className={styles.itemMeta}>
                        <span className={`${styles.metaItem} ${course.isPublished ? styles.published : styles.draft}`}>
                          {course.isPublished ? "Published" : "Draft"}
                        </span>
                        <span className={styles.metaItem}>{course.totalXP} XP</span>
                        {course._count && (
                          <>
                            <span className={styles.metaItem}>{course._count.trainings} Trainings</span>
                            <span className={styles.metaItem}>{course._count.courseProgresses} Enrollments</span>
                          </>
                        )}
                      </div>
                    </CardBody>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === "trainings" && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Trainings</h2>
              <Button
                variant="primary"
                size="md"
                onClick={handleCreateTraining}
                className={styles.createButton}
              >
                <span>Create Training</span>
              </Button>
            </div>
            <div className={styles.grid}>
              {trainings.length === 0 ? (
                <Card>
                  <CardBody>
                    <p className={styles.emptyMessage}>
                      No trainings yet. Create your first training to get started!
                    </p>
                  </CardBody>
                </Card>
              ) : (
                trainings.map((training) => (
                  <Card key={training.id}>
                    <CardBody>
                      <h3 className={styles.itemTitle}>{training.title}</h3>
                      {training.description && (
                        <p className={styles.itemDescription}>{training.description}</p>
                      )}
                      <div className={styles.itemMeta}>
                        <span className={styles.metaItem}>
                          Created {new Date(training.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </CardBody>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === "quizzes" && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Quizzes</h2>
              <Button
                variant="primary"
                size="md"
                onClick={handleCreateQuiz}
                className={styles.createButton}
              >
                <span>Create Quiz</span>
              </Button>
            </div>
            <div className={styles.grid}>
              {quizzes.length === 0 ? (
                <Card>
                  <CardBody>
                    <p className={styles.emptyMessage}>
                      No quizzes yet. Create your first quiz to get started!
                    </p>
                  </CardBody>
                </Card>
              ) : (
                quizzes.map((quiz) => (
                  <Card key={quiz.id}>
                    <CardBody>
                      <h3 className={styles.itemTitle}>{quiz.title}</h3>
                      <div className={styles.itemMeta}>
                        <span className={styles.metaItem}>
                          Created {new Date(quiz.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </CardBody>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === "exams" && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Exams</h2>
              <Button
                variant="primary"
                size="md"
                onClick={handleCreateExam}
                className={styles.createButton}
              >
                <span>Create Exam</span>
              </Button>
            </div>
            <div className={styles.grid}>
              {exams.length === 0 ? (
                <Card>
                  <CardBody>
                    <p className={styles.emptyMessage}>
                      No exams yet. Create your first exam to get started!
                    </p>
                  </CardBody>
                </Card>
              ) : (
                exams.map((exam) => (
                  <Card key={exam.id}>
                    <CardBody>
                      <h3 className={styles.itemTitle}>{exam.title}</h3>
                      <div className={styles.itemMeta}>
                        <span className={styles.metaItem}>
                          Created {new Date(exam.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </CardBody>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <CourseCreationModal
        isOpen={isCourseModalOpen}
        onClose={() => setIsCourseModalOpen(false)}
        onSuccess={handleCourseSuccess}
      />
    </div>
  );
};

