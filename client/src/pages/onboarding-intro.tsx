import { useEffect, useState } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import letBabyTalkImage from "@assets/letbabytalk_starting_image.9.png";

interface OnboardingIntroProps {
  onComplete: () => void;
}

export default function OnboardingIntro({ onComplete }: OnboardingIntroProps) {
  const { t } = useLanguage();
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Show the intro image for 3 seconds, then show the content
    const timer = setTimeout(() => {
      setShowContent(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (!showContent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-100 to-purple-100">
        <div className="text-center">
          <img 
            src={letBabyTalkImage} 
            alt="LetBabyTalk"
            className="w-64 h-auto mx-auto rounded-3xl shadow-2xl"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md glass-effect">
        <CardContent className="pt-8 pb-8 text-center">
          <div className="mb-8">
            <img 
              src={letBabyTalkImage} 
              alt="LetBabyTalk"
              className="w-32 h-auto mx-auto rounded-2xl shadow-lg mb-6"
            />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {t('onboarding.welcome')}
          </h1>
          <p className="text-gray-600 mb-8">
            {t('onboarding.subtitle')}
          </p>
          
          <div className="space-y-4 mb-8">
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
            onClick={onComplete}
            className="w-full gradient-bg text-white font-medium py-3 rounded-2xl hover:opacity-90 transition-opacity"
          >
            {t('onboarding.next')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}