"use client";

import React from "react";
import Link from "next/link";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Users, UserCheck, Shield } from "lucide-react";
import styles from "./QuickActions.module.css";

interface QuickActionsProps {
  userRole: "ADMIN" | "SUPER_ADMIN";
}

export const QuickActions: React.FC<QuickActionsProps> = ({ userRole }) => {
  const actions = [
    {
      label: "View All Users",
      icon: Users,
      href: userRole === "SUPER_ADMIN" ? "/super-admin/users" : "/admin/users",
    },
    {
      label: "Pending Approvals",
      icon: UserCheck,
      href: userRole === "SUPER_ADMIN" ? "/super-admin/pending" : "/admin/pending",
    },
    ...(userRole === "SUPER_ADMIN"
      ? [
          {
            label: "Manage Admins",
            icon: Shield,
            href: "/super-admin/admins",
          },
        ]
      : []),
  ];

  return (
    <Card className={styles.quickActionsCard}>
      <CardHeader>
        <h3 className={styles.title}>Quick Actions</h3>
      </CardHeader>
      <CardBody>
        <div className={styles.actions}>
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.href} href={action.href}>
                <Button
                  variant="secondary"
                  size="lg"
                  className={styles.actionButton}
                >
                  <Icon size={20} />
                  <span>{action.label}</span>
                </Button>
              </Link>
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
};
