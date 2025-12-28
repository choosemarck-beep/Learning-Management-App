"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Logo } from "@/components/ui/Logo";
import { GalaxyBackground } from "@/components/ui/GalaxyBackground";
import styles from "./page.module.css";

export default function Home() {
  return (
    <>
      <GalaxyBackground starCount={150} meteorCount={3} />
      <main className={styles.main}>
        <Card className={styles.glassContainer}>
          <div className={styles.content}>
            <div className={styles.hero}>
              <div className={styles.logoWrapper}>
                <Logo className={styles.logo} />
              </div>
              <p className={styles.description}>
                Welcome to your LM App
              </p>
              <p className={styles.subtitle}>
                Embark on a gamified learning adventure and level up your skills!
              </p>
            </div>

            <div className={styles.ctaSection}>
              <h2 className={styles.cardTitle}>Ready to Start Learning?</h2>
              <div className={styles.ctaButtons}>
                <Link href="/signup" className={styles.link}>
                  <Button variant="primary" size="md" className={styles.button}>
                    Join the Squad
                  </Button>
                </Link>
                <Link href="/login" className={styles.link}>
                  <Button variant="outline" size="md" className={styles.button}>
                    Sign In
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </Card>
      </main>
    </>
  );
}

