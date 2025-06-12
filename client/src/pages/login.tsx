import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Eye, EyeOff, Mail, Lock, Facebook, Apple } from "lucide-react";
import { FaGoogle, FaWeixin } from "react-icons/fa";
import { Link } from "wouter";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;

interface LoginProps {
  onLoginSuccess: () => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginForm) => {
      const response = await apiRequest("POST", "/api/auth/login", data);
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Login successful!",
      });
      onLoginSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
    },
  });

  const guestMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/auth/guest");
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Logged in as guest!",
      });
      onLoginSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to create guest account",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LoginForm) => {
    loginMutation.mutate(data);
  };

  const handleGuestLogin = () => {
    guestMutation.mutate();
  };

  const handleSocialLogin = (provider: string) => {
    toast({
      title: "Coming Soon",
      description: `${provider} login will be available soon`,
    });
  };

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <Card className="w-full max-w-md glass-effect">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-800">
            Welcome Back
          </CardTitle>
          <p className="text-gray-600">Sign in to your account</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email/Password Form */}
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700">
                <Mail className="w-4 h-4 inline mr-2" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                className="rounded-xl border-gray-200"
                {...form.register("email")}
              />
              {form.formState.errors.email && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700">
                <Lock className="w-4 h-4 inline mr-2" />
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className="rounded-xl border-gray-200 pr-10"
                  {...form.register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-gray-400" />
                  ) : (
                    <Eye className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </div>
              {form.formState.errors.password && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full gradient-bg text-white rounded-2xl py-3"
            >
              {loginMutation.isPending ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          {/* Forgot Password Link */}
          <div className="text-center">
            <Link href="/forgot-password">
              <span className="text-pink-600 hover:text-pink-700 text-sm cursor-pointer">
                Forgot your password?
              </span>
            </Link>
          </div>

          <Separator className="my-6" />

          {/* Social Login Buttons */}
          <div className="space-y-3">
            <p className="text-center text-sm text-gray-600 mb-4">
              Or sign in with
            </p>
            
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => handleSocialLogin("Google")}
                className="rounded-xl border-gray-200 hover:bg-gray-50"
              >
                <FaGoogle className="w-4 h-4 text-red-500" />
              </Button>
              
              <Button
                variant="outline"
                onClick={() => handleSocialLogin("Facebook")}
                className="rounded-xl border-gray-200 hover:bg-gray-50"
              >
                <Facebook className="w-4 h-4 text-blue-600" />
              </Button>
              
              <Button
                variant="outline"
                onClick={() => handleSocialLogin("Apple")}
                className="rounded-xl border-gray-200 hover:bg-gray-50"
              >
                <Apple className="w-4 h-4 text-black" />
              </Button>
              
              <Button
                variant="outline"
                onClick={() => handleSocialLogin("WeChat")}
                className="rounded-xl border-gray-200 hover:bg-gray-50"
              >
                <FaWeixin className="w-4 h-4 text-green-500" />
              </Button>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Guest Login */}
          <Button
            onClick={handleGuestLogin}
            disabled={guestMutation.isPending}
            variant="outline"
            className="w-full rounded-2xl border-pink-300 text-pink-600 hover:bg-pink-50 py-3"
          >
            {guestMutation.isPending ? "Creating guest account..." : "Continue as Guest"}
          </Button>

          {/* Sign Up Link */}
          <div className="text-center">
            <span className="text-gray-600 text-sm">
              Don't have an account?{" "}
              <Link href="/signup">
                <span className="text-pink-600 hover:text-pink-700 cursor-pointer font-medium">
                  Sign up
                </span>
              </Link>
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}