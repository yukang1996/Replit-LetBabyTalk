import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import Navigation from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Baby, 
  Globe, 
  HelpCircle, 
  CreditCard, 
  FileText, 
  Shield, 
  Phone,
  Check,
  ArrowLeft
} from "lucide-react";
import { Language, languageNames } from "@shared/i18n";
import { cn } from "@/lib/utils";

export default function Settings() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user, isGuest } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [showLanguageSelection, setShowLanguageSelection] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: t('error.unauthorized'),
        description: t('error.unauthorized'),
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast, t]);

  const handleLogout = async () => {
    try {
      // Clear session on server
      await fetch('/api/auth/logout', { method: 'POST' });

      // Clear all local storage
      localStorage.clear();

      // Invalidate all queries
      queryClient.clear();

      // Redirect to signin page
      window.location.href = "/signin";
    } catch (error) {
      console.error("Logout error:", error);
      // Force redirect even if logout fails
      localStorage.clear();
      queryClient.clear();
      window.location.href = "/signin";
    }
  };

  const handleLanguageSelect = (lang: Language) => {
    setLanguage(lang);
    setShowLanguageSelection(false);
    toast({
      title: t('common.success'),
      description: "Language updated successfully!",
    });
  };

  if (isLoading || !isAuthenticated) {
    return null;
  }

  if (showLanguageSelection) {
    const languages: Language[] = ['en', 'zh', 'ar', 'id'];

    return (
      <div className="min-h-screen">
        {/* Header */}
        <div className="gradient-bg p-4 flex items-center">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-white hover:bg-white/20 mr-3"
            onClick={() => setShowLanguageSelection(false)}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <span className="text-white font-medium text-lg">{t('settings.language')}</span>
        </div>

        <div className="p-4 pb-20">
          <Card className="glass-effect">
            <CardContent className="p-4">
              <div className="space-y-4">
                {languages.map((lang) => (
                  <Button
                    key={lang}
                    variant="ghost"
                    onClick={() => handleLanguageSelect(lang)}
                    className={cn(
                      "w-full justify-between p-4 h-auto text-left rounded-2xl",
                      language === lang 
                        ? "bg-primary/5 text-primary" 
                        : "hover:bg-gray-50"
                    )}
                  >
                    <span className="font-medium">{languageNames[lang]}</span>
                    {language === lang && (
                      <Check className="w-5 h-5 text-primary" />
                    )}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Navigation />
      </div>
    );
  }

  const settingsItems = [
    {
      icon: User,
      label: t('settings.account'),
      onClick: () => window.location.href = "/account",
    },
    {
      icon: Baby,
      label: t('settings.babyProfile'),
      onClick: () => window.location.href = "/baby-selection?from=/settings",
    },
    {
      icon: Globe,
      label: t('settings.language'),
      onClick: () => setShowLanguageSelection(true),
    },
    {
      icon: HelpCircle,
      label: t('settings.userGuide'),
      onClick: () => console.log("User guide"),
    },
    {
      icon: CreditCard,
      label: t('settings.subscription'),
      onClick: () => console.log("Subscription settings"),
    },
    {
      icon: FileText,
      label: t('settings.terms'),
      onClick: () => window.location.href = "/terms",
    },
    {
      icon: Shield,
      label: t('settings.privacy'),
      onClick: () => window.location.href = "/privacy",
    },
    {
      icon: Phone,
      label: t('settings.contact'),
      onClick: () => window.location.href = "/contact",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="gradient-bg p-4 text-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-16 h-16 bg-white rounded-full overflow-hidden">
            {user?.profileImageUrl ? (
              <img 
                src={user.profileImageUrl} 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-pink-300 to-purple-300 flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
            )}
          </div>
          <div>
            <h2 className="text-white font-medium text-lg">
              {user?.firstName || user?.email || "User"}
            </h2>
          </div>
        </div>
      </div>

      {/* Settings List */}
      <div className="p-4 pb-20">
        <Card className="glass-effect">
          <CardContent className="p-0">
            {settingsItems.map((item, index) => (
              <div key={item.label}>
                <Button
                  variant="ghost"
                  className="w-full justify-start p-4 h-auto text-left hover:bg-pink-50"
                  onClick={item.onClick}
                >
                  <item.icon className="w-5 h-5 text-pink-500 mr-4" />
                  <span className="text-gray-700 font-medium">{item.label}</span>
                </Button>
                {index < settingsItems.length - 1 && <Separator />}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Logout Button */}
        <div className="mt-6">
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full border-red-300 text-red-600 hover:bg-red-50 rounded-2xl py-3"
          >
            {t('settings.signOut')}
          </Button>
        </div>
      </div>

      <Navigation />
    </div>
  );
}