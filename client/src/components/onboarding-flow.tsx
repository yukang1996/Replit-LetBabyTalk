import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import Ads from "@/pages/ads";
import LanguageSelection from "@/pages/language-selection";
import OnboardingIntro from "@/pages/onboarding-intro";
import Welcome from "@/pages/welcome";

type OnboardingStep = 
  | "ads" 
  | "language" 
  | "intro" 
  | "welcome" 
  | "complete";

interface OnboardingFlowProps {
  onComplete: () => void;
}

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("ads");
  const { isAuthenticated } = useAuth();
  const { language } = useLanguage();

  // If user is authenticated, complete onboarding
  useEffect(() => {
    if (isAuthenticated) {
      localStorage.setItem("onboardingCompleted", "true");
      onComplete();
    }
  }, [isAuthenticated, onComplete]);

  const handleStepComplete = (nextStep: OnboardingStep) => {
    setCurrentStep(nextStep);
  };

  const handleAdsComplete = () => {
    handleStepComplete("language");
  };

  const handleLanguageComplete = () => {
    handleStepComplete("intro");
  };

  const handleIntroComplete = () => {
    handleStepComplete("welcome");
  };

  const handleWelcomeComplete = () => {
    localStorage.setItem("onboardingCompleted", "true");
    onComplete();
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case "ads":
        return <Ads onComplete={handleAdsComplete} />;
      
      case "language":
        return <LanguageSelection onComplete={handleLanguageComplete} />;
      
      case "intro":
        return <OnboardingIntro onComplete={handleIntroComplete} />;
      
      case "welcome":
        return <Welcome onLoginRedirect={handleWelcomeComplete} onGuestComplete={handleWelcomeComplete} />;
      
      default:
        return null;
    }
  };

  return renderCurrentStep();
}