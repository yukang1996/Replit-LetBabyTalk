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
import { Eye, EyeOff, Mail, Lock, ArrowLeft } from "lucide-react";
import { Link, useLocation } from "wouter";
import { z } from "zod";
import PhoneInput from "@/components/phone-input";

const signupSchema = z.object({
  email: z.string().optional(),
  phone: z.string().optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
}).refine((data) => {
  if (data.email && data.email.length > 0) {
    return z.string().email().safeParse(data.email).success;
  }
  if (data.phone && data.phone.length > 0) {
    return data.phone.length >= 10;
  }
  return data.email || data.phone;
}, {
  message: "Please enter a valid email or phone number",
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
  const [, navigate] = useLocation();

  const form = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    },
    mode: "onChange",
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
        description: "Account created successfully! Please sign in.",
      });
      // Redirect to sign-in page
      navigate("/signin");
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
    // Clear the field that's not being used based on auth type
    const submitData = { ...data };
    if (authType === "email") {
      delete submitData.phone;
    } else {
      delete submitData.email;
    }
    console.log('Submitting signup data:', submitData);
    signupMutation.mutate(submitData);
  };

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <Card className="w-full max-w-sm sm:max-w-md lg:max-w-lg glass-effect">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Link href="/signin">
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

            {/* Authentication Type Toggle */}
            <div className="flex space-x-2 mb-4">
              <Button
                type="button"
                variant={authType === "email" ? "default" : "outline"}
                onClick={() => {
                  setAuthType("email");
                  form.setValue("phone", "");
                  form.clearErrors("phone");
                }}
                className="flex-1"
              >
                <Mail className="w-4 h-4 mr-2" />
                Email
              </Button>
              <Button
                type="button"
                variant={authType === "phone" ? "default" : "outline"}
                onClick={() => {
                  setAuthType("phone");
                  form.setValue("email", "");
                  form.clearErrors("email");
                }}
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
            <span className="text-gray-600 text-sm">
              Already have an account?{" "}
              <Link href="/signin">
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