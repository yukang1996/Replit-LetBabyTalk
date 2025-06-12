import { useEffect, useState } from "react";
import { useLanguage } from "@/hooks/useLanguage";

interface AdsProps {
  onComplete: () => void;
}

export default function Ads({ onComplete }: AdsProps) {
  const [countdown, setCountdown] = useState(5);
  const { t } = useLanguage();

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onComplete]);

  const handleSkip = () => {
    onComplete();
  };

  return (
    <div className="min-h-screen gradient-bg flex flex-col items-center justify-center p-4">
      <div className="text-center text-white">
        <div className="w-64 h-64 bg-white/20 rounded-lg flex items-center justify-center mb-8">
          <div className="text-6xl">📱</div>
        </div>
        <h1 className="text-2xl font-bold mb-4">LetBabyTalk Premium</h1>
        <p className="text-lg mb-8 opacity-90">
          Unlock advanced features and unlimited recordings
        </p>
        <div className="flex flex-col space-y-4">
          <div className="text-sm opacity-75">
            Advertisement ends in {countdown} seconds
          </div>
          <button
            onClick={handleSkip}
            className="text-white underline hover:opacity-80 transition-opacity"
          >
            Skip Ad
          </button>
        </div>
      </div>
    </div>
  );
}