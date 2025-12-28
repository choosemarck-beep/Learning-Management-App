import React from "react";
import { cn } from "@/lib/utils/cn";
import styles from "./Header.module.css";

export interface HeaderProps extends React.HTMLAttributes<HTMLElement> {
  user?: {
    name?: string | null;
    email?: string | null;
    avatar?: string | null;
  } | null;
}

export const Header = React.forwardRef<HTMLElement, HeaderProps>(
  ({ className, user, ...props }, ref) => {
  return (
    <header ref={ref} className={cn(styles.header, className)} {...props}>
      {/* Header content removed - only used for admin pages which have their own header */}
    </header>
  );
  }
);

Header.displayName = "Header";

