"use client";

import React, { useState, useEffect } from "react";
import { OnboardingMessage } from "./OnboardingMessage";

export interface OnboardingMessageWrapperProps {
  userName: string;
  onboardingCompleted: boolean;
}

export const OnboardingMessageWrapper: React.FC<
  OnboardingMessageWrapperProps
> = ({ userName, onboardingCompleted }) => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Only show modal if onboarding is not completed
    if (!onboardingCompleted) {
      setIsOpen(true);
    }
  }, [onboardingCompleted]);

  const handleClose = () => {
    setIsOpen(false);
  };

  if (onboardingCompleted) {
    return null;
  }

  return (
    <OnboardingMessage
      userName={userName}
      isOpen={isOpen}
      onClose={handleClose}
    />
  );
};

