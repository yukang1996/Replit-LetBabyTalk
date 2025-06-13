import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/hooks/useLanguage";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import BearMascot from "@/components/bear-mascot";

interface WelcomeProps {
  onLoginRedirect: () => void;
  onGuestComplete: () => void;
}

export default function Welcome({ onLoginRedirect, onGuestComplete }: WelcomeProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const guestMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/auth/guest', 'POST', {});
    },
    onSuccess: (data) => {
      // Store guest user data in localStorage
      localStorage.setItem('guestUser', JSON.stringify(data));
      onGuestComplete();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to create guest account',
        variant: "destructive",
      });
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center container-responsive">
      <Card className="card-responsive glass-effect">
        <CardContent className="p-6 sm:p-8 text-center space-y-6">
          {/* Mascot */}
          <div className="flex justify-center">
            <BearMascot size="large" />
          </div>

          {/* Welcome Text */}
          <div className="space-y-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-pink-800">
              {t('welcome.title')}
            </h1>
            <p className="text-responsive text-gray-600">
              {t('welcome.subtitle')}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            <Button
              onClick={onLoginRedirect}
              className="w-full bg-pink-500 hover:bg-pink-600 text-white py-3 text-responsive"
              size="lg"
            >
              Sign In / Sign Up
            </Button>

            <Button
              onClick={() => guestMutation.mutate()}
              disabled={guestMutation.isPending}
              variant="outline"
              className="w-full border-pink-300 text-pink-700 hover:bg-pink-50 py-3 text-responsive"
              size="lg"
            >
              {guestMutation.isPending ? 'Creating account...' : 'Continue As Guest'}
            </Button>
          </div>

          {/* Info Text */}
          <p className="text-xs sm:text-sm text-gray-500 mt-4">
            {t('welcome.guestInfo')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}