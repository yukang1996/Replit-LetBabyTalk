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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ArrowLeft, Mail, Send, CheckCircle } from "lucide-react";
import { Link, useLocation } from "wouter";
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
  const [, navigate] = useLocation();
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [sentEmail, setSentEmail] = useState("");

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
      setSentEmail(email);
      setShowSuccessDialog(true);
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
            <Button 
              variant="ghost" 
              size="sm" 
              className="absolute left-4 top-4"
              onClick={() => navigate("/signin")}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
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
              <span 
                className="text-pink-600 hover:text-pink-700 cursor-pointer font-medium"
                onClick={() => navigate("/signin")}
              >
                Sign in
              </span>
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Custom Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <DialogTitle className="text-xl font-bold text-gray-800">
              Email Sent Successfully!
            </DialogTitle>
            <DialogDescription className="text-gray-600 mt-2">
              We've sent password reset instructions to <strong>{sentEmail}</strong>. 
              Please check your email and follow the instructions to reset your password.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-6">
            <Button
              onClick={() => {
                setShowSuccessDialog(false);
                onSubmitSuccess(sentEmail);
              }}
              className="w-full gradient-bg text-white rounded-2xl py-3"
            >
              Continue to Verification
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowSuccessDialog(false);
                navigate("/signin");
              }}
              className="w-full border-pink-300 text-pink-600 rounded-2xl py-3"
            >
              Back to Sign In
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}