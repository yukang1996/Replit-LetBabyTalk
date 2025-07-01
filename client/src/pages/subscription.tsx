import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, ArrowLeft, Check, MessageCircle, Heart } from "lucide-react";
import { Link, useLocation } from "wouter";

interface SubscriptionPlan {
  id: string;
  name: string;
  price: string;
  period: string;
  features: string[];
  isCurrentPlan?: boolean;
  isPremium: boolean;
  badge?: string;
  disabled?: boolean;
}

export default function Subscription() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Get the 'from' parameter from URL or default to settings
  const getBackPath = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const from = urlParams.get("from");

    // If coming from baby-selection, check if we should go to a different page
    if (from === "/baby-selection") {
      // Get the original referrer from baby-selection page
      const originalFrom = urlParams.get("originalFrom");
      return originalFrom || "/record";
    }

    return from || "/settings";
  };

  const plans: SubscriptionPlan[] = [
    {
      id: "free",
      name: "Free",
      price: "AED 0",
      period: "month",
      features: [
        "Up to 4 crying reasons",
        "Basic cry analysis",
        "Limited recordings per day",
      ],
      isCurrentPlan: !user?.isPremium,
      isPremium: false,
      badge: user?.isPremium ? undefined : "Your current plan",
    },
    {
      id: "premium",
      name: "Premium",
      price: "AED 28",
      period: "month",
      features: [
        "Up to 7 crying reasons",
        "Advanced AI chatbot",
        "Health advisor",
        "Unlimited recordings",
        "Priority support",
        "Export reports",
      ],
      isCurrentPlan: user?.isPremium,
      disabled: true,
      isPremium: true,
      badge: user?.isPremium ? "Your current plan" : "Subscribe premium",
    },
  ];

  const subscribeMutation = useMutation({
    mutationFn: async (planId: string) => {
      const response = await apiRequest(
        "POST",
        "/api/subscriptions/subscribe",
        {
          planId,
        },
      );
      return response.json();
    },
    onSuccess: (data) => {
      if (data.paymentUrl) {
        // Redirect to payment processor (Stripe, PayPal, etc.)
        window.location.href = data.paymentUrl;
      } else {
        toast({
          title: "Success!",
          description: "Your subscription has been updated.",
        });
        // Refresh user data
        window.location.reload();
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to process subscription",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsProcessing(false);
      setSelectedPlan(null);
    },
  });

  const handlePlanSelect = async (planId: string) => {
    if (isProcessing) return;

    const plan = plans.find((p) => p.id === planId);
    if (!plan || plan.disabled) return;

    // If selecting current plan, do nothing
    if (plan.isCurrentPlan) {
      toast({
        title: "Already Active",
        description: `You're already on the ${plan.name} plan.`,
      });
      return;
    }

    // If selecting free plan and user is premium
    if (planId === "free" && user?.isPremium) {
      toast({
        title: "Downgrade Notice",
        description: "Please contact support to downgrade your plan.",
      });
      return;
    }

    setSelectedPlan(planId);
    setIsProcessing(true);

    // For free plan, just show success
    if (planId === "free") {
      toast({
        title: "Welcome!",
        description:
          "You're using the free plan. Upgrade anytime for more features!",
      });
      setIsProcessing(false);
      setSelectedPlan(null);
      return;
    }

    // For premium plan, initiate subscription process
    subscribeMutation.mutate(planId);
  };

  // Check if running in mobile app context
  const isMobileApp =
    typeof window !== "undefined" &&
    (window.navigator.userAgent.includes("Mobile") ||
      window.navigator.userAgent.includes("Android") ||
      window.navigator.userAgent.includes("iPhone"));

  const handleMobileAppPurchase = (planId: string) => {
    // This would integrate with React Native's in-app purchase libraries
    // For now, show a message about mobile app purchases
    toast({
      title: "Mobile App Purchase",
      description:
        "In-app purchases will be available in the mobile app version.",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-400 to-pink-500 p-4">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20 mr-3 p-2"
            onClick={() => navigate(getBackPath())}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-white font-medium text-lg">Subscription</h1>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 pb-20">
        <div className="max-w-md mx-auto space-y-4">
          {/* Header Card */}
          <Card className="bg-white border-0 shadow-sm">
            <CardContent className="p-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-1">
                Upgrade your plan
              </h2>
              <p className="text-sm text-gray-600">
                Choose the perfect plan for your baby's needs
              </p>
            </CardContent>
          </Card>

          {/* Subscription Plans */}
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`transition-all duration-200 border-2 ${
                plan.disabled
                  ? "cursor-not-allowed opacity-50 bg-gray-100 border-gray-300"
                  : plan.isCurrentPlan
                    ? "cursor-pointer border-pink-300 bg-pink-50"
                    : selectedPlan === plan.id
                      ? "cursor-pointer border-pink-400 bg-pink-25"
                      : "cursor-pointer border-gray-200 bg-white hover:border-pink-200 hover:shadow-md"
              } ${isProcessing && selectedPlan === plan.id ? "opacity-50" : ""}`}
              onClick={() => (plan.disabled ? null : handlePlanSelect(plan.id))}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="text-lg font-semibold text-gray-800">
                        {plan.name}
                      </h3>
                      {plan.isPremium && (
                        <Crown className="w-4 h-4 text-yellow-500" />
                      )}
                    </div>
                    <div className="flex items-baseline space-x-1">
                      <span className="text-xl font-bold text-gray-800">
                        {plan.price}
                      </span>
                      <span className="text-sm text-gray-500">
                        /{plan.period}
                      </span>
                    </div>
                  </div>

                  {plan.badge && (
                    <Badge
                      variant={plan.isCurrentPlan ? "default" : "secondary"}
                      className={
                        plan.isCurrentPlan
                          ? "bg-pink-500 hover:bg-pink-600"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }
                    >
                      {plan.badge}
                    </Badge>
                  )}
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-700 font-medium mb-2">
                    {plan.id === "free"
                      ? "LetBabyTalk beginners, this one's for you"
                      : "LetBabyTalk member, let's explore the intricacies"}
                  </p>
                </div>

                <div className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <Check
                        className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                          plan.disabled ? "text-gray-400" : "text-green-500"
                        }`}
                      />
                      <span
                        className={`text-sm ${
                          plan.disabled ? "text-gray-500" : "text-gray-600"
                        }`}
                      >
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Processing indicator */}
                {isProcessing && selectedPlan === plan.id && (
                  <div className="mt-4 text-center">
                    <div className="inline-flex items-center space-x-2 text-sm text-gray-600">
                      <div className="w-4 h-4 border-2 border-pink-300 border-t-pink-600 rounded-full animate-spin"></div>
                      <span>Processing...</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {/* Info Card for Mobile App */}
          {isMobileApp && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-blue-800 mb-1">
                      Mobile App Purchases
                    </h3>
                    <p className="text-sm text-blue-700">
                      In the mobile app, subscriptions will be handled through
                      your device's app store for a seamless experience.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Benefits Card */}
          <Card className="bg-gradient-to-r from-pink-50 to-purple-50 border-pink-200">
            <CardContent className="p-4">
              <div className="text-center">
                <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Heart className="w-6 h-6 text-pink-600" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">
                  Why Choose Premium?
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Get the most comprehensive baby cry analysis with advanced AI
                  insights, unlimited recordings, and expert guidance.
                </p>
                <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
                  <span>• Cancel anytime</span>
                  <span>• 7-day free trial</span>
                  <span>• 24/7 support</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Navigation />
    </div>
  );
}
