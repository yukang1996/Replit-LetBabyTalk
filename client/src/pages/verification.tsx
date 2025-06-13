import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { ArrowLeft, Mail, CheckCircle } from "lucide-react";
import { Link } from "wouter";

interface VerificationProps {
  email?: string;
  type: "signup" | "forgot-password";
  onVerificationSuccess: () => void;
}

export default function Verification({ email, type, onVerificationSuccess }: VerificationProps) {
  const [code, setCode] = useState("");
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

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

  const handleVerify = () => {
    if (code.length === 6) {
      // Simulate verification success
      setTimeout(() => {
        onVerificationSuccess();
      }, 1000);
    }
  };

  const handleResend = () => {
    setCanResend(false);
    setCountdown(60);
    // Simulate resending code
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
            <Link href={type === "signup" ? "/signup" : "/forgot-password"}>
              <Button variant="ghost" size="sm" className="absolute left-4 top-4">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
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
          {email && (
            <p className="text-pink-600 text-sm font-medium">
              {email}
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
    </div>
  );
}