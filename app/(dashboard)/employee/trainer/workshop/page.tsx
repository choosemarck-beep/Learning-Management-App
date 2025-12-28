import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma/client";
import { TrainerLayout } from "@/components/layout/trainer/TrainerLayout";
import { WorkshopClient } from "@/components/features/trainer/WorkshopClient";
import styles from "./page.module.css";

export default async function TrainerWorkshopPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Role check - only TRAINER can access
  if (user.role !== "TRAINER") {
    if (user.role === "REGIONAL_MANAGER") {
      redirect("/employee/regional-manager/dashboard");
    } else if (user.role === "AREA_MANAGER") {
      redirect("/employee/area-manager/dashboard");
    } else if (user.role === "BRANCH_MANAGER") {
      redirect("/employee/branch-manager/dashboard");
    } else if (user.role === "EMPLOYEE") {
      redirect("/employee/staff/dashboard");
    } else if (user.role === "SUPER_ADMIN") {
      redirect("/super-admin/dashboard");
    } else if (user.role === "ADMIN") {
      redirect("/admin/dashboard");
    } else {
      redirect("/login");
    }
  }

  // Fetch full user data from database
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

  // Fetch courses created by this trainer
  const courses = await prisma.course.findMany({
    where: {
      createdBy: user.id,
    },
    include: {
      trainings: {
        select: {
          id: true,
          title: true,
          order: true,
          isPublished: true,
        },
        orderBy: {
          order: "asc",
        },
      },
      _count: {
        select: {
          trainings: true,
          courseProgresses: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const trainings = await prisma.mandatoryTraining.findMany({
    where: {
      createdBy: user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Fetch tasks that are quizzes or exams
  const allTasks = await prisma.task.findMany({
    include: {
      lesson: {
        include: {
          module: {
            include: {
              course: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const quizzes = allTasks.filter((task) => task.type === "quiz");
  const exams = allTasks.filter((task) => task.type === "exam");

  return (
    <TrainerLayout
      userName={userData.name}
      userEmail={userData.email}
      userAvatar={userData.avatar}
      pageTitle="Workshop"
      pageDescription="Create and manage courses, trainings, quizzes, and exams."
    >
      <div className={styles.container}>
        <WorkshopClient
          initialCourses={courses}
          initialTrainings={trainings}
          initialQuizzes={quizzes}
          initialExams={exams}
        />
      </div>
    </TrainerLayout>
  );
}

