"use client";

import React, { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { NetflixCoursesView } from "./NetflixCoursesView";
import styles from "./NetflixCoursesPageClient.module.css";

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail?: string | null;
  totalXP: number;
  progress: number;
  isCompleted: boolean;
  isEnrolled: boolean;
  modules: {
    id: string;
    title: string;
    description: string;
    thumbnail?: string | null;
    order: number;
    totalXP: number;
  }[];
}

interface NetflixCoursesPageClientProps {
  courses: Course[];
}

// Placeholder data for preview/demo purposes
const PLACEHOLDER_COURSES: Course[] = [
  {
    id: "placeholder-1",
    title: "Customer Service Excellence",
    description: "Master the art of exceptional customer service",
    thumbnail: null,
    totalXP: 5000,
    progress: 0,
    isCompleted: false,
    isEnrolled: false,
    modules: [
      {
        id: "module-1-1",
        title: "Introduction to Customer Service",
        description: "Learn the fundamentals of providing excellent customer service and building strong relationships with clients.",
        thumbnail: null,
        order: 1,
        totalXP: 1000,
      },
      {
        id: "module-1-2",
        title: "Communication Skills",
        description: "Develop effective communication techniques for handling customer inquiries and resolving issues professionally.",
        thumbnail: null,
        order: 2,
        totalXP: 1500,
      },
      {
        id: "module-1-3",
        title: "Problem Solving",
        description: "Master problem-solving strategies to address customer concerns quickly and efficiently.",
        thumbnail: null,
        order: 3,
        totalXP: 1500,
      },
      {
        id: "module-1-4",
        title: "Advanced Techniques",
        description: "Explore advanced customer service techniques and best practices for handling complex situations.",
        thumbnail: null,
        order: 4,
        totalXP: 1000,
      },
    ],
  },
  {
    id: "placeholder-2",
    title: "Sales Fundamentals",
    description: "Build your sales skills from the ground up",
    thumbnail: null,
    totalXP: 6000,
    progress: 25,
    isCompleted: false,
    isEnrolled: true,
    modules: [
      {
        id: "module-2-1",
        title: "Sales Basics",
        description: "Understand the core principles of sales and learn how to identify customer needs effectively.",
        thumbnail: null,
        order: 1,
        totalXP: 1200,
      },
      {
        id: "module-2-2",
        title: "Prospecting & Lead Generation",
        description: "Learn how to find and qualify potential customers to build a strong sales pipeline.",
        thumbnail: null,
        order: 2,
        totalXP: 1500,
      },
      {
        id: "module-2-3",
        title: "Closing Techniques",
        description: "Master proven closing techniques to convert prospects into satisfied customers.",
        thumbnail: null,
        order: 3,
        totalXP: 1800,
      },
      {
        id: "module-2-4",
        title: "Relationship Building",
        description: "Develop long-term customer relationships that lead to repeat business and referrals.",
        thumbnail: null,
        order: 4,
        totalXP: 1500,
      },
    ],
  },
  {
    id: "placeholder-3",
    title: "Product Knowledge Mastery",
    description: "Become an expert on our products and services",
    thumbnail: null,
    totalXP: 4000,
    progress: 0,
    isCompleted: false,
    isEnrolled: false,
    modules: [
      {
        id: "module-3-1",
        title: "Product Overview",
        description: "Get a comprehensive overview of all our products and their key features and benefits.",
        thumbnail: null,
        order: 1,
        totalXP: 1000,
      },
      {
        id: "module-3-2",
        title: "Feature Deep Dive",
        description: "Explore each product feature in detail and learn how to explain them to customers.",
        thumbnail: null,
        order: 2,
        totalXP: 1500,
      },
      {
        id: "module-3-3",
        title: "Use Cases & Applications",
        description: "Understand real-world use cases and how customers can benefit from our products.",
        thumbnail: null,
        order: 3,
        totalXP: 1500,
      },
    ],
  },
  {
    id: "placeholder-4",
    title: "Team Leadership",
    description: "Develop your leadership skills and inspire your team",
    thumbnail: null,
    totalXP: 7000,
    progress: 60,
    isCompleted: false,
    isEnrolled: true,
    modules: [
      {
        id: "module-4-1",
        title: "Leadership Foundations",
        description: "Learn the fundamental principles of effective leadership and team management.",
        thumbnail: null,
        order: 1,
        totalXP: 1500,
      },
      {
        id: "module-4-2",
        title: "Motivation & Engagement",
        description: "Discover strategies to motivate your team and keep them engaged and productive.",
        thumbnail: null,
        order: 2,
        totalXP: 2000,
      },
      {
        id: "module-4-3",
        title: "Conflict Resolution",
        description: "Learn how to handle conflicts professionally and maintain a positive team environment.",
        thumbnail: null,
        order: 3,
        totalXP: 2000,
      },
      {
        id: "module-4-4",
        title: "Performance Management",
        description: "Master techniques for managing team performance and providing constructive feedback.",
        thumbnail: null,
        order: 4,
        totalXP: 1500,
      },
    ],
  },
];

export const NetflixCoursesPageClient: React.FC<NetflixCoursesPageClientProps> = ({
  courses,
}) => {
  const searchParams = useSearchParams();
  
  // Use placeholder data if no real courses exist
  const displayCourses = courses.length > 0 ? courses : PLACEHOLDER_COURSES;
  const isPlaceholder = courses.length === 0;

  // Phase 4: User-Friendly Error Messages - Check for error parameters and show toast notifications
  useEffect(() => {
    const error = searchParams.get("error");
    const message = searchParams.get("message");
    const trainingId = searchParams.get("trainingId");
    
    if (error) {
      let errorMessage = "Unable to access training. Please try again.";
      
      switch (error) {
        case "training_not_found":
          errorMessage = "Training not found. It may have been removed or is no longer available.";
          break;
        case "training_not_published":
          errorMessage = "This training is not yet available. Please check back later or contact your administrator.";
          break;
        case "course_not_published":
          errorMessage = "This course is not yet available. Please check back later or contact your administrator.";
          break;
        case "course_missing":
          errorMessage = "This training is not associated with a valid course. Please contact support.";
          break;
        case "no_video_url":
          errorMessage = "This training doesn't have a video available yet. Please check back later.";
          break;
        case "database_error":
          errorMessage = "Unable to load training data. Please try again in a moment.";
          break;
        case "unexpected_error":
          errorMessage = message 
            ? decodeURIComponent(message)
            : "An unexpected error occurred. Please try again or contact support if the problem persists.";
          break;
        default:
          errorMessage = message 
            ? decodeURIComponent(message)
            : "Unable to access training. Please try again.";
      }
      
      // Only log errors in development to reduce console noise
      if (process.env.NODE_ENV === 'development') {
        console.error("[NetflixCoursesPageClient] Error from training page:", {
          error,
          message,
          trainingId,
        });
      }
      
      toast.error(errorMessage, {
        duration: 5000,
      });
      
      // Clean up URL by removing error parameters
      const url = new URL(window.location.href);
      url.searchParams.delete("error");
      url.searchParams.delete("message");
      url.searchParams.delete("trainingId");
      url.searchParams.delete("courseId");
      window.history.replaceState({}, "", url.toString());
    }
  }, [searchParams]);

  // Debug: Log courses count
  useEffect(() => {
    console.log("Courses loaded:", courses.length);
    if (isPlaceholder) {
      console.log("📝 Showing placeholder data for preview");
    }
  }, [courses, isPlaceholder]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Courses</h1>
        <p className={styles.subtitle}>Explore available trainings</p>
        {isPlaceholder && (
          <p className={styles.placeholderNotice}>
            📝 Preview Mode: Showing placeholder courses
          </p>
        )}
      </div>
      <NetflixCoursesView courses={displayCourses} />
    </div>
  );
};

