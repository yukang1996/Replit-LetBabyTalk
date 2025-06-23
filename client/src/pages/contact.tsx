
import { useState } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Star, StarIcon } from "lucide-react";

export default function Contact() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [rating, setRating] = useState<number>(0);
  const [feedback, setFeedback] = useState<string>("");

  const submitFeedbackMutation = useMutation({
    mutationFn: async (data: { rating: number; feedback: string }) => {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Feedback Submitted",
        description: "Thank you for your feedback! We appreciate your input.",
      });
      setRating(0);
      setFeedback("");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (rating === 0) {
      toast({
        title: "Rating Required",
        description: "Please provide a rating before submitting.",
        variant: "destructive",
      });
      return;
    }
    
    submitFeedbackMutation.mutate({ rating, feedback });
  };

  const socialLinks = [
    {
      name: "Instagram",
      url: "https://instagram.com/letbabytalk",
      icon: "📷",
      color: "bg-gradient-to-r from-purple-400 to-pink-400"
    },
    {
      name: "Facebook",
      url: "https://facebook.com/letbabytalk",
      icon: "📘",
      color: "bg-blue-500"
    },
    {
      name: "LinkedIn",
      url: "https://linkedin.com/company/letbabytalk",
      icon: "💼",
      color: "bg-blue-600"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      {/* Header */}
      <div className="gradient-bg p-4 flex items-center">
        <Link href="/settings">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-white hover:bg-white/20 mr-3"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <span className="text-white font-medium text-lg">
          Contact Us
        </span>
      </div>

      {/* Main Content */}
      <div className="p-4">
        <Card className="w-full max-w-md mx-auto glass-effect">
          <CardContent className="p-6 space-y-6">
            {/* Contact Info */}
            <div className="text-center space-y-2">
              <p className="text-gray-600 text-sm">
                If you have any questions, please contact us at
              </p>
              <a 
                href="mailto:lettingbabytalk@gmail.com"
                className="text-pink-500 font-medium text-sm hover:underline"
              >
                lettingbabytalk@gmail.com
              </a>
            </div>

            {/* Rating Section */}
            <div className="space-y-3">
              <p className="text-gray-700 font-medium text-sm">
                How would you rate your experience?
              </p>
              <div className="flex justify-center space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="transition-colors duration-200"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= rating
                          ? "fill-pink-400 text-pink-400"
                          : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Feedback Section */}
            <div className="space-y-3">
              <p className="text-gray-700 font-medium text-sm">
                Do you have any suggestions or feedback?
              </p>
              <Textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Share your thoughts, suggestions, or feedback..."
                className="min-h-[120px] resize-none rounded-2xl border-gray-200 focus:border-pink-300 focus:ring-pink-300"
              />
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={submitFeedbackMutation.isPending || rating === 0}
              className="w-full gradient-bg text-white rounded-2xl py-3 font-medium"
            >
              {submitFeedbackMutation.isPending ? "Submitting..." : "Submit Feedback"}
            </Button>

            {/* Social Media Links */}
            <div className="pt-4">
              <div className="flex justify-center space-x-8">
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center space-y-2 group"
                  >
                    <div className={`w-12 h-12 ${social.color} rounded-full flex items-center justify-center text-white text-xl group-hover:scale-110 transition-transform duration-200`}>
                      {social.icon}
                    </div>
                    <span className="text-xs text-gray-600 group-hover:text-gray-800">
                      {social.name}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
