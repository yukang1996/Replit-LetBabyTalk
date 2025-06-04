import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import BearMascot from "@/components/bear-mascot";

interface OnboardingWelcomeProps {
  onComplete: () => void;
}

export default function OnboardingWelcome({ onComplete }: OnboardingWelcomeProps) {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md glass-effect">
        <CardContent className="pt-8 pb-8 text-center">
          <div className="mb-8">
            <BearMascot size="large" className="mx-auto bear-float mb-6" />
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
            {t('onboarding.ok')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}