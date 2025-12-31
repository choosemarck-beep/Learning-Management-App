"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useSession } from "next-auth/react";
import { LayoutDashboard, Video, BookOpen, Users, Mail, LogOut, User } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { UserMenu } from "./UserMenu";
import styles from "./ProfileBottomNav.module.css";

export interface ProfileBottomNavProps {
  userRole: string;
  dashboardRoute: string;
  disabled?: boolean;
}

export const ProfileBottomNav: React.FC<ProfileBottomNavProps> = ({
  userRole,
  dashboardRoute,
  disabled = false,
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [isVisible, setIsVisible] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [inboxUnreadCount, setInboxUnreadCount] = useState(0);
  const lastScrollY = useRef(0);

  // Handle scroll to hide/show navigation
  useEffect(() => {
    let ticking = false;
    let containerArray: Element[] = [];

    const updateScrollableContainers = () => {
      // Find all scrollable containers (tab content, card bodies, etc.)
      const containers = document.querySelectorAll(
        '[class*="tabContent"], [class*="compactBody"], [style*="overflow-y"]'
      );
      containerArray = Array.from(containers);
    };

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          // Check both window scroll and scrollable containers
          const windowScrollY = window.scrollY;
          const documentScrollY = document.documentElement.scrollTop;
          const bodyScrollY = document.body.scrollTop;
          
          // Get the maximum scroll position (handles different scroll containers)
          const currentScrollY = Math.max(windowScrollY, documentScrollY, bodyScrollY);
          
          // Update scrollable containers list periodically
          updateScrollableContainers();
          
          // Also check scrollable containers (for tab content areas)
          let maxContainerScroll = 0;
          containerArray.forEach((container) => {
            const scrollTop = (container as HTMLElement).scrollTop || 0;
            maxContainerScroll = Math.max(maxContainerScroll, scrollTop);
          });
          
          // Use the maximum scroll value from all sources
          const totalScroll = Math.max(currentScrollY, maxContainerScroll);
          
          // Hide nav when scrolling down, show when scrolling up
          if (totalScroll > lastScrollY.current && totalScroll > 50) {
            setIsVisible(false);
          } else if (totalScroll < lastScrollY.current) {
            setIsVisible(true);
          }
          
          lastScrollY.current = totalScroll;
          ticking = false;
        });
        ticking = true;
      }
    };

    // Initial container discovery
    updateScrollableContainers();

    // Listen to window scroll
    window.addEventListener("scroll", handleScroll, { passive: true });
    
    // Also listen to scroll on scrollable containers (for tab content areas)
    containerArray.forEach((container) => {
      container.addEventListener("scroll", handleScroll, { passive: true });
    });

    // Periodically update container list (in case new containers are added)
    const containerUpdateInterval = setInterval(updateScrollableContainers, 1000);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      containerArray.forEach((container) => {
        container.removeEventListener("scroll", handleScroll);
      });
      clearInterval(containerUpdateInterval);
    };
  }, []);

  // Fetch unread inbox count
  useEffect(() => {
    const fetchInboxCount = async () => {
      try {
        const response = await fetch("/api/inbox");
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data?.unreadCounts) {
            setInboxUnreadCount(data.data.unreadCounts.total || 0);
          }
        }
      } catch (error) {
        console.error("[ProfileBottomNav] Error fetching inbox count:", error);
      }
    };

    fetchInboxCount();
    // Poll every 30 seconds for updates
    const interval = setInterval(fetchInboxCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleAvatarClick = () => {
    // Open User Menu
    setShowUserMenu(true);
  };

  const userAvatar = session?.user?.avatar;
  const userName = session?.user?.name || "User";
  
  // Update avatar when session changes (after photo upload)
  useEffect(() => {
    // Session will automatically update when avatar is changed
    // The avatar display will refresh automatically via session.user.avatar
  }, [session?.user?.avatar]);

  // Determine if Management tab should be shown
  const showManagement =
    userRole === "BRANCH_MANAGER" ||
    userRole === "AREA_MANAGER" ||
    userRole === "REGIONAL_MANAGER";

  // Get management route based on role
  const getManagementRoute = () => {
    switch (userRole) {
      case "BRANCH_MANAGER":
        return "/employee/branch-manager/management";
      case "AREA_MANAGER":
        return "/employee/area-manager/management";
      case "REGIONAL_MANAGER":
        return "/employee/regional-manager/management";
      default:
        return dashboardRoute;
    }
  };

  // Get profile route based on role
  const getProfileRoute = () => {
    switch (userRole) {
      case "REGIONAL_MANAGER":
        return "/employee/regional-manager/profile";
      case "AREA_MANAGER":
        return "/employee/area-manager/profile";
      case "TRAINER":
        return "/employee/trainer/profile";
      case "BRANCH_MANAGER":
      case "EMPLOYEE":
      default:
        return "/employee/profile";
    }
  };

  // Navigation links (Profile removed - accessible via avatar)
  const navLinks = [
    {
      href: dashboardRoute,
      label: "Dashboard",
      icon: LayoutDashboard,
      badge: undefined,
    },
    {
      href: "/reels",
      label: "Reels",
      icon: Video,
      badge: undefined,
    },
    {
      href: "/courses",
      label: "Courses",
      icon: BookOpen,
      badge: undefined,
    },
    {
      href: "/inbox",
      label: "Inbox",
      icon: Mail,
      badge: inboxUnreadCount,
    },
    ...(showManagement
      ? [
          {
            href: getManagementRoute(),
            label: "Management",
            icon: Users,
          },
        ]
      : []),
  ];

  // Don't render navigation if disabled (e.g., during quiz)
  if (disabled) {
    return null;
  }

  return (
    <nav
      className={cn(styles.nav, !isVisible && styles.hidden)}
      aria-label="Profile navigation"
    >
      <div className={styles.navContent}>
        {navLinks.map((link) => {
          // Check if current path matches the link href
          let isActive = false;
          if (link.label === "Dashboard") {
            // Dashboard is active when on dashboard pages only
            isActive =
              pathname === link.href ||
              pathname.startsWith(dashboardRoute);
          } else if (link.label === "Management") {
            // Management is active when on management pages
            isActive =
              pathname === link.href ||
              pathname.startsWith(link.href);
          } else {
            // Other links (Reels, Courses) are active only on exact match
            isActive = pathname === link.href || pathname.startsWith(link.href + "/");
          }
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(styles.navLink, isActive && styles.active)}
              aria-label={link.label}
              onClick={(e) => {
                if (disabled) {
                  e.preventDefault();
                }
              }}
            >
              <div className={styles.iconWrapper}>
                <Icon size={20} className={styles.icon} />
                {link.badge !== undefined && link.badge > 0 && (
                  <span className={styles.badge}>{link.badge > 99 ? '99+' : link.badge}</span>
                )}
              </div>
              <span className={styles.label}>{link.label}</span>
            </Link>
          );
        })}

        {/* Avatar with Menu Button */}
        <div className={styles.avatarContainer}>
          <button
            className={cn(styles.navLink, styles.avatarNavLink)}
            onClick={handleAvatarClick}
            aria-label="Open menu"
          >
            {userAvatar ? (
              <img
                key={`avatar-${session?.user?.avatar || userAvatar}`}
                src={userAvatar}
                alt={userName}
                className={styles.avatarImage}
              />
            ) : (
              <div className={styles.avatarPlaceholder}>
                <User size={20} />
              </div>
            )}
            <span className={styles.label}>Menu</span>
          </button>
        </div>
      </div>

      {/* User Menu */}
      <UserMenu
        isOpen={showUserMenu}
        onClose={() => setShowUserMenu(false)}
        userRole={userRole}
        dashboardRoute={dashboardRoute}
      />
    </nav>
  );
};
