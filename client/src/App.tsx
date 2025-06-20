import { useState, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
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
import Terms from "@/pages/terms";
import Account from "@/pages/account";
import History from "@/pages/history";
import Advisor from "@/pages/advisor";
import Chatbot from "@/pages/chatbot";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import ForgotPassword from "@/pages/forgot-password";
import Verification from "@/pages/verification";
import ResetPassword from "@/pages/reset-password";
import NotFound from "@/pages/not-found";
import Results from "./pages/results";

function Router() {
  const { isAuthenticated, isLoading, refetch } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [, navigate] = useLocation();
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState<string>("");
  const [showForgotPasswordVerification, setShowForgotPasswordVerification] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const onboardingCompleted = localStorage.getItem("onboardingCompleted");
      // Only show onboarding for completely new users, not after logout
      if (onboardingCompleted !== "true" && !window.location.pathname.includes('/signin')) {
        setShowOnboarding(true);
      }
    }
  }, [isLoading, isAuthenticated]);

  const handleOnboardingComplete = () => {
    localStorage.setItem("onboardingCompleted", "true");
    setShowOnboarding(false);
  };

  const handleLoginSuccess = async () => {
    console.log("Login success, refetching auth...");
    await refetch();
    navigate('/');
  };

  const handleSignupSuccess = async () => {
    console.log("Signup success, refetching auth...");
    await refetch();
    navigate('/');
  };

  const handleGuestComplete = async () => {
    console.log("Guest complete, refetching auth...");
    await refetch();
    navigate('/');
  };

  const handleLoginRedirect = () => {
    console.log("Navigating to signin...");
    navigate('/signin');
  };

  // Show onboarding flow for new users
  if (showOnboarding) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }

  return (
    <Switch>
      {/* Protected routes */}
      {isLoading ? (
        <Route path="*" component={() => <div className="min-h-screen flex items-center justify-center">Loading...</div>} />
      ) : !isAuthenticated ? (
        <>
          <Route path="/signin" component={() => <Login onLoginSuccess={handleLoginSuccess} />} />
          <Route path="/signup" component={() => <Signup onSignupSuccess={handleSignupSuccess} />} />
          <Route path="/forgot-password">
          {showForgotPasswordVerification ? (
            <Verification
              type="forgot-password"
              email={forgotPasswordEmail}
              onVerificationSuccess={() => {
                setShowForgotPasswordVerification(false);
                setShowResetPassword(true);
              }}
              onBackToForgotPassword={() => {
                setShowForgotPasswordVerification(false);
                setForgotPasswordEmail("");
              }}
            />
          ) : showResetPassword ? (
            <ResetPassword
              email={forgotPasswordEmail}
              onResetSuccess={() => {
                setShowResetPassword(false);
                setForgotPasswordEmail("");
                // Navigate back to login
                navigate("/signin");
              }}
            />
          ) : (
            <ForgotPassword onSubmitSuccess={(email) => {
              console.log('Forgot password submitted for:', email);
              setForgotPasswordEmail(email);
              setShowForgotPasswordVerification(true);
            }} />
          )}
        </Route>
          <Route path="/verification" component={Verification} />
          <Route path="/reset-password" component={ResetPassword} />
          <Route path="/" component={() => <Welcome onLoginRedirect={handleLoginRedirect} onGuestComplete={handleGuestComplete} />} />
          <Route component={NotFound} />
        </>
      ) : (
        <>
          <Route path="/" component={BabySelection} />
          <Route path="/record" component={Home} />
          <Route path="/baby-profile" component={BabyProfile} />
          <Route path="/baby-selection" component={BabySelection} />
          <Route path="/settings" component={Settings} />
          <Route path="/terms" component={Terms} />
          <Route component={NotFound} />
        </>
      )}
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