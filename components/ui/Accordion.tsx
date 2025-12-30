"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import styles from "./Accordion.module.css";

export interface AccordionProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export const Accordion: React.FC<AccordionProps> = ({
  title,
  defaultOpen = false,
  children,
  icon,
  className,
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const toggle = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className={cn(styles.accordion, className)} {...props}>
      <button
        type="button"
        className={styles.trigger}
        onClick={toggle}
        aria-expanded={isOpen}
        aria-controls={`accordion-content-${title.replace(/\s+/g, "-").toLowerCase()}`}
      >
        <div className={styles.triggerContent}>
          {icon && <span className={styles.icon}>{icon}</span>}
          <span className={styles.title}>{title}</span>
        </div>
        <span className={styles.chevron}>
          {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </span>
      </button>
      <div
        id={`accordion-content-${title.replace(/\s+/g, "-").toLowerCase()}`}
        className={cn(styles.content, isOpen && styles.contentOpen)}
        aria-hidden={!isOpen}
      >
        <div className={styles.contentInner}>{children}</div>
      </div>
    </div>
  );
};

Accordion.displayName = "Accordion";

