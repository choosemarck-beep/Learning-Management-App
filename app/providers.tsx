"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast";
import { ReactNode } from "react";
import { SplashScreenWrapper } from "@/components/layout/SplashScreenWrapper";
import { ThemeProvider } from "@/components/ThemeProvider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <SplashScreenWrapper>
          {children}
        </SplashScreenWrapper>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#1E1B4B",
              color: "#FFFFFF",
              border: "1px solid #8B5CF6",
              borderRadius: "12px",
              padding: "16px",
              fontSize: "14px",
              maxWidth: "90%",
            },
            success: {
              iconTheme: {
                primary: "#10B981",
                secondary: "#FFFFFF",
              },
            },
            error: {
              iconTheme: {
                primary: "#EF4444",
                secondary: "#FFFFFF",
              },
            },
          }}
        />
      </ThemeProvider>
    </SessionProvider>
  );
}

