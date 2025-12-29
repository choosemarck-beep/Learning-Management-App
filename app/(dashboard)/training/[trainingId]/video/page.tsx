import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma/client";
import { ProfileBottomNav } from "@/components/layout/ProfileBottomNav";
import { TrainingVideoPageClient } from "@/components/features/courses/TrainingVideoPageClient";
import styles from "./page.module.css";

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ trainingId: string }>;
}

export default async function TrainingVideoPage({ params }: PageProps) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  // Await params in Next.js 14+ App Router
  const { trainingId } = await params;

  // Get dashboard route based on role
  const getDashboardRoute = () => {
    switch (currentUser.role) {
      case "BRANCH_MANAGER":
        return "/employee/branch-manager/dashboard";
      case "AREA_MANAGER":
        return "/employee/area-manager/dashboard";
      case "REGIONAL_MANAGER":
        return "/employee/regional-manager/dashboard";
      case "TRAINER":
        return "/employee/trainer/dashboard";
      case "EMPLOYEE":
      default:
        return "/employee/staff/dashboard";
    }
  };

  const dashboardRoute = getDashboardRoute();

  // Fetch training data with enhanced error handling
  let training;
  let progress;
  let redirectReason: string | null = null;

  try {
    if (process.env.NODE_ENV === 'development') {
      console.log("[TrainingVideoPage] ===== Starting Training Video Page Load =====");
      console.log("[TrainingVideoPage] Training ID:", trainingId);
      console.log("[TrainingVideoPage] User ID:", currentUser.id);
      console.log("[TrainingVideoPage] User Role:", currentUser.role);
    }
    
    // Phase 1: Enhanced Error Logging - Fetch training with detailed logging
    // Phase 3: Fix Data Consistency - Match course detail page query pattern
    try {
      // Validate trainingId format before querying
      if (!trainingId || typeof trainingId !== 'string' || trainingId.trim() === '') {
        redirectReason = "invalid_training_id";
        if (process.env.NODE_ENV === 'development') {
          console.error(`[TrainingVideoPage] ❌ Invalid training ID: ${trainingId}`);
        }
        redirect(`/courses?error=${redirectReason}&trainingId=${trainingId}`);
      }

      training = await (prisma as any).training.findUnique({
        where: { 
          id: trainingId,
          // Phase 3: Add isPublished filter to match course detail page behavior
          // Note: findUnique doesn't support where with multiple conditions, so we check isPublished after
        },
        include: {
          course: {
            select: {
              id: true,
              title: true,
              isPublished: true,
            },
          },
          quiz: {
            select: {
              id: true,
              title: true,
              passingScore: true,
              timeLimit: true,
              allowRetake: true,
              maxAttempts: true,
              questions: true,
              questionsToShow: true,
            },
          },
          miniTrainings: {
            orderBy: {
              order: "asc",
            },
            include: {
              miniQuiz: {
                select: {
                  id: true,
                  title: true,
                },
              },
            },
          },
        },
      });

      if (!training) {
        redirectReason = "training_not_found";
        if (process.env.NODE_ENV === 'development') {
          console.error(`[TrainingVideoPage] ❌ Training not found: ${trainingId}`);
        }
        redirect(`/courses?error=${redirectReason}&trainingId=${trainingId}`);
      }

      if (process.env.NODE_ENV === 'development') {
        console.log(`[TrainingVideoPage] ✅ Training found:`, {
          id: training.id,
          title: training.title,
          isPublished: training.isPublished,
          courseId: training.course.id,
          courseTitle: training.course.title,
          coursePublished: training.course.isPublished,
          hasVideoUrl: !!training.videoUrl,
          videoUrl: training.videoUrl || "N/A",
          hasQuiz: !!training.quiz,
          miniTrainingsCount: training.miniTrainings.length,
        });
      }
    } catch (dbError) {
      redirectReason = "database_error";
      if (process.env.NODE_ENV === 'development') {
        console.error(`[TrainingVideoPage] ❌ Database error fetching training:`, dbError);
        console.error(`[TrainingVideoPage] Error type:`, dbError instanceof Error ? dbError.constructor.name : typeof dbError);
        console.error(`[TrainingVideoPage] Error message:`, dbError instanceof Error ? dbError.message : String(dbError));
      }
      redirect(`/courses?error=${redirectReason}&trainingId=${trainingId}`);
    }

    // Phase 2: Improved Error Handling - Validate training data
    if (!training.course) {
      redirectReason = "course_missing";
      if (process.env.NODE_ENV === 'development') {
        console.error(`[TrainingVideoPage] ❌ Training has no course: ${trainingId}`);
      }
      redirect(`/courses?error=${redirectReason}&trainingId=${trainingId}`);
    }

    // Check if course is published
    if (!training.course.isPublished) {
      redirectReason = "course_not_published";
      if (process.env.NODE_ENV === 'development') {
        console.error(`[TrainingVideoPage] ❌ Course not published:`, {
          courseId: training.course.id,
          courseTitle: training.course.title,
          trainingId: trainingId,
          trainingTitle: training.title,
        });
      }
      redirect(`/courses?error=${redirectReason}&trainingId=${trainingId}&courseId=${training.course.id}`);
    }

    // Check if training is published
    if (!training.isPublished) {
      redirectReason = "training_not_published";
      if (process.env.NODE_ENV === 'development') {
        console.error(`[TrainingVideoPage] ❌ Training not published:`, {
          trainingId: trainingId,
          trainingTitle: training.title,
          isPublished: training.isPublished,
        });
      }
      redirect(`/courses?error=${redirectReason}&trainingId=${trainingId}`);
    }

    // Phase 2: Improved Error Handling - Fetch progress with error handling
    try {
      progress = await (prisma as any).trainingProgressNew.findUnique({
        where: {
          userId_trainingId: {
            userId: currentUser.id,
            trainingId: trainingId,
          },
        },
      });
      if (process.env.NODE_ENV === 'development') {
        console.log(`[TrainingVideoPage] ✅ Progress fetched:`, {
          exists: !!progress,
          videoProgress: progress?.videoProgress || 0,
          videoWatchedSeconds: progress?.videoWatchedSeconds || 0,
          isCompleted: progress?.isCompleted || false,
        });
      }
    } catch (progressError) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[TrainingVideoPage] ⚠️ Error fetching progress (using defaults):`, progressError);
      }
      progress = null; // Will use default values
    }

    // Phase 2: Improved Error Handling - Check if training has video URL
    if (!training.videoUrl || training.videoUrl.trim() === "") {
      redirectReason = "no_video_url";
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[TrainingVideoPage] ⚠️ Training has no videoUrl, redirecting to preview:`, {
          trainingId: trainingId,
          trainingTitle: training.title,
          videoUrl: training.videoUrl || "empty/null",
        });
      }
      // Redirect to preview page if no video available (not courses page)
      redirect(`/training/${trainingId}/preview?reason=no_video`);
    }

    // Phase 3: Fix Data Consistency - Validate and transform data with defensive checks
    const trainingData = {
      training: {
        id: training.id,
        title: training.title || "Untitled Training",
        shortDescription: training.shortDescription || null,
        videoUrl: training.videoUrl || null, // Already validated above
        videoDuration: training.videoDuration || null,
        videoThumbnail: training.videoThumbnail || null,
        minimumWatchTime: training.minimumWatchTime || null,
        totalXP: training.totalXP || 0,
        order: training.order || 0,
      },
      course: {
        id: training.course.id,
        title: training.course.title || "Untitled Course",
      },
      quiz: training.quiz
        ? {
            id: training.quiz.id,
            title: training.quiz.title || "Untitled Quiz",
            passingScore: training.quiz.passingScore || 70,
            timeLimit: training.quiz.timeLimit || null,
            allowRetake: training.quiz.allowRetake ?? true,
            maxAttempts: training.quiz.maxAttempts || null,
            questions: (() => {
              try {
                const parsed = JSON.parse(training.quiz.questions || "[]");
                return Array.isArray(parsed) ? parsed : [];
              } catch (parseError) {
                console.warn(`[TrainingVideoPage] ⚠️ Error parsing quiz questions:`, parseError);
                return [];
              }
            })(),
          }
        : null,
      miniTrainings: (training.miniTrainings || []).map((mt: {
        id: string;
        title: string;
        description: string | null;
        videoUrl: string | null;
        videoDuration: number | null;
        order: number;
        isRequired: boolean;
        miniQuiz: { id: string; title: string } | null;
      }) => ({
        id: mt.id,
        title: mt.title || "Untitled Mini-Training",
        description: mt.description || null,
        videoUrl: mt.videoUrl || null,
        videoDuration: mt.videoDuration || null,
        order: mt.order || 0,
        isRequired: mt.isRequired ?? false,
        miniQuiz: mt.miniQuiz
          ? {
              id: mt.miniQuiz.id,
              title: mt.miniQuiz.title || "Untitled Mini-Quiz",
            }
          : null,
      })),
      progress: progress
        ? {
            videoProgress: progress.videoProgress || 0,
            videoWatchedSeconds: progress.videoWatchedSeconds || 0,
            quizCompleted: progress.quizCompleted || false,
            quizScore: progress.quizScore || null,
            quizPostponed: progress.quizPostponed || false,
            miniTrainingsCompleted: progress.miniTrainingsCompleted || 0,
            totalMiniTrainings: progress.totalMiniTrainings || training.miniTrainings.length,
            progress: progress.progress || 0,
            isCompleted: progress.isCompleted || false,
          }
        : {
            videoProgress: 0,
            videoWatchedSeconds: 0,
            quizCompleted: false,
            quizScore: null,
            quizPostponed: false,
            miniTrainingsCompleted: 0,
            totalMiniTrainings: training.miniTrainings.length,
            progress: 0,
            isCompleted: false,
          },
    };

    if (process.env.NODE_ENV === 'development') {
      console.log(`[TrainingVideoPage] ✅ Training data prepared successfully:`, {
        hasVideo: !!trainingData.training.videoUrl,
        hasQuiz: !!trainingData.quiz,
        miniTrainingsCount: trainingData.miniTrainings.length,
        progressExists: !!progress,
      });
    }

    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <TrainingVideoPageClient
            trainingId={trainingId}
            initialData={trainingData}
          />
        </div>
        <ProfileBottomNav
          userRole={currentUser.role}
          dashboardRoute={dashboardRoute}
        />
      </div>
    );
  } catch (error) {
    // Phase 1: Enhanced Error Logging - Comprehensive error logging
    redirectReason = "unexpected_error";
    
    // Only log to console in development to reduce noise
    if (process.env.NODE_ENV === 'development') {
      console.error(`[TrainingVideoPage] ❌❌❌ UNEXPECTED ERROR ❌❌❌`);
      console.error(`[TrainingVideoPage] Training ID:`, trainingId);
      console.error(`[TrainingVideoPage] User ID:`, currentUser?.id || "unknown");
      console.error(`[TrainingVideoPage] Error type:`, error instanceof Error ? error.constructor.name : typeof error);
      console.error(`[TrainingVideoPage] Error message:`, error instanceof Error ? error.message : String(error));
      
      // Check for common error patterns
      if (error instanceof Error) {
        if (error.message.includes('prisma') || error.message.includes('database')) {
          console.error(`[TrainingVideoPage] 🔍 Database-related error detected`);
        }
        if (error.message.includes('JSON') || error.message.includes('parse')) {
          console.error(`[TrainingVideoPage] 🔍 JSON parsing error detected`);
        }
        if (error.message.includes('null') || error.message.includes('undefined')) {
          console.error(`[TrainingVideoPage] 🔍 Null/undefined reference error detected`);
        }
      }
    }
    
    // Phase 4: User-Friendly Error Messages - Redirect with error details
    // Don't expose internal error details to users
    redirect(`/courses?error=${redirectReason}&trainingId=${trainingId}&message=${encodeURIComponent("An unexpected error occurred. Please try again.")}`);
  }
}

