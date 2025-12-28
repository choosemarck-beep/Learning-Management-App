/**
 * Global TypeScript Types
 */

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  xp: number;
  level: number;
  rank: string;
  streak: number;
  diamonds: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail?: string;
  modules: Module[];
  totalXP: number;
  isUnlocked: boolean;
  progress: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Module {
  id: string;
  courseId: string;
  title: string;
  description: string;
  order: number;
  lessons: Lesson[];
  totalXP: number;
  isUnlocked: boolean;
  progress: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  description: string;
  order: number;
  tasks: Task[];
  totalXP: number;
  isUnlocked: boolean;
  progress: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  lessonId: string;
  title: string;
  type: "quiz" | "exercise" | "reading" | "interactive";
  content: string;
  order: number;
  xpReward: number;
  isCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface LeaderboardEntry {
  userId: string;
  userName: string;
  avatar?: string;
  rank: number;
  xp: number;
  level: number;
  crewRank?: number;
}

export interface Badge {
  id: string;
  userId: string;
  type: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: Date;
}

export interface VideoWatchProgress {
  id: string;
  userId: string;
  lessonId: string;
  watchedSeconds: number;
  lastWatchedAt: Date;
  isCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

