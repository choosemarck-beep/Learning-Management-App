"use client";

import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Loader2, BookOpen, Users, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import styles from "./CourseAssignmentTab.module.css";

export interface Course {
  id: string;
  title: string;
  description: string;
  totalXP: number;
  isPublished: boolean;
}

export interface CourseAssignmentTabProps {
  managerRole: "BRANCH_MANAGER" | "AREA_MANAGER" | "REGIONAL_MANAGER";
}

export const CourseAssignmentTab: React.FC<CourseAssignmentTabProps> = ({
  managerRole,
}) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAssigning, setIsAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [coursesRes, teamRes] = await Promise.all([
          fetch("/api/courses?published=true"),
          fetch(`/api/employee/team?role=${managerRole}`),
        ]);

        const coursesData = await coursesRes.json();
        const teamData = await teamRes.json();

        if (coursesData.success) {
          setCourses(coursesData.data.courses || []);
        }
        if (teamData.success) {
          setTeamMembers(teamData.data.members || []);
        }
      } catch (err) {
        setError("Failed to load data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [managerRole]);

  const handleAssignCourse = async () => {
    if (!selectedCourse || selectedMembers.length === 0) {
      toast.error("Please select a course and at least one team member");
      return;
    }

    try {
      setIsAssigning(true);
      const response = await fetch("/api/management/assign-course", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          courseId: selectedCourse,
          employeeIds: selectedMembers,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(
          `Course assigned to ${selectedMembers.length} team member(s) successfully!`
        );
        setSelectedCourse(null);
        setSelectedMembers([]);
      } else {
        toast.error(data.error || "Failed to assign course");
      }
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsAssigning(false);
    }
  };

  const toggleMemberSelection = (memberId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 size={24} className={styles.loader} />
        <p className={styles.loadingText}>Loading courses and team...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className={styles.errorCard}>
        <CardBody>
          <p className={styles.errorText}>{error}</p>
        </CardBody>
      </Card>
    );
  }

  const publishedCourses = courses.filter((course) => course.isPublished);

  return (
    <div className={styles.container}>
      {/* Course Selection */}
      <Card className={styles.card}>
        <CardHeader>
          <h2 className={styles.cardTitle}>Select Course</h2>
        </CardHeader>
        <CardBody className={styles.compactBody}>
          {publishedCourses.length === 0 ? (
            <p className={styles.emptyText}>No published courses available.</p>
          ) : (
            <div className={styles.coursesList}>
              {publishedCourses.map((course) => (
                <button
                  key={course.id}
                  className={`${styles.courseCard} ${
                    selectedCourse === course.id ? styles.selected : ""
                  }`}
                  onClick={() => setSelectedCourse(course.id)}
                >
                  <div className={styles.courseInfo}>
                    <BookOpen size={16} className={styles.courseIcon} />
                    <div>
                      <h3 className={styles.courseTitle}>{course.title}</h3>
                      <p className={styles.courseDescription}>
                        {course.description}
                      </p>
                      <Badge variant="default" className={styles.xpBadge}>
                        {course.totalXP} XP
                      </Badge>
                    </div>
                  </div>
                  {selectedCourse === course.id && (
                    <CheckCircle2 size={20} className={styles.checkIcon} />
                  )}
                </button>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Team Member Selection */}
      {selectedCourse && (
        <Card className={styles.card}>
          <CardHeader>
            <h2 className={styles.cardTitle}>Select Team Members</h2>
            <p className={styles.cardSubtitle}>
              {selectedMembers.length} of {teamMembers.length} selected
            </p>
          </CardHeader>
          <CardBody className={styles.compactBody}>
            {teamMembers.length === 0 ? (
              <p className={styles.emptyText}>No team members available.</p>
            ) : (
              <>
                <div className={styles.membersList}>
                  {teamMembers.map((member) => (
                    <button
                      key={member.id}
                      className={`${styles.memberCard} ${
                        selectedMembers.includes(member.id) ? styles.selected : ""
                      }`}
                      onClick={() => toggleMemberSelection(member.id)}
                    >
                      <div className={styles.memberInfo}>
                        <Users size={16} className={styles.memberIcon} />
                        <div>
                          <h3 className={styles.memberName}>{member.name}</h3>
                          <p className={styles.memberEmail}>{member.email}</p>
                        </div>
                      </div>
                      {selectedMembers.includes(member.id) && (
                        <CheckCircle2 size={20} className={styles.checkIcon} />
                      )}
                    </button>
                  ))}
                </div>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleAssignCourse}
                  disabled={isAssigning || selectedMembers.length === 0}
                  className={styles.assignButton}
                >
                  {isAssigning ? (
                    <>
                      <Loader2 size={16} className={styles.buttonLoader} />
                      Assigning...
                    </>
                  ) : (
                    <>
                      <BookOpen size={16} />
                      Assign Course
                    </>
                  )}
                </Button>
              </>
            )}
          </CardBody>
        </Card>
      )}
    </div>
  );
};

