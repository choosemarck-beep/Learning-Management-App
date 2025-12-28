"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RocketIcon } from "@/components/ui/assets/RocketIcon";
import { StarCluster } from "@/components/ui/assets/StarCluster";
import { ProgressChart } from "@/components/ui/assets/ProgressChart";
import { CommunityIcon } from "@/components/ui/assets/CommunityIcon";
import styles from "./IntroCarousel.module.css";

export interface IntroSlide {
  title: string;
  description: string;
  icon?: React.ReactNode;
}

export interface IntroCarouselProps {
  slides?: IntroSlide[];
  autoPlayInterval?: number; // milliseconds
  className?: string;
}

const defaultSlides: IntroSlide[] = [
  {
    title: "Welcome to Your Learning Journey",
    description: "Embark on an adventure where every lesson brings you closer to mastery",
    icon: <RocketIcon size={48} />,
  },
  {
    title: "Gamified Learning Experience",
    description: "Earn energy crystals, level up, and unlock achievements as you progress",
    icon: <StarCluster size={48} />,
  },
  {
    title: "Track Your Progress",
    description: "See your growth with visual progress bars and detailed analytics",
    icon: <ProgressChart size={48} />,
  },
  {
    title: "Join a Community",
    description: "Compete on leaderboards and celebrate wins with your squad",
    icon: <CommunityIcon size={48} />,
  },
];

export const IntroCarousel: React.FC<IntroCarouselProps> = ({
  slides = defaultSlides,
  autoPlayInterval = 4000,
  className,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [slides.length, autoPlayInterval]);

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
    }),
  };

  return (
    <div className={`${styles.carouselContainer} ${className || ""}`}>
      <div className={styles.carouselWrapper}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentIndex}
            custom={1}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
            className={styles.slide}
          >
            {slides[currentIndex].icon && (
              <div className={styles.iconWrapper}>
                {slides[currentIndex].icon}
              </div>
            )}
            <h2 className={styles.title}>{slides[currentIndex].title}</h2>
            <p className={styles.description}>
              {slides[currentIndex].description}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dots indicator */}
      <div className={styles.dotsContainer}>
        {slides.map((_, index) => (
          <button
            key={index}
            className={`${styles.dot} ${
              index === currentIndex ? styles.dotActive : ""
            }`}
            onClick={() => setCurrentIndex(index)}
            aria-label={`Go to slide ${index + 1}`}
            type="button"
          />
        ))}
      </div>
    </div>
  );
};

