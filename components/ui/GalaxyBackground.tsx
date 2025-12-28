"use client";

import React, { useEffect, useRef } from "react";
import styles from "./GalaxyBackground.module.css";

export interface GalaxyBackgroundProps {
  className?: string;
  starCount?: number;
  meteorCount?: number;
}

export const GalaxyBackground: React.FC<GalaxyBackgroundProps> = ({
  className,
  starCount = 100,
  meteorCount = 3,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size - ensure we have valid dimensions
    const resizeCanvas = () => {
      const width = window.innerWidth || 1920;
      const height = window.innerHeight || 1080;
      canvas.width = width;
      canvas.height = height;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Ensure canvas is properly sized before initializing stars
    const canvasWidth = canvas.width || window.innerWidth || 1920;
    const canvasHeight = canvas.height || window.innerHeight || 1080;
    
    if (canvas.width === 0 || canvas.height === 0) {
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
    }

    // Stars array
    const stars: Array<{
      x: number;
      y: number;
      radius: number;
      speed: number;
      opacity: number;
      twinkleSpeed: number;
    }> = [];

    // Initialize stars - ensure even distribution across entire canvas
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * canvasWidth,
        y: Math.random() * canvasHeight,
        radius: Math.random() * 1.5 + 0.5,
        speed: Math.random() * 0.2 + 0.05,
        opacity: Math.random() * 0.5 + 0.5,
        twinkleSpeed: Math.random() * 0.01 + 0.005,
      });
    }

    // Initial draw to ensure stars are visible immediately
    ctx.fillStyle = "rgba(15, 23, 42, 1)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    stars.forEach((star) => {
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
      ctx.fill();
    });

    // Meteors array
    const meteors: Array<{
      x: number;
      y: number;
      length: number;
      speed: number;
      angle: number;
      opacity: number;
    }> = [];

    // Initialize meteors
    const createMeteor = () => {
      return {
        x: Math.random() * canvas.width * 0.5 + canvas.width * 0.5,
        y: -50,
        length: Math.random() * 80 + 50,
        speed: Math.random() * 3 + 2,
        angle: Math.random() * 30 + 45, // 45-75 degrees
        opacity: Math.random() * 0.5 + 0.5,
      };
    };

    for (let i = 0; i < meteorCount; i++) {
      meteors.push(createMeteor());
    }

    // Animation loop
    let animationFrameId: number;
    let lastTime = 0;
    const fps = 60;
    const frameInterval = 1000 / fps;

    const animate = (currentTime: number) => {
      if (currentTime - lastTime < frameInterval) {
        animationFrameId = requestAnimationFrame(animate);
        return;
      }
      lastTime = currentTime;

      // Clear canvas with dark background
      ctx.fillStyle = "rgba(15, 23, 42, 1)"; // Solid dark background
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw and update stars
      stars.forEach((star) => {
        // Twinkling effect
        star.opacity += star.twinkleSpeed;
        if (star.opacity > 1 || star.opacity < 0.3) {
          star.twinkleSpeed = -star.twinkleSpeed;
        }

        // Move stars (slow drift) - wrap around and redistribute Y to prevent clustering
        star.x += star.speed * 0.05;
        if (star.x > canvas.width) {
          star.x = 0;
          // Redistribute Y position when wrapping to ensure even distribution
          star.y = Math.random() * canvas.height;
        }
        if (star.x < 0) {
          star.x = canvas.width;
          star.y = Math.random() * canvas.height;
        }

        // Draw star
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
        ctx.fill();

        // Add glow effect for some stars
        if (star.radius > 1) {
          ctx.shadowBlur = 5;
          ctx.shadowColor = "rgba(255, 255, 255, 0.8)";
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });

      // Draw and update meteors
      meteors.forEach((meteor, index) => {
        // Update meteor position
        meteor.x += Math.cos((meteor.angle * Math.PI) / 180) * meteor.speed;
        meteor.y += Math.sin((meteor.angle * Math.PI) / 180) * meteor.speed;

        // Draw meteor with gradient
        const gradient = ctx.createLinearGradient(
          meteor.x,
          meteor.y,
          meteor.x - Math.cos((meteor.angle * Math.PI) / 180) * meteor.length,
          meteor.y - Math.sin((meteor.angle * Math.PI) / 180) * meteor.length
        );

        gradient.addColorStop(0, `rgba(139, 92, 246, ${meteor.opacity})`); // Purple head
        gradient.addColorStop(0.5, `rgba(99, 102, 241, ${meteor.opacity * 0.7})`); // Indigo middle
        gradient.addColorStop(1, `rgba(139, 92, 246, 0)`); // Transparent tail

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(meteor.x, meteor.y);
        ctx.lineTo(
          meteor.x - Math.cos((meteor.angle * Math.PI) / 180) * meteor.length,
          meteor.y - Math.sin((meteor.angle * Math.PI) / 180) * meteor.length
        );
        ctx.stroke();

        // Add glow to meteor head
        ctx.beginPath();
        ctx.arc(meteor.x, meteor.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(139, 92, 246, ${meteor.opacity})`;
        ctx.shadowBlur = 10;
        ctx.shadowColor = "rgba(139, 92, 246, 0.8)";
        ctx.fill();
        ctx.shadowBlur = 0;

        // Reset meteor if it goes off screen
        if (
          meteor.x < -50 ||
          meteor.y > canvas.height + 50 ||
          meteor.x > canvas.width + 50
        ) {
          Object.assign(meteor, createMeteor());
        }
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate(0);

    // Cleanup
    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [starCount, meteorCount]);

  return (
    <canvas
      ref={canvasRef}
      className={`${styles.galaxyBackground} ${className || ""}`}
      aria-hidden="true"
    />
  );
};

