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
import { ArrowLeft, Mail, Send } from "lucide-react";
import { Link } from "wouter";
import { z } from "zod";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email"),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

interface ForgotPasswordProps {
  onSubmitSuccess: (email: string) => void;
}

export default function ForgotPassword({ onSubmitSuccess }: ForgotPasswordProps) {
  const { toast } = useToast();
  const { t } = useLanguage();

  const form = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: async (data: ForgotPasswordForm) => {
      const response = await apiRequest("POST", "/api/auth/forgot-password", data);
      return response;
    },
    onSuccess: (response) => {
      const email = form.getValues("email");
      console.log('Forgot password response:', response);
      toast({
        title: "Email Sent",
        description: "If the email exists, a reset link has been sent",
      });
      onSubmitSuccess(email);
    },
    onError: (error: any) => {
      console.error('Forgot password error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send reset email",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ForgotPasswordForm) => {
    forgotPasswordMutation.mutate(data);
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
          <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-pink-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-800">
            Forgot Password?
          </CardTitle>
          <p className="text-gray-600">
            Enter your email address and we'll send you a link to reset your password
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700">
                <Mail className="w-4 h-4 inline mr-2" />
                Email Address
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

            <Button
              type="submit"
              disabled={forgotPasswordMutation.isPending}
              className="w-full gradient-bg text-white rounded-2xl py-3 mt-6"
            >
              {forgotPasswordMutation.isPending ? (
                "Sending..."
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Reset Link
                </>
              )}
            </Button>
          </form>

          <div className="text-center mt-6">
            <span className="text-gray-600 text-sm">
              Remember your password?{" "}
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