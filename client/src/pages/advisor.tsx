
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import Navigation from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Crown, ArrowLeft, ChefHat, Syringe, BookOpen } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function Advisor() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [, navigate] = useLocation();

  const advisorModules = [
    {
      id: "food-recipe",
      title: "Food Recipe",
      description: "Have a look at the how to prepare healthy food for your baby.",
      icon: ChefHat,
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
      disabled: !user?.isPremium,
    },
    {
      id: "vaccination",
      title: "Vaccination",
      description: "Schedule your baby's vaccination appointment for a healthy start.",
      icon: Syringe,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      disabled: !user?.isPremium,
    },
    {
      id: "articles",
      title: "Articles",
      description: "Explore essential articles to help parents understand and support their baby's development.",
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
                <CardContent className="p-4">
                  <div className="flex items-start space-x-4">
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
                    <div className={`w-12 h-12 ${module.iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                      <IconComponent className={`w-6 h-6 ${module.iconColor}`} />
                    </div>
                  </div>
                  
                  {/* Premium indicator for non-premium users */}
                  {module.disabled && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Premium Feature</span>
                        <Crown className="w-4 h-4 text-yellow-500" />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
          
          {/* Upgrade prompt for non-premium users */}
          {!user?.isPremium && (
            <Card className="bg-gradient-to-r from-pink-50 to-purple-50 border-pink-200 mt-6">
              <CardContent className="p-4 text-center">
                <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Crown className="w-6 h-6 text-pink-600" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">
                  Unlock Health Advisor
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Get access to personalized health guidance, vaccination schedules, and nutrition tips for your baby.
                </p>
                <Button 
                  className="w-full bg-gradient-to-r from-pink-400 to-pink-500 text-white rounded-2xl hover:opacity-90 transition-opacity"
                  onClick={() => navigate("/subscription?from=/advisor")}
                >
                  <Crown className="w-4 h-4 mr-2" />
                  Upgrade to Premium
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Navigation />
    </div>
  );
}
