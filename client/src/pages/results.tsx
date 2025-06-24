
import { useEffect, useState } from "react";
import { useRoute } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ThumbsUp, ThumbsDown, Volume2 } from "lucide-react";
import { Link } from "wouter";
import Navigation from "@/components/navigation";
import { useToast } from "@/hooks/use-toast";

interface Recording {
  id: number;
  filename: string;
  duration: number;
  analysisResult?: {
    cryType: string;
    confidence: number;
    recommendations: string[];
    rawResult?: {
      class: string;
      probs: Record<string, number>;
      show: boolean;
    };
  };
  vote?: string;
  recordedAt: string;
}

interface CryReasonDescription {
  id: number;
  className: string;
  title: string;
  description: string;
  recommendations: string[];
}

export default function Results() {
  const [, params] = useRoute("/results/:id");
  const recordingId = params?.id;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [audioUrl, setAudioUrl] = useState<string>("");

  const { data: recording, isLoading } = useQuery({
    queryKey: ["recording", recordingId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/recordings/${recordingId}`);
      return response as Recording;
    },
    enabled: !!recordingId,
  });

  const { data: cryDescription } = useQuery({
    queryKey: ["cry-description", topClass],
    queryFn: async () => {
      if (!topClass) return null;
      const response = await apiRequest("GET", `/api/cry-reasons/${topClass}`);
      return response as CryReasonDescription;
    },
    enabled: !!topClass,
  });

  const voteMutation = useMutation({
    mutationFn: async ({ vote }: { vote: string }) => {
      return await apiRequest("POST", `/api/recordings/${recordingId}/vote`, { vote });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recording", recordingId] });
      toast({
        title: "Feedback Submitted",
        description: "Thank you for your feedback!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit feedback",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (recording?.filename) {
      setAudioUrl(`/api/audio/${recording.filename}`);
    }
  }, [recording]);

  if (isLoading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analysis results...</p>
        </div>
      </div>
    );
  }

  if (!recording) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <Card className="w-full max-w-md glass-effect">
          <CardContent className="text-center pt-6">
            <h2 className="text-xl font-semibold mb-4">Recording Not Found</h2>
            <Link href="/record">
              <Button className="gradient-bg text-white">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Recording
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const analysisResult = recording.analysisResult;
  const rawResult = analysisResult?.rawResult;
  const topClass = rawResult?.class || analysisResult?.cryType;
  const confidence = rawResult?.probs?.[topClass || ""] || analysisResult?.confidence || 0;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const sortedProbs = rawResult?.probs 
    ? Object.entries(rawResult.probs)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5) // Show top 5 predictions
    : [];

  return (
    <div className="min-h-screen gradient-bg">
      <div className="container mx-auto px-4 py-6 pb-20">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/record">
            <Button variant="ghost" size="sm" className="text-gray-600">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">Analysis Results</h1>
          <div></div>
        </div>

        <div className="space-y-6">
          {/* Recording Info */}
          <Card className="glass-effect">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Recording Details</span>
                {audioUrl && (
                  <audio controls className="max-w-xs">
                    <source src={audioUrl} type="audio/mp4" />
                    <source src={audioUrl} type="audio/wav" />
                    <source src={audioUrl} type="audio/mp3" />
                    Your browser does not support the audio element.
                  </audio>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Duration:</span>
                  <span className="ml-2 font-medium">
                    {recording.duration ? formatTime(recording.duration) : "Unknown"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Recorded:</span>
                  <span className="ml-2 font-medium">
                    {formatDate(recording.recordedAt)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Analysis Result */}
          {cryDescription && (
            <Card className="glass-effect">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Primary Analysis</span>
                  <Badge variant="secondary" className="bg-pink-100 text-pink-800">
                    {Math.round(confidence * 100)}% confidence
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    {cryDescription.title}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {cryDescription.description}
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">
                    Recommendations:
                  </h4>
                  <ul className="space-y-2">
                    {cryDescription.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-pink-600 mr-2">•</span>
                        <span className="text-gray-700">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}

          {/* All Predictions */}
          {sortedProbs.length > 0 && (
            <Card className="glass-effect">
              <CardHeader>
                <CardTitle>All Predictions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sortedProbs.map(([className, probability]) => (
                    <div key={className} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="capitalize text-gray-700">
                          {className.replace(/_/g, ' ')}
                        </span>
                        <span className="font-medium">
                          {Math.round(probability * 100)}%
                        </span>
                      </div>
                      <Progress 
                        value={probability * 100} 
                        className="h-2"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Feedback */}
          <Card className="glass-effect">
            <CardHeader>
              <CardTitle>Was this analysis helpful?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 justify-center">
                <Button
                  variant={recording.vote === "good" ? "default" : "outline"}
                  onClick={() => voteMutation.mutate({ vote: "good" })}
                  disabled={voteMutation.isPending}
                  className="flex-1"
                >
                  <ThumbsUp className="w-4 h-4 mr-2" />
                  Helpful
                </Button>
                <Button
                  variant={recording.vote === "bad" ? "default" : "outline"}
                  onClick={() => voteMutation.mutate({ vote: "bad" })}
                  disabled={voteMutation.isPending}
                  className="flex-1"
                >
                  <ThumbsDown className="w-4 h-4 mr-2" />
                  Not Helpful
                </Button>
              </div>
              {recording.vote && (
                <p className="text-center text-sm text-gray-600 mt-3">
                  Thank you for your feedback!
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Navigation />
    </div>
  );
}
