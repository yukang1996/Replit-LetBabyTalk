import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/hooks/useLanguage";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface JourneyStartProps {
  onSignInSignUp: () => void;
  onGuestComplete: () => void;
}

export default function JourneyStart({ onSignInSignUp, onGuestComplete }: JourneyStartProps) {
  const { t } = useLanguage();
  const { toast } = useToast();

  const guestMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/auth/guest', 'POST', {});
    },
    onSuccess: () => {
      onGuestComplete();
    },
    onError: (error) => {
      toast({
        title: t('common.error'),
        description: t('error.failedToCreate'),
        variant: "destructive",
      });
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center container-responsive">
      <Card className="card-responsive glass-effect">
        <CardContent className="p-6 sm:p-8 text-center space-y-8">
          {/* Bear Mascot with Baby Items */}
          <div className="flex justify-center">
            <div className="relative">
              {/* Main bear mascot with baby bottle */}
              <div className="w-48 h-48 sm:w-56 sm:h-56 relative">
                <svg
                  viewBox="0 0 200 200"
                  className="w-full h-full"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Bear body */}
                  <ellipse cx="100" cy="140" rx="45" ry="35" fill="#F8E8D8" stroke="#D4A574" strokeWidth="2"/>
                  
                  {/* Bear head */}
                  <circle cx="100" cy="100" r="40" fill="#F8E8D8" stroke="#D4A574" strokeWidth="2"/>
                  
                  {/* Ears */}
                  <circle cx="80" cy="75" r="15" fill="#F8E8D8" stroke="#D4A574" strokeWidth="2"/>
                  <circle cx="120" cy="75" r="15" fill="#F8E8D8" stroke="#D4A574" strokeWidth="2"/>
                  <circle cx="80" cy="75" r="8" fill="#FFB6C1"/>
                  <circle cx="120" cy="75" r="8" fill="#FFB6C1"/>
                  
                  {/* Eyes with tears */}
                  <circle cx="88" cy="95" r="4" fill="#87CEEB"/>
                  <circle cx="112" cy="95" r="4" fill="#87CEEB"/>
                  <ellipse cx="86" cy="102" rx="2" ry="8" fill="#87CEEB"/>
                  <ellipse cx="114" cy="102" rx="2" ry="8" fill="#87CEEB"/>
                  
                  {/* Nose */}
                  <ellipse cx="100" cy="105" rx="3" ry="2" fill="#333"/>
                  
                  {/* Mouth - sad */}
                  <path d="M 90 115 Q 100 110 110 115" stroke="#333" strokeWidth="2" fill="none"/>
                  
                  {/* Arms holding bottle */}
                  <ellipse cx="75" cy="135" rx="12" ry="20" fill="#F8E8D8" stroke="#D4A574" strokeWidth="2" transform="rotate(-20 75 135)"/>
                  <ellipse cx="125" cy="135" rx="12" ry="20" fill="#F8E8D8" stroke="#D4A574" strokeWidth="2" transform="rotate(20 125 135)"/>
                  
                  {/* Baby bottle */}
                  <rect x="95" y="130" width="10" height="25" fill="#E6E6FA" stroke="#9370DB" strokeWidth="2" rx="5"/>
                  <rect x="97" y="125" width="6" height="8" fill="#FFB6C1" stroke="#D4A574" strokeWidth="1" rx="3"/>
                </svg>
              </div>
              
              {/* Floating baby items */}
              <div className="absolute -top-4 -left-8">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center border-2 border-blue-300">
                  <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                </div>
              </div>
              
              <div className="absolute -top-8 right-0">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center border-2 border-purple-300">
                  <svg className="w-8 h-8 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12,2A8,8 0 0,1 20,10A8,8 0 0,1 12,18A8,8 0 0,1 4,10A8,8 0 0,1 12,2M12,4A6,6 0 0,0 6,10A6,6 0 0,0 12,16A6,6 0 0,0 18,10A6,6 0 0,0 12,4Z"/>
                  </svg>
                </div>
              </div>
              
              <div className="absolute -bottom-4 -right-8">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center border-2 border-yellow-300">
                  <svg className="w-8 h-8 text-yellow-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2Z"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-3">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800">
              Let's Begin the Journey
            </h1>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            <Button
              onClick={onSignInSignUp}
              className="w-full bg-pink-400 hover:bg-pink-500 text-white py-4 text-lg font-medium rounded-2xl"
              size="lg"
            >
              Sign In/ Sign Up
            </Button>

            <Button
              onClick={() => guestMutation.mutate()}
              disabled={guestMutation.isPending}
              variant="outline"
              className="w-full border-pink-300 text-pink-500 hover:bg-pink-50 py-4 text-lg font-medium rounded-2xl"
              size="lg"
            >
              {guestMutation.isPending ? 'Creating account...' : 'Continue As Guest'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}