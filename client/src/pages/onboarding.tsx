import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import OnboardingIntro from "./onboarding-intro";
import LanguageSelection from "./language-selection";
import OnboardingWelcome from "./onboarding-welcome";

interface OnboardingProps {
  onComplete: (user?: any) => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const { toast } = useToast();

  const createGuestMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/auth/guest");
    },
    onSuccess: (user) => {
      // Store guest user in localStorage for session management
      localStorage.setItem('guestUser', JSON.stringify(user));
      onComplete(user);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create guest account. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleStepComplete = () => {
    if (step < 2) {
      setStep(step + 1);
    } else {
      // Complete onboarding
      onComplete();
    }
  };

  const handleGuestMode = () => {
    createGuestMutation.mutate();
  };

  const steps = [
    <OnboardingIntro key="intro" onComplete={handleStepComplete} />,
    <LanguageSelection key="language" onComplete={handleStepComplete} />,
    <OnboardingWelcome key="welcome" onComplete={handleStepComplete} />,
  ];

  return steps[step];
}