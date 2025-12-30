"use client";

import React, { useState, useEffect } from "react";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatsCard } from "../StatsCard";
import { AnalyticsChart } from "./AnalyticsChart";
import { DateRangePicker } from "./DateRangePicker";
import { Trophy, Star, Award, Zap, Gem } from "lucide-react";
import styles from "./GamificationAnalytics.module.css";

interface GamificationAnalyticsData {
  totalXP: number;
  averageXP: number;
  usersByLevel: Array<{ level: number; count: number }>;
  topPerformers: Array<{
    id: string;
    name: string;
    email: string;
    xp: number;
    level: number;
    rank: string;
    streak: number;
    diamonds: number;
    branch: string | null;
  }>;
  totalBadges: number;
  badgesByType: Array<{ type: string; count: number }>;
  activeStreaks: number;
  averageStreak: number;
  totalDiamonds: number;
  levelDistribution: Array<{ level: number; count: number }>;
  xpEarnedTrend: Array<{ date: string; xp: number }>;
}

export const GamificationAnalytics: React.FC = () => {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<GamificationAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/admin/analytics/gamification?days=${days}`);
        const result = await response.json();
        if (result.success) {
          setData(result.data);
        }
      } catch (error) {
        console.error("Error fetching gamification analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [days]);

  if (loading || !data) {
    return (
      <Card className={styles.card}>
        <CardBody>
          <div className={styles.loading}>Loading gamification analytics...</div>
        </CardBody>
      </Card>
    );
  }

  const badgesByTypeData = data.badgesByType.map(item => ({
    name: item.type,
    value: item.count,
  }));

  return (
    <Card className={styles.card}>
      <CardHeader>
        <CardTitle className={styles.title}>
          <Trophy size={20} /> Gamification Analytics
        </CardTitle>
        <DateRangePicker days={days} onChange={setDays} />
      </CardHeader>
      <CardBody>
        <div className={styles.statsGrid}>
          <StatsCard
            label="Total XP Earned"
            value={data.totalXP.toLocaleString()}
            icon={<Star size={18} />}
          />
          <StatsCard
            label="Average XP per User"
            value={data.averageXP.toLocaleString()}
            icon={<Trophy size={18} />}
          />
          <StatsCard
            label="Total Badges"
            value={data.totalBadges}
            icon={<Award size={18} />}
          />
          <StatsCard
            label="Active Streaks"
            value={data.activeStreaks}
            icon={<Zap size={18} />}
          />
          <StatsCard
            label="Average Streak"
            value={data.averageStreak}
            icon={<Zap size={18} />}
          />
          <StatsCard
            label="Total Diamonds"
            value={data.totalDiamonds.toLocaleString()}
            icon={<Gem size={18} />}
          />
        </div>

        <div className={styles.chartsGrid}>
          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>XP Earned Trend</h3>
            <AnalyticsChart
              type="line"
              data={data.xpEarnedTrend}
              dataKey="xp"
              xKey="date"
              yKey="xp"
              name="XP"
              height={250}
            />
          </div>

          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>Users by Level</h3>
            <AnalyticsChart
              type="bar"
              data={data.levelDistribution.map(item => ({
                name: `Level ${item.level}`,
                value: item.count,
              }))}
              dataKey="value"
              xKey="name"
              yKey="value"
              name="Users"
              height={250}
            />
          </div>

          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>Badges by Type</h3>
            <AnalyticsChart
              type="pie"
              data={badgesByTypeData}
              dataKey="value"
              height={250}
            />
          </div>
        </div>

        {data.topPerformers.length > 0 && (
          <div className={styles.leaderboardSection}>
            <h3 className={styles.sectionTitle}>Top Performers</h3>
            <div className={styles.leaderboardTable}>
              <table>
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Name</th>
                    <th>XP</th>
                    <th>Level</th>
                    <th>Rank</th>
                    <th>Streak</th>
                    <th>Diamonds</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topPerformers.map((user, index) => (
                    <tr key={user.id}>
                      <td>#{index + 1}</td>
                      <td>{user.name}</td>
                      <td>{user.xp.toLocaleString()}</td>
                      <td>{user.level}</td>
                      <td>{user.rank}</td>
                      <td>{user.streak}</td>
                      <td>{user.diamonds}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
};

