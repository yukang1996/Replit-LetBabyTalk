import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { ArrowLeft, Mail, CheckCircle, AlertCircle } from "lucide-react";
import { Link, useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";

interface VerificationProps {
  email?: string;
  phone?: string;
  type: "signup" | "forgot-password";
  onVerificationSuccess: () => void;
  onBackToForgotPassword?: () => void;
}

export default function Verification({ email, phone, type, onVerificationSuccess, onBackToForgotPassword }: VerificationProps) {
  const [code, setCode] = useState("");
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [, navigate] = useLocation();

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleVerify = async () => {
    if (code.length === 6) {
      try {
        await apiRequest('POST', '/api/auth/verify-otp', {
          email,
          phone,
          code,
          type,
        });
        
        onVerificationSuccess();
      } catch (error: any) {
        console.error('Verification failed:', error.message);
        setErrorMessage(error.message || 'Invalid verification code');
        setShowErrorDialog(true);
        setCode(""); // Clear the code
      }
    }
  };

  const handleResend = async () => {
    try {
      setCanResend(false);
      setCountdown(60);
      
      // Start countdown timer
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Actually resend the code
      if (type === "forgot-password") {
        const requestData: any = {};
        if (email) requestData.email = email;
        if (phone) requestData.phone = phone;
        await apiRequest('POST', '/api/auth/forgot-password', requestData);
      }
      
      console.log('Code resent successfully');
    } catch (error: any) {
      console.error('Failed to resend code:', error);
      setCanResend(true);
      setCountdown(0);
    }
  };

  const title = type === "signup" ? "Verify Your Email" : "Enter Verification Code";
  const description = type === "signup" 
    ? "We've sent a verification code to your email address"
    : "We've sent a password reset code to your email address";

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <Card className="w-full max-w-md glass-effect">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Button 
              variant="ghost" 
              size="sm" 
              className="absolute left-4 top-4"
              onClick={(e) => {
                e.preventDefault();
                if (onBackToForgotPassword) {
                  onBackToForgotPassword();
                } else {
                  navigate("/forgot-password");
                }
              }}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </div>
          <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-pink-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-800">
            {title}
          </CardTitle>
          <p className="text-gray-600 text-sm">
            {description}
          </p>
          {(email || phone) && (
            <p className="text-pink-600 text-sm font-medium">
              {email || phone}
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={code}
                onChange={(value) => setCode(value)}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>

            <Button
              onClick={handleVerify}
              disabled={code.length !== 6}
              className="w-full gradient-bg text-white rounded-2xl py-3"
            >
              {code.length === 6 ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Verify Code
                </>
              ) : (
                "Enter 6-digit code"
              )}
            </Button>
          </div>

          <div className="text-center">
            <p className="text-gray-600 text-sm mb-2">
              Didn't receive the code?
            </p>
            {canResend ? (
              <Button
                onClick={handleResend}
                variant="ghost"
                className="text-pink-600 hover:text-pink-700"
              >
                Resend Code
              </Button>
            ) : (
              <p className="text-gray-500 text-sm">
                Resend available in {countdown}s
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Custom Error Dialog */}
      <Dialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
            </div>
            <DialogTitle className="text-xl font-bold text-gray-800">
              Verification Failed
            </DialogTitle>
            <DialogDescription className="text-gray-600 mt-2">
              Invalid verification code
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-6">
            <Button
              onClick={(e) => {
                e.preventDefault();
                setShowErrorDialog(false);
              }}
              className="w-full gradient-bg text-white rounded-2xl py-3"
            >
              Try Again
            </Button>
            <Button
              variant="outline"
              onClick={(e) => {
                e.preventDefault();
                setShowErrorDialog(false);
                handleResend();
              }}
              className="w-full border-pink-300 text-pink-600 rounded-2xl py-3"
            >
              Resend Code
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}