import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import Ads from "@/pages/ads";
import LanguageSelection from "@/pages/language-selection";
import OnboardingIntro from "@/pages/onboarding-intro";
import OnboardingWelcome from "@/pages/onboarding-welcome";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import ForgotPassword from "@/pages/forgot-password";
import Verification from "@/pages/verification";
import ResetPassword from "@/pages/reset-password";

type OnboardingStep = 
  | "intro" 
  | "ads" 
  | "language" 
  | "welcome" 
  | "login" 
  | "signup" 
  | "forgot-password" 
  | "verification" 
  | "reset-password"
  | "complete";

interface OnboardingFlowProps {
  onComplete: () => void;
}

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("intro");
  const [userEmail, setUserEmail] = useState("");
  const [verificationType, setVerificationType] = useState<"signup" | "forgot-password">("signup");
  const { isAuthenticated } = useAuth();
  const { language } = useLanguage();

  // Check if user has completed onboarding before
  useEffect(() => {
    const onboardingCompleted = localStorage.getItem("onboardingCompleted");
    if (onboardingCompleted === "true") {
      setCurrentStep("login");
    }
  }, []);

  // If user is authenticated, complete onboarding
  useEffect(() => {
    if (isAuthenticated) {
      localStorage.setItem("onboardingCompleted", "true");
      onComplete();
    }
  }, [isAuthenticated, onComplete]);

  const handleStepComplete = (nextStep: OnboardingStep, email?: string) => {
    if (email) {
      setUserEmail(email);
    }
    setCurrentStep(nextStep);
  };

  const handleIntroComplete = () => {
    handleStepComplete("ads");
  };

  const handleAdsComplete = () => {
    handleStepComplete("language");
  };

  const handleLanguageComplete = () => {
    handleStepComplete("welcome");
  };

  const handleWelcomeComplete = () => {
    handleStepComplete("signup");
  };

  const handleLoginSuccess = () => {
    localStorage.setItem("onboardingCompleted", "true");
    onComplete();
  };

  const handleSignupSuccess = () => {
    setVerificationType("signup");
    handleStepComplete("verification");
  };

  const handleForgotPasswordSuccess = (email: string) => {
    setVerificationType("forgot-password");
    handleStepComplete("verification", email);
  };

  const handleVerificationComplete = () => {
    if (verificationType === "signup") {
      handleStepComplete("login");
    } else {
      handleStepComplete("reset-password");
    }
  };

  const handleResetPasswordSuccess = () => {
    handleStepComplete("login");
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case "intro":
        return <OnboardingIntro onComplete={handleIntroComplete} />;
      
      case "ads":
        return <Ads onComplete={handleAdsComplete} />;
      
      case "language":
        return <LanguageSelection onComplete={handleLanguageComplete} />;
      
      case "welcome":
        return <OnboardingWelcome onComplete={handleWelcomeComplete} />;
      
      case "login":
        return <Login onLoginSuccess={handleLoginSuccess} />;
      
      case "signup":
        return <Signup onSignupSuccess={handleSignupSuccess} />;
      
      case "forgot-password":
        return <ForgotPassword onSubmitSuccess={handleForgotPasswordSuccess} />;
      
      case "verification":
        return (
          <Verification 
            email={userEmail}
            type={verificationType}
            onComplete={handleVerificationComplete}
          />
        );
      
      case "reset-password":
        return (
          <ResetPassword 
            email={userEmail}
            onResetSuccess={handleResetPasswordSuccess}
          />
        );
      
      default:
        return null;
    }
  };

  return renderCurrentStep();
}