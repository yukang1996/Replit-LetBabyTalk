import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { useBabySelection } from "@/hooks/useBabySelection";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import AudioRecorder from "@/components/audio-recorder";
import BearMascot from "@/components/bear-mascot";
import { Link, useLocation } from "wouter";

export default function Home() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const { t } = useLanguage();
  const { selectedBaby } = useBabySelection();
  const [, navigate] = useLocation();

  const { data: profiles = [] } = useQuery({
    queryKey: ["/api/baby-profiles"],
    enabled: isAuthenticated,
  });

  // Get the first/selected baby profile
  // const selectedBaby = profiles.length > 0 ? profiles[0] : null;

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: t("error.unauthorized"),
        description: t("error.unauthorized"),
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast, t]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <BearMascot size="medium" className="mx-auto bear-float mb-4" />
          <p className="text-gray-600">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="gradient-bg p-4 flex items-center justify-between">
        <Link href="/baby-selection?from=/record">
          <div className="flex items-center space-x-3 cursor-pointer">
            <BearMascot size="small" baby={selectedBaby} />
            <span className="text-white font-medium">
              {selectedBaby ? selectedBaby.name : t("home.enterBabyInfo")}
            </span>
          </div>
        </Link>
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/20"
          onClick={() => navigate("/subscription?from=/")}
        >
          {t("home.premium")}
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] p-4">
        <Card className="w-full max-w-md glass-effect">
          <CardContent className="pt-8 pb-8">
            <AudioRecorder />
          </CardContent>
        </Card>
      </div>

      <Navigation />
    </div>
  );
}
