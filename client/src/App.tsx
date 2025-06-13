import { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import OnboardingFlow from "@/components/onboarding-flow";
import Welcome from "@/pages/welcome";
import JourneyStart from "@/pages/journey-start";
import BabySelection from "@/pages/baby-selection";
import Home from "@/pages/home";
import BabyProfile from "@/pages/baby-profile";
import Settings from "@/pages/settings";
import History from "@/pages/history";
import Advisor from "@/pages/advisor";
import Chatbot from "@/pages/chatbot";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import ForgotPassword from "@/pages/forgot-password";
import Verification from "@/pages/verification";
import ResetPassword from "@/pages/reset-password";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showJourneyStart, setShowJourneyStart] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const onboardingCompleted = localStorage.getItem("onboardingCompleted");
      if (onboardingCompleted !== "true") {
        setShowOnboarding(true);
      } else {
        setShowJourneyStart(true);
      }
    }
  }, [isLoading, isAuthenticated]);

  const handleOnboardingComplete = () => {
    localStorage.setItem("onboardingCompleted", "true");
    setShowOnboarding(false);
    setShowJourneyStart(true);
  };

  const handleJourneyToLogin = () => {
    setShowJourneyStart(false);
  };

  const handleGuestComplete = () => {
    setShowJourneyStart(false);
  };

  // Show onboarding flow for new users
  if (showOnboarding) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }

  // Show journey start page
  if (showJourneyStart) {
    return <JourneyStart onSignInSignUp={handleJourneyToLogin} onGuestComplete={handleGuestComplete} />;
  }

  return (
    <Switch>
      {/* Protected routes */}
      {isLoading ? (
        <Route path="*" component={() => <div className="min-h-screen flex items-center justify-center">Loading...</div>} />
      ) : !isAuthenticated ? (
        <>
          <Route path="/signup" component={() => <Signup onSignupSuccess={() => setShowJourneyStart(false)} />} />
          <Route path="*" component={() => <Login onLoginSuccess={() => setShowJourneyStart(false)} />} />
        </>
      ) : (
        <>
          <Route path="/" component={BabySelection} />
          <Route path="/record" component={Home} />
          <Route path="/baby-profile" component={BabyProfile} />
          <Route path="/baby-selection" component={BabySelection} />
          <Route path="/settings" component={Settings} />
          <Route path="/history" component={History} />
          <Route path="/advisor" component={Advisor} />
          <Route path="/chatbot" component={Chatbot} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
