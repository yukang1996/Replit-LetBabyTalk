import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import Navigation from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Crown, ArrowLeft, ChefHat, Syringe, BookOpen } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function Advisor() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [, navigate] = useLocation();
  const [showPremiumDialog, setShowPremiumDialog] = useState(false);

  // Check premium access on component mount
  useEffect(() => {
    if (user && !user.isPremium) {
      setShowPremiumDialog(true);
    }
  }, [user]);

  const advisorModules = [
    {
      id: "food-recipe",
      title: "Food Recipe",
      description:
        "Have a look at the how to prepare healthy food for your baby.",
      icon: ChefHat,
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
      disabled: !user?.isPremium,
    },
    {
      id: "vaccination",
      title: "Vaccination",
      description:
        "Schedule your baby's vaccination appointment for a healthy start.",
      icon: Syringe,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      disabled: !user?.isPremium,
    },
    {
      id: "articles",
      title: "Articles",
      description:
        "Explore essential articles to help parents understand and support their baby's development.",
      icon: BookOpen,
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
      disabled: !user?.isPremium,
    },
  ];

  const handleModuleClick = (moduleId: string) => {
    if (!user?.isPremium) {
      // Navigate to subscription page for premium features
      navigate("/subscription?from=/advisor");
      return;
    }

    // Handle navigation to specific module (implement later)
    console.log(`Navigate to ${moduleId}`);
  };

  const handleGoPremium = () => {
    navigate("/subscription?from=/advisor");
  };

  // If user is not premium, show premium dialog
  if (showPremiumDialog && user && !user.isPremium) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Dialog
          open={showPremiumDialog}
          onOpenChange={(open) => {
            if (!open) {
              setShowPremiumDialog(false);
              // Check if there's previous history, otherwise go to settings
              navigate("/record");
            }
          }}
        >
          <DialogContent className="max-w-md [&>button]:hidden">
            <DialogHeader>
              <DialogTitle className="text-center flex items-center justify-center space-x-2">
                <Crown className="w-6 h-6 text-yellow-500" />
                <span>Premium Feature</span>
              </DialogTitle>
            </DialogHeader>
            <div className="text-center space-y-4 py-4">
              <div className="w-20 h-20 mx-auto bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                <Crown className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">
                Please subscribe to premium to unlock health advisor access
              </h3>
              <p className="text-gray-600 text-sm">
                Get unlimited access to our health advisor and premium features
              </p>
              <div className="flex justify-center pt-4">
                <Button
                  onClick={handleGoPremium}
                  className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white"
                >
                  <Crown className="w-4 h-4 mr-2" />
                  Go Premium
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        <Navigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-400 to-pink-500 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20 mr-3 p-2"
              onClick={() => navigate("/settings")}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-white font-medium text-lg">Health Advisor</h1>
          </div>

          {user?.isPremium && (
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
            >
              <Crown className="w-4 h-4 mr-2" />
              Premium
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 pb-20">
        <div className="max-w-md mx-auto space-y-4">
          {advisorModules.map((module) => {
            const IconComponent = module.icon;

            return (
              <Card
                key={module.id}
                className={`transition-all duration-200 ${
                  module.disabled
                    ? "cursor-pointer bg-white border-gray-200 hover:border-pink-200 hover:shadow-sm opacity-80"
                    : "cursor-pointer bg-white border-gray-200 hover:border-pink-200 hover:shadow-md"
                }`}
                onClick={() => handleModuleClick(module.id)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start space-x-5">
                    {/* Radio button style indicator */}
                    <div className="flex items-center justify-center w-5 h-5 mt-1 flex-shrink-0">
                      <div className="w-4 h-4 border-2 border-gray-300 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-pink-500 rounded-full opacity-0"></div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 mb-1">
                        {module.title}
                      </h3>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {module.description}
                      </p>
                    </div>

                    {/* Icon */}
                    <div
                      className={`w-16 h-16 ${module.iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}
                    >
                      <IconComponent
                        className={`w-8 h-8 ${module.iconColor}`}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <Navigation />
    </div>
  );
}
