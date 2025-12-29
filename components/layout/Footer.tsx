import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import styles from "./Footer.module.css";

export interface FooterProps extends React.HTMLAttributes<HTMLElement> {}

export const Footer = React.forwardRef<HTMLElement, FooterProps>(
  ({ className, ...props }, ref) => {
    const currentYear = new Date().getFullYear();

    return (
      <footer ref={ref} className={cn(styles.footer, className)} {...props}>
        <div className={styles.container}>
          {/* TODO: Add about, privacy, and terms routes when implemented */}
          {/* <div className={styles.links}>
            <Link href="/about" className={styles.link}>
              About
            </Link>
            <span className={styles.separator}>•</span>
            <Link href="/privacy" className={styles.link}>
              Privacy
            </Link>
            <span className={styles.separator}>•</span>
            <Link href="/terms" className={styles.link}>
              Terms
            </Link>
          </div> */}
          <div className={styles.copyright}>
            © {currentYear} Ahoy Learning. All rights reserved.
          </div>
        </div>
      </footer>
    );
  }
);

Footer.displayName = "Footer";

