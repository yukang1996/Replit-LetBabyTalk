import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Baby, 
  Globe, 
  HelpCircle, 
  CreditCard, 
  FileText, 
  Shield, 
  Phone 
} from "lucide-react";

export default function Settings() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  if (isLoading || !isAuthenticated) {
    return null;
  }

  const settingsItems = [
    {
      icon: User,
      label: "Account",
      onClick: () => console.log("Account settings"),
    },
    {
      icon: Baby,
      label: "Baby Profile",
      onClick: () => console.log("Baby profile settings"),
    },
    {
      icon: Globe,
      label: "Language",
      onClick: () => console.log("Language settings"),
    },
    {
      icon: HelpCircle,
      label: "User Guide",
      onClick: () => console.log("User guide"),
    },
    {
      icon: CreditCard,
      label: "Subscription",
      onClick: () => console.log("Subscription settings"),
    },
    {
      icon: FileText,
      label: "Terms and Conditions",
      onClick: () => console.log("Terms and conditions"),
    },
    {
      icon: Shield,
      label: "Privacy Policy",
      onClick: () => console.log("Privacy policy"),
    },
    {
      icon: Phone,
      label: "Contact Us",
      onClick: () => console.log("Contact us"),
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="gradient-bg p-4 text-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-16 h-16 bg-white rounded-full overflow-hidden">
            {user?.profileImageUrl ? (
              <img 
                src={user.profileImageUrl} 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-pink-300 to-purple-300 flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
            )}
          </div>
          <div>
            <h2 className="text-white font-medium text-lg">
              {user?.firstName || user?.email || "User"}
            </h2>
          </div>
        </div>
      </div>

      {/* Settings List */}
      <div className="p-4 pb-20">
        <Card className="glass-effect">
          <CardContent className="p-0">
            {settingsItems.map((item, index) => (
              <div key={item.label}>
                <Button
                  variant="ghost"
                  className="w-full justify-start p-4 h-auto text-left hover:bg-pink-50"
                  onClick={item.onClick}
                >
                  <item.icon className="w-5 h-5 text-pink-500 mr-4" />
                  <span className="text-gray-700 font-medium">{item.label}</span>
                </Button>
                {index < settingsItems.length - 1 && <Separator />}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Logout Button */}
        <div className="mt-6">
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full border-red-300 text-red-600 hover:bg-red-50 rounded-2xl py-3"
          >
            Sign Out
          </Button>
        </div>
      </div>

      <Navigation />
    </div>
  );
}
