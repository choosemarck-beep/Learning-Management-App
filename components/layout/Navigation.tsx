"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import styles from "./Navigation.module.css";

interface NavLink {
  href: string;
  label: string;
  icon?: React.ReactNode;
}

interface NavigationProps {
  links?: NavLink[];
}

const defaultLinks: NavLink[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/courses", label: "Courses" },
  // TODO: Add leaderboard and achievements routes when implemented
  // { href: "/leaderboard", label: "Leaderboard" },
  // { href: "/achievements", label: "Achievements" },
];

export const Navigation: React.FC<NavigationProps> = ({
  links = defaultLinks,
}) => {
  const pathname = usePathname();

  return (
    <nav
      className={styles.nav}
      aria-label="Main navigation"
    >
      <div className={styles.navContent}>
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(styles.navLink, isActive && styles.active)}
            >
              {link.icon && <span className={styles.icon}>{link.icon}</span>}
              <span>{link.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

