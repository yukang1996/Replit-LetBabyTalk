import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Language, languageNames } from "@shared/i18n";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface LanguageSelectionProps {
  onComplete: () => void;
}

export default function LanguageSelection({ onComplete }: LanguageSelectionProps) {
  const { language, setLanguage, t } = useLanguage();

  const languages: Language[] = ['en', 'zh', 'ar', 'id'];

  const handleLanguageSelect = (lang: Language) => {
    setLanguage(lang);
  };

  const handleContinue = () => {
    onComplete();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md glass-effect">
        <CardContent className="pt-8 pb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-8 text-center">
            {t('onboarding.languageSelection')}
          </h1>
          
          <div className="space-y-4 mb-8">
            {languages.map((lang) => (
              <Button
                key={lang}
                variant="outline"
                onClick={() => handleLanguageSelect(lang)}
                className={cn(
                  "w-full justify-between p-4 h-auto text-left rounded-2xl",
                  language === lang 
                    ? "border-primary bg-primary/5 text-primary" 
                    : "border-gray-200 hover:bg-gray-50"
                )}
              >
                <span className="font-medium">{languageNames[lang]}</span>
                {language === lang && (
                  <Check className="w-5 h-5 text-primary" />
                )}
              </Button>
            ))}
          </div>
          
          <Button 
            onClick={handleContinue}
            className="w-full gradient-bg text-white font-medium py-3 rounded-2xl hover:opacity-90 transition-opacity"
          >
            {t('onboarding.next')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}