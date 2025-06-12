import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import Navigation from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Crown, Bot, MessageSquare, Heart, Zap } from "lucide-react";

export default function Chatbot() {
  const { user } = useAuth();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="gradient-bg p-4 flex items-center justify-between">
        <h1 className="text-white font-medium text-lg">AI Chatbot</h1>
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
            <div className="w-20 h-20 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bot className="w-10 h-10 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-800 mb-2">
              AI Parenting Chatbot
            </CardTitle>
            <p className="text-gray-600">
              Chat with our AI assistant for instant parenting support
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3 text-left">
                <MessageSquare className="w-5 h-5 text-blue-500" />
                <span className="text-gray-700">Instant Answers</span>
              </div>
              <div className="flex items-center space-x-3 text-left">
                <Heart className="w-5 h-5 text-blue-500" />
                <span className="text-gray-700">Emotional Support</span>
              </div>
              <div className="flex items-center space-x-3 text-left">
                <Zap className="w-5 h-5 text-blue-500" />
                <span className="text-gray-700">24/7 Availability</span>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-2">Premium Feature</h3>
              <p className="text-sm text-gray-600 mb-4">
                Get instant responses to your parenting questions and receive emotional support when you need it most.
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