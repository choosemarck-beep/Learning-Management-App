import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma/client";
import { TrainerLayout } from "@/components/layout/trainer/TrainerLayout";
import { CourseEditorClient } from "@/components/features/trainer/CourseEditorClient";
import styles from "./page.module.css";

export default async function CourseEditorPage({
  params,
}: {
  params: { courseId: string };
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "TRAINER") {
    redirect("/employee/trainer/dashboard");
  }

  // Fetch full user data
  const userData = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
    },
  });

  if (!userData) {
    redirect("/login");
  }

  // Fetch course with all related data
  const course = await prisma.course.findFirst({
    where: {
      id: params.courseId,
      createdBy: user.id, // Ensure trainer owns this course
    },
    include: {
      trainings: {
        include: {
          quiz: {
            select: {
              id: true,
              title: true,
              passingScore: true,
              _count: {
                select: {
                  quizAttempts: true,
                },
              },
            },
          },
          miniTrainings: {
            include: {
              miniQuiz: {
                select: {
                  id: true,
                  title: true,
                },
              },
            },
            orderBy: {
              order: "asc",
            },
          },
          _count: {
            select: {
              trainingProgress: true,
            },
          },
        },
        orderBy: {
          order: "asc",
        },
      },
      _count: {
        select: {
          courseProgresses: true,
        },
      },
    },
  });

  if (!course) {
    redirect("/employee/trainer/workshop");
  }

  return (
    <TrainerLayout
      userName={userData.name}
      userEmail={userData.email}
      userAvatar={userData.avatar}
      pageTitle={course.title}
      pageDescription="Edit course and manage trainings"
    >
      <div className={styles.container}>
        <CourseEditorClient course={course} />
      </div>
    </TrainerLayout>
  );
}

