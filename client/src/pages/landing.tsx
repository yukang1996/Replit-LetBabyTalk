import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLanguage } from "@/hooks/useLanguage";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import BearMascot from "@/components/bear-mascot";
import Onboarding from "./onboarding";

export default function Landing() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [hasCompletedIntro, setHasCompletedIntro] = useState(() => {
    return localStorage.getItem('hasCompletedIntro') === 'true';
  });
  const { t } = useLanguage();
  const { toast } = useToast();

  const createGuestMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/auth/guest");
    },
    onSuccess: (user) => {
      // Store guest user in localStorage for session management
      localStorage.setItem('guestUser', JSON.stringify(user));
      localStorage.setItem('hasCompletedIntro', 'true');
      setHasCompletedIntro(true);
      // Refresh the page to trigger auth state update
      window.location.reload();
    },
    onError: (error) => {
      toast({
        title: t('common.error'),
        description: "Failed to create guest account. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  const handleGuestMode = () => {
    if (!hasCompletedIntro) {
      setShowOnboarding(true);
    } else {
      createGuestMutation.mutate();
    }
  };

  const handleOnboardingComplete = (user?: any) => {
    localStorage.setItem('hasCompletedIntro', 'true');
    setHasCompletedIntro(true);
    if (user) {
      // Guest user was created during onboarding
      window.location.reload();
    } else {
      // User completed onboarding, now create guest account
      createGuestMutation.mutate();
    }
  };

  if (showOnboarding && !hasCompletedIntro) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md glass-effect">
        <CardContent className="pt-6 text-center">
          <div className="mb-8">
            <BearMascot size="large" className="mx-auto bear-float" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{t('onboarding.welcome')}</h1>
          <p className="text-gray-600 mb-8">{t('onboarding.subtitle')}</p>
          
          <div className="space-y-4 mb-6">
            <div className="flex items-center text-sm text-gray-600">
              <span className="w-2 h-2 bg-primary rounded-full mr-3"></span>
              {t('onboarding.features.understand')}
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <span className="w-2 h-2 bg-primary rounded-full mr-3"></span>
              {t('onboarding.features.explain')}
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <span className="w-2 h-2 bg-primary rounded-full mr-3"></span>
              {t('onboarding.features.advice')}
            </div>
          </div>
          
          <Button 
            onClick={handleLogin}
            className="w-full gradient-bg text-white font-medium py-3 rounded-2xl mb-4 hover:opacity-90 transition-opacity"
            disabled={createGuestMutation.isPending}
          >
            {t('onboarding.getStarted')}
          </Button>
          
          <Button 
            variant="outline"
            onClick={handleGuestMode}
            disabled={createGuestMutation.isPending}
            className="w-full border-primary text-primary hover:bg-primary/5 rounded-2xl"
          >
            {createGuestMutation.isPending ? t('common.loading') : t('onboarding.continueAsGuest')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
