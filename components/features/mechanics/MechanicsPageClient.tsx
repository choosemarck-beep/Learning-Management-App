"use client";

import React from "react";
import { 
  Zap, 
  TrendingUp, 
  Trophy, 
  Users, 
  Gem, 
  Flame, 
  Award,
  ArrowRight,
  Star
} from "lucide-react";
import { GAMIFICATION } from "@/lib/constants/gamification";
import { getRankName, getXPForNextLevel, getLevelProgress } from "@/lib/utils/gamification";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import styles from "./MechanicsPageClient.module.css";

interface MechanicsPageClientProps {
  userXP: number;
  userLevel: number;
  userStreak: number;
  userDiamonds: number;
}

export const MechanicsPageClient: React.FC<MechanicsPageClientProps> = ({
  userXP,
  userLevel,
  userStreak,
  userDiamonds,
}) => {
  const router = useRouter();

  const currentRank = getRankName(userLevel, userXP);
  const xpForNextLevel = getXPForNextLevel(userXP);
  const levelProgress = getLevelProgress(userXP);

  const handleStartLearning = () => {
    router.push("/courses");
  };

  return (
    <div className={styles.container}>
      {/* Hero Section */}
      <div className={styles.hero}>
        <div className={styles.heroIcon}>
          <Star className={styles.starIcon} />
        </div>
        <h1 className={styles.heroTitle}>Welcome to Your Learning Galaxy!</h1>
        <p className={styles.heroSubtitle}>
          Discover how to earn rewards, level up, and become a cosmic learning champion!
        </p>
      </div>

      {/* Your Current Progress */}
      <div className={styles.progressCard}>
        <h2 className={styles.progressTitle}>Your Journey So Far</h2>
        <div className={styles.progressStats}>
          <div className={styles.statItem}>
            <Zap className={styles.statIcon} />
            <div className={styles.statContent}>
              <span className={styles.statValue}>{userXP.toLocaleString()}</span>
              <span className={styles.statLabel}>Energy Crystals (XP)</span>
            </div>
          </div>
          <div className={styles.statItem}>
            <TrendingUp className={styles.statIcon} />
            <div className={styles.statContent}>
              <span className={styles.statValue}>Level {userLevel}</span>
              <span className={styles.statLabel}>{currentRank}</span>
            </div>
          </div>
          <div className={styles.statItem}>
            <Flame className={styles.statIcon} />
            <div className={styles.statContent}>
              <span className={styles.statValue}>{userStreak} days</span>
              <span className={styles.statLabel}>Learning Streak</span>
            </div>
          </div>
          <div className={styles.statItem}>
            <Gem className={styles.statIcon} />
            <div className={styles.statContent}>
              <span className={styles.statValue}>{userDiamonds.toLocaleString()}</span>
              <span className={styles.statLabel}>Diamonds</span>
            </div>
          </div>
        </div>
        {xpForNextLevel > 0 && (
          <div className={styles.levelProgress}>
            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill}
                style={{ width: `${levelProgress}%` }}
              />
            </div>
            <p className={styles.progressText}>
              {xpForNextLevel.toLocaleString()} XP until Level {userLevel + 1}
            </p>
          </div>
        )}
      </div>

      {/* XP System */}
      <div className={styles.mechanicCard}>
        <div className={styles.mechanicHeader}>
          <Zap className={styles.mechanicIcon} />
          <h2 className={styles.mechanicTitle}>Energy Crystals (XP)</h2>
        </div>
        <p className={styles.mechanicDescription}>
          Every action you take earns you Energy Crystals! Complete trainings, pass quizzes, and watch videos to accumulate XP and power up your learning journey.
        </p>
        <div className={styles.rewardsList}>
          <div className={styles.rewardItem}>
            <span className={styles.rewardAmount}>+{GAMIFICATION.XP_PER_TASK} XP</span>
            <span className={styles.rewardAction}>Complete a Task</span>
          </div>
          <div className={styles.rewardItem}>
            <span className={styles.rewardAmount}>+{GAMIFICATION.XP_PER_LESSON} XP</span>
            <span className={styles.rewardAction}>Finish a Lesson</span>
          </div>
          <div className={styles.rewardItem}>
            <span className={styles.rewardAmount}>+{GAMIFICATION.XP_PER_MODULE} XP</span>
            <span className={styles.rewardAction}>Complete a Module</span>
          </div>
          <div className={styles.rewardItem}>
            <span className={styles.rewardAmount}>+{GAMIFICATION.XP_PER_COURSE} XP</span>
            <span className={styles.rewardAction}>Finish a Course</span>
          </div>
        </div>
      </div>

      {/* Levels */}
      <div className={styles.mechanicCard}>
        <div className={styles.mechanicHeader}>
          <TrendingUp className={styles.mechanicIcon} />
          <h2 className={styles.mechanicTitle}>Level Up!</h2>
        </div>
        <p className={styles.mechanicDescription}>
          Every {GAMIFICATION.XP_PER_LEVEL.toLocaleString()} Energy Crystals you earn levels you up! Higher levels unlock new ranks and show your dedication to learning.
        </p>
        <div className={styles.highlightBox}>
          <p className={styles.highlightText}>
            <strong>You're currently Level {userLevel}</strong> - Keep learning to reach Level {userLevel + 1}!
          </p>
        </div>
      </div>

      {/* Rankings */}
      <div className={styles.mechanicCard}>
        <div className={styles.mechanicHeader}>
          <Trophy className={styles.mechanicIcon} />
          <h2 className={styles.mechanicTitle}>Cosmic Ranks</h2>
        </div>
        <p className={styles.mechanicDescription}>
          As you level up, you'll unlock prestigious ranks that reflect your learning achievements. Each rank represents a milestone in your cosmic journey!
        </p>
        <div className={styles.ranksList}>
          {GAMIFICATION.RANKS.slice(0, 5).map((rank, index) => (
            <div 
              key={rank.name} 
              className={`${styles.rankItem} ${currentRank === rank.name ? styles.rankItemActive : ''}`}
            >
              <div className={styles.rankLevel}>Level {rank.level}</div>
              <div className={styles.rankName}>{rank.name}</div>
              {currentRank === rank.name && (
                <div className={styles.rankBadge}>Your Rank!</div>
              )}
            </div>
          ))}
        </div>
        {GAMIFICATION.RANKS.length > 5 && (
          <p className={styles.moreRanks}>
            And {GAMIFICATION.RANKS.length - 5} more ranks to unlock! Keep learning to discover them all.
          </p>
        )}
      </div>

      {/* Leaderboard */}
      <div className={styles.mechanicCard}>
        <div className={styles.mechanicHeader}>
          <Users className={styles.mechanicIcon} />
          <h2 className={styles.mechanicTitle}>Leaderboard</h2>
        </div>
        <p className={styles.mechanicDescription}>
          Compete with your squad and see how you rank! The leaderboard shows top performers based on Energy Crystals earned. Climb the ranks and become a learning legend!
        </p>
        <div className={styles.highlightBox}>
          <p className={styles.highlightText}>
            <strong>Pro Tip:</strong> Consistent daily learning helps you climb faster. Every training completed adds to your total!
          </p>
        </div>
      </div>

      {/* Diamonds */}
      <div className={styles.mechanicCard}>
        <div className={styles.mechanicHeader}>
          <Gem className={styles.mechanicIcon} />
          <h2 className={styles.mechanicTitle}>Diamonds</h2>
        </div>
        <p className={styles.mechanicDescription}>
          Diamonds are precious rewards you earn as you learn! For every 10 Energy Crystals you gain, you earn 1 Diamond. Collect them to unlock special rewards and features.
        </p>
        <div className={styles.highlightBox}>
          <p className={styles.highlightText}>
            <strong>You have {userDiamonds.toLocaleString()} Diamonds!</strong> Keep learning to earn more and unlock amazing rewards.
          </p>
        </div>
      </div>

      {/* Streaks */}
      <div className={styles.mechanicCard}>
        <div className={styles.mechanicHeader}>
          <Flame className={styles.mechanicIcon} />
          <h2 className={styles.mechanicTitle}>Learning Streaks</h2>
        </div>
        <p className={styles.mechanicDescription}>
          Build your learning streak by completing trainings every day! The longer your streak, the more motivated you'll be. Don't break the chain - your streak multiplies your XP rewards!
        </p>
        <div className={styles.highlightBox}>
          <p className={styles.highlightText}>
            <strong>Your current streak: {userStreak} days!</strong> {userStreak >= 7 ? "Amazing work! Keep it going!" : "Keep learning daily to build your streak and earn bonus rewards!"}
          </p>
        </div>
      </div>

      {/* Badges */}
      <div className={styles.mechanicCard}>
        <div className={styles.mechanicHeader}>
          <Award className={styles.mechanicIcon} />
          <h2 className={styles.mechanicTitle}>Achievement Badges</h2>
        </div>
        <p className={styles.mechanicDescription}>
          Unlock special badges as you reach milestones! From your first task to reaching the top 10 on the leaderboard, each badge celebrates your learning achievements.
        </p>
        <div className={styles.badgesGrid}>
          {GAMIFICATION.BADGE_TYPES.slice(0, 6).map((badge) => (
            <div key={badge} className={styles.badgeItem}>
              <Award className={styles.badgeIcon} />
              <span className={styles.badgeName}>
                {badge.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </span>
            </div>
          ))}
        </div>
        <p className={styles.moreBadges}>
          Unlock all {GAMIFICATION.BADGE_TYPES.length} badges to become a true learning champion!
        </p>
      </div>

      {/* Call to Action */}
      <div className={styles.ctaCard}>
        <h2 className={styles.ctaTitle}>Ready to Start Learning?</h2>
        <p className={styles.ctaDescription}>
          Every training you complete brings you closer to your next level, rank, and achievement. Your learning journey starts now!
        </p>
        <Button
          variant="primary"
          onClick={handleStartLearning}
          className={styles.ctaButton}
        >
          Explore Courses
          <ArrowRight className={styles.ctaIcon} />
        </Button>
      </div>
    </div>
  );
};

