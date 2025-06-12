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
import { Eye, EyeOff, Mail, Lock, User, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { z } from "zod";
import PhoneInput from "@/components/phone-input";

const signupSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email").optional(),
  phone: z.string().min(10, "Please enter a valid phone number").optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
}).refine((data) => data.email || data.phone, {
  message: "Either email or phone number is required",
  path: ["email"],
});

type SignupForm = z.infer<typeof signupSchema>;

interface SignupProps {
  onSignupSuccess: () => void;
}

export default function Signup({ onSignupSuccess }: SignupProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [authType, setAuthType] = useState<"email" | "phone">("email");
  const { toast } = useToast();
  const { t } = useLanguage();

  const form = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    },
  });

  const signupMutation = useMutation({
    mutationFn: async (data: SignupForm) => {
      const { confirmPassword, ...signupData } = data;
      const response = await apiRequest("POST", "/api/auth/register", signupData);
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Account Created",
        description: "Please check your email for verification",
      });
      onSignupSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Signup Failed",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SignupForm) => {
    signupMutation.mutate(data);
  };

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <Card className="w-full max-w-md glass-effect">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="absolute left-4 top-4">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-800">
            Create Account
          </CardTitle>
          <p className="text-gray-600">Join LetBabyTalk community</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-gray-700">
                  <User className="w-4 h-4 inline mr-2" />
                  First Name
                </Label>
                <Input
                  id="firstName"
                  placeholder="First name"
                  className="rounded-xl border-gray-200"
                  {...form.register("firstName")}
                />
                {form.formState.errors.firstName && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.firstName.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-gray-700">
                  Last Name
                </Label>
                <Input
                  id="lastName"
                  placeholder="Last name"
                  className="rounded-xl border-gray-200"
                  {...form.register("lastName")}
                />
                {form.formState.errors.lastName && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.lastName.message}
                  </p>
                )}
              </div>
            </div>

            {/* Authentication Type Toggle */}
            <div className="flex space-x-2 mb-4">
              <Button
                type="button"
                variant={authType === "email" ? "default" : "outline"}
                onClick={() => setAuthType("email")}
                className="flex-1"
              >
                <Mail className="w-4 h-4 mr-2" />
                Email
              </Button>
              <Button
                type="button"
                variant={authType === "phone" ? "default" : "outline"}
                onClick={() => setAuthType("phone")}
                className="flex-1"
              >
                📱 Phone
              </Button>
            </div>

            {/* Email or Phone Input */}
            {authType === "email" ? (
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
            ) : (
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-gray-700">
                  📱 Phone Number
                </Label>
                <PhoneInput
                  value={form.watch("phone") || ""}
                  onChange={(value) => form.setValue("phone", value)}
                  placeholder="Enter your phone number"
                  className="rounded-xl"
                />
                {form.formState.errors.phone && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.phone.message}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700">
                <Lock className="w-4 h-4 inline mr-2" />
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create password"
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

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-gray-700">
                <Lock className="w-4 h-4 inline mr-2" />
                Confirm Password
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm password"
                  className="rounded-xl border-gray-200 pr-10"
                  {...form.register("confirmPassword")}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4 text-gray-400" />
                  ) : (
                    <Eye className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </div>
              {form.formState.errors.confirmPassword && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={signupMutation.isPending}
              className="w-full gradient-bg text-white rounded-2xl py-3 mt-6"
            >
              {signupMutation.isPending ? "Creating account..." : "Create Account"}
            </Button>
          </form>

          <div className="text-center mt-6">
            <Button
              type="button"
              variant="outline"
              className="w-full mb-4"
              onClick={() => {
                // Create guest account
                fetch("/api/auth/guest", { method: "POST" })
                  .then(response => response.json())
                  .then(() => {
                    localStorage.setItem("onboardingCompleted", "true");
                    window.location.href = "/";
                  })
                  .catch(() => {
                    toast({
                      title: "Error",
                      description: "Failed to create guest account",
                      variant: "destructive",
                    });
                  });
              }}
            >
              Continue as Guest
            </Button>
            
            <span className="text-gray-600 text-sm">
              Already have an account?{" "}
              <Link href="/login">
                <span className="text-pink-600 hover:text-pink-700 cursor-pointer font-medium">
                  Sign in
                </span>
              </Link>
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}