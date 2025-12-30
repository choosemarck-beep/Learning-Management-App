"use client";

import React from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import styles from "./AnalyticsChart.module.css";

interface ChartData {
  [key: string]: string | number;
}

interface AnalyticsChartProps {
  type: "line" | "bar" | "pie";
  data: ChartData[];
  dataKey: string;
  xKey?: string;
  yKey?: string;
  name?: string;
  colors?: string[];
  height?: number;
  showLegend?: boolean;
  showGrid?: boolean;
}

const DEFAULT_COLORS = [
  "var(--color-primary-purple)",
  "var(--color-accent-cyan)",
  "var(--color-star-gold)",
  "var(--color-status-success)",
  "var(--color-status-warning)",
  "var(--color-status-error)",
];

export const AnalyticsChart: React.FC<AnalyticsChartProps> = ({
  type,
  data,
  dataKey,
  xKey = "name",
  yKey = "value",
  name,
  colors = DEFAULT_COLORS,
  height = 300,
  showLegend = true,
  showGrid = true,
}) => {
  const chartProps = {
    data,
    height,
    margin: {
      top: 5,
      right: 30,
      left: 20,
      bottom: 5,
    },
  };

  if (type === "pie") {
    return (
      <div className={styles.chartContainer}>
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey={dataKey}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip />
            {showLegend && <Legend />}
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (type === "bar") {
    return (
      <div className={styles.chartContainer}>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart {...chartProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 92, 246, 0.2)" />}
            <XAxis
              dataKey={xKey}
              stroke="var(--color-text-secondary)"
              style={{ fontSize: "var(--font-size-xs)" }}
            />
            <YAxis
              stroke="var(--color-text-secondary)"
              style={{ fontSize: "var(--font-size-xs)" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(15, 23, 42, 0.95)",
                border: "1px solid rgba(139, 92, 246, 0.3)",
                borderRadius: "var(--radius-md)",
                color: "var(--color-text-primary)",
              }}
            />
            {showLegend && <Legend />}
            <Bar dataKey={yKey} fill={colors[0]} name={name || dataKey} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // Line chart (default)
  return (
    <div className={styles.chartContainer}>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart {...chartProps}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 92, 246, 0.2)" />}
          <XAxis
            dataKey={xKey}
            stroke="var(--color-text-secondary)"
            style={{ fontSize: "var(--font-size-xs)" }}
          />
          <YAxis
            stroke="var(--color-text-secondary)"
            style={{ fontSize: "var(--font-size-xs)" }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(15, 23, 42, 0.95)",
              border: "1px solid rgba(139, 92, 246, 0.3)",
              borderRadius: "var(--radius-md)",
              color: "var(--color-text-primary)",
            }}
          />
          {showLegend && <Legend />}
          <Line
            type="monotone"
            dataKey={yKey}
            stroke={colors[0]}
            strokeWidth={2}
            dot={{ fill: colors[0], r: 4 }}
            name={name || dataKey}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

