import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import BearMascot from "@/components/bear-mascot";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  const handleGuestMode = () => {
    // Implement guest mode functionality
    console.log("Continue as guest");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md glass-effect">
        <CardContent className="pt-6 text-center">
          <div className="mb-8">
            <BearMascot size="large" className="mx-auto bear-float" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-800 mb-2">LetBabyTalk</h1>
          <p className="text-gray-600 mb-8">Your Personalized Parenting Assistant</p>
          
          <div className="space-y-4 mb-6">
            <div className="flex items-center text-sm text-gray-600">
              <span className="w-2 h-2 bg-primary rounded-full mr-3"></span>
              Better understand your baby's needs
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <span className="w-2 h-2 bg-primary rounded-full mr-3"></span>
              Explain the reason why baby cries
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <span className="w-2 h-2 bg-primary rounded-full mr-3"></span>
              Provide personalized advice
            </div>
          </div>
          
          <Button 
            onClick={handleLogin}
            className="w-full gradient-bg text-white font-medium py-3 rounded-2xl mb-4 hover:opacity-90 transition-opacity"
          >
            Get Started
          </Button>
          
          <Button 
            variant="outline"
            onClick={handleGuestMode}
            className="w-full border-primary text-primary hover:bg-primary/5 rounded-2xl"
          >
            Continue As Guest
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
