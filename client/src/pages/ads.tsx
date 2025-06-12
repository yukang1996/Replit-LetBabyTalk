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
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleSkip = () => {
    onComplete();
  };

  const handleAdClick = () => {
    // Navigate to premium page or external link
    window.open('https://letbabytalk.com/premium', '_blank');
  };

  return (
    <div className="min-h-screen gradient-bg flex flex-col items-center justify-center p-4">
      <div className="text-center text-white">
        <div 
          className="w-64 h-64 bg-white/20 rounded-lg flex items-center justify-center mb-8 cursor-pointer hover:bg-white/30 transition-colors"
          onClick={handleAdClick}
        >
          <div className="text-6xl">📱</div>
        </div>
        <h1 className="text-2xl font-bold mb-4">LetBabyTalk Premium</h1>
        <p className="text-lg mb-8 opacity-90">
          Unlock advanced features and unlimited recordings
        </p>
        <button
          onClick={handleAdClick}
          className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-lg mb-6 transition-colors"
        >
          Learn More About Premium
        </button>
        <div className="flex flex-col space-y-4">
          <div className="text-sm opacity-75">
            {countdown > 0 ? `Skip available in ${countdown} seconds` : "You can skip this ad"}
          </div>
          {countdown === 0 && (
            <button
              onClick={handleSkip}
              className="text-white underline hover:opacity-80 transition-opacity"
            >
              Skip Ad
            </button>
          )}
        </div>
      </div>
    </div>
  );
}