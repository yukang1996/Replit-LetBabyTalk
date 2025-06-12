import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import Navigation from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Crown, Star, MessageCircle, BookOpen, Sparkles } from "lucide-react";

export default function Advisor() {
  const { user } = useAuth();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="gradient-bg p-4 flex items-center justify-between">
        <h1 className="text-white font-medium text-lg">AI Advisor</h1>
        <Button 
          variant="ghost" 
          size="sm"
          className="text-white hover:bg-white/20"
        >
          <Crown className="w-4 h-4 mr-2" />
          Premium
        </Button>
      </div>

      {/* Premium Feature Content */}
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] p-4">
        <Card className="w-full max-w-md glass-effect text-center">
          <CardHeader>
            <div className="w-20 h-20 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-800 mb-2">
              AI Parenting Advisor
            </CardTitle>
            <p className="text-gray-600">
              Get personalized parenting advice powered by AI
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3 text-left">
                <MessageCircle className="w-5 h-5 text-pink-500" />
                <span className="text-gray-700">24/7 Expert Guidance</span>
              </div>
              <div className="flex items-center space-x-3 text-left">
                <BookOpen className="w-5 h-5 text-pink-500" />
                <span className="text-gray-700">Personalized Tips & Articles</span>
              </div>
              <div className="flex items-center space-x-3 text-left">
                <Star className="w-5 h-5 text-pink-500" />
                <span className="text-gray-700">Age-specific Recommendations</span>
              </div>
            </div>

            <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-2">Premium Feature</h3>
              <p className="text-sm text-gray-600 mb-4">
                Unlock AI-powered parenting advice tailored to your baby's needs and development stage.
              </p>
              <Button className="w-full gradient-bg text-white rounded-2xl">
                <Crown className="w-4 h-4 mr-2" />
                Upgrade to Premium
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Navigation />
    </div>
  );
}