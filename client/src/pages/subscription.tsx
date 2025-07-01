
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import Navigation from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Crown, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function Subscription() {
  const { user } = useAuth();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-4">
        <div className="flex items-center">
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 mr-3">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="text-white font-medium text-lg flex items-center">
            <Crown className="w-5 h-5 mr-2" />
            Premium Subscription
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mb-4">
              <Crown className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-xl">Premium Subscription</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              Subscription page coming soon! We're working hard to bring you the best premium experience.
            </p>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.history.back()}
            >
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>

      <Navigation />
    </div>
  );
}
