import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ThumbsUp, ThumbsDown, Clock, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BearMascot from "@/components/bear-mascot";

interface Recording {
  id: number;
  analysisResult?: Record<string, number>;
  predictClass?: string;
  rateState?: string;
  duration?: number;
  recordedAt: string;
}

interface CryReasonDescription {
  id: number;
  className: string;
  title: string;
  description: string;
  recommendations: string[];
  createdAt: string;
  updatedAt: string;
}

interface ResultsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  recordingId: number | null;
}

export default function ResultsDialog({ isOpen, onClose, recordingId }: ResultsDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCorrectionSelector, setShowCorrectionSelector] = useState(false);
  const [selectedCorrection, setSelectedCorrection] = useState<string>("");

  const { data: recording, isLoading } = useQuery<Recording>({
    queryKey: ["/api/recordings", recordingId],
    queryFn: async () => {
      if (!recordingId) throw new Error("No recording ID");
      return await apiRequest("GET", `/api/recordings/${recordingId}`);
    },
    enabled: !!recordingId && isOpen,
  });

  // Get cry reason description for the predicted class
  const { data: mainCryReason, isLoading: isLoadingCryReason } = useQuery<CryReasonDescription>({
    queryKey: ["/api/cry-reasons", recording?.predictClass],
    queryFn: async () => {
      if (!recording?.predictClass) throw new Error("No predicted class");
      console.log("Fetching cry reason for class:", recording.predictClass);
      return await apiRequest("GET", `/api/cry-reasons/${recording.predictClass}`);
    },
    enabled: !!recording?.predictClass,
  });

  // Get all cry reasons for the correction selector
  const { data: allCryReasons = [], isError: allCryReasonsError } = useQuery<CryReasonDescription[]>({
    queryKey: ["/api/cry-reasons"],
    queryFn: async () => {
      console.log("Fetching all cry reasons...");
      const result = await apiRequest("GET", "/api/cry-reasons");
      console.log("All cry reasons result:", result);
      // Ensure we always return an array
      return Array.isArray(result) ? result : [];
    },
    enabled: showCorrectionSelector,
  });

  const rateMutation = useMutation({
    mutationFn: async (rateData: { rateState: string; rateReason?: string }) => {
      return await apiRequest("POST", `/api/recordings/${recordingId}/rate`, rateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recordings", recordingId] });
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

  const handleRate = (rateState: string) => {
    if (rateState === 'bad') {
      setShowCorrectionSelector(true);
    } else {
      rateMutation.mutate({ rateState });
    }
  };

  const handleCorrection = () => {
    if (selectedCorrection) {
      rateMutation.mutate({ 
        rateState: 'bad', 
        rateReason: `User corrected to: ${selectedCorrection}` 
      });
      setShowCorrectionSelector(false);
      setSelectedCorrection("");
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getCryIcon = (className: string) => {
    const iconMap: Record<string, string> = {
      'hunger_food': '🍼',
      'hunger_milk': '🍼',
      'sleepiness': '😴',
      'lack_of_security': '🤗',
      'diaper_urine': '💧',
      'diaper_bowel': '💩',
      'internal_pain': '😢',
      'external_pain': '😣',
      'physical_discomfort': '😫',
      'unmet_needs': '😰',
      'breathing_difficulties': '😤',
      'normal': '😊',
      'no_cry_detected': '🤫',
      'unknown': '❓',
    };
    return iconMap[className] || '❓';
  };

  const getOtherProbabilities = () => {
    if (!recording?.analysisResult || !recording?.predictClass) return [];

    return Object.entries(recording.analysisResult)
      .filter(([key]) => key !== recording.predictClass)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3);
  };

  if (!isOpen) return null;

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center py-8">
            <p className="text-gray-500">Loading analysis results...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!recording) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">Recording not found</p>
            <Button onClick={onClose}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  console.log("=== RESULTS DIALOG DEBUG ===");
  console.log("Recording ID:", recordingId);
  console.log("Recording data:", recording);
  console.log("Predicted class:", recording?.predictClass);
  console.log("All cry reasons:", allCryReasons);
  console.log("Main cry reason:", mainCryReason);
  console.log("Is loading recording:", isLoading);
  console.log("Is loading cry reason:", isLoadingCryReason);
  console.log("Recording error:", null);
  console.log("=== END DEBUG ===");

  const mainProbability = recording.analysisResult?.[recording.predictClass || 'unknown'] || 0;
  const otherProbs = getOtherProbabilities();

   if (!recording.analysisResult && !recording.predictClass) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No analysis results available for this recording.</p>
            <Button onClick={onClose}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-lg font-semibold">Analysis Results</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Section 1: Main Result with Large Icon and Probability */}
          <div className="text-center">
            <div className="w-32 h-32 mx-auto mb-4 bg-white rounded-3xl border-4 border-blue-200 flex items-center justify-center shadow-lg">
              <div className="text-6xl">
                {getCryIcon(recording.predictClass || 'unknown')}
              </div>
            </div>

            <div className="text-4xl font-bold text-gray-800 mb-3">
              {Math.round(mainProbability * 100)}%
            </div>

            <div className="flex items-center justify-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                {mainCryReason?.title || recording.predictClass?.replace(/_/g, ' ') || 'Unknown'}
              </h2>
            </div>

            <div className="flex items-center justify-center text-sm text-gray-500">
              <Clock className="w-4 h-4 mr-1" />
              <span>Recorded at {formatTime(recording.recordedAt)}</span>
            </div>
          </div>

          {/* Section 2: Other Probabilities */}
          {otherProbs.length > 0 && (
            <Card className="glass-effect">
              <CardHeader>
                <CardTitle className="text-base">Other Possibilities</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {otherProbs.map(([key, prob]) => (
                  <div key={key} className="flex items-center justify-between py-2">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{getCryIcon(key)}</span>
                      <span className="text-gray-700 font-medium">
                        {key.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase())}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-600 font-bold">
                        {Math.round(prob * 100)}%
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Section 3: Explanation */}
          {isLoadingCryReason ? (
            <Card className="glass-effect">
              <CardHeader>
                <CardTitle className="text-base text-gray-800">Explanation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500 text-sm">Loading explanation...</p>
              </CardContent>
            </Card>
          ) : mainCryReason ? (
            <Card className="glass-effect">
              <CardHeader>
                <CardTitle className="text-base text-gray-800">Explanation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 leading-relaxed text-sm">
                  {mainCryReason.description}
                </p>
              </CardContent>
            </Card>
          ) : recording?.predictClass ? (
            <Card className="glass-effect">
              <CardHeader>
                <CardTitle className="text-base text-gray-800">Explanation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500 text-sm">
                  No detailed explanation available for {recording.predictClass.replace(/_/g, ' ')}.
                </p>
              </CardContent>
            </Card>
          ) : null}

          {/* Section 4: Recommendations */}
          {isLoadingCryReason ? (
            <Card className="glass-effect">
              <CardHeader>
                <CardTitle className="text-base text-gray-800">Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500 text-sm">Loading recommendations...</p>
              </CardContent>
            </Card>
          ) : mainCryReason && mainCryReason.recommendations && mainCryReason.recommendations.length > 0 ? (
            <Card className="glass-effect">
              <CardHeader>
                <CardTitle className="text-base text-gray-800">Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {mainCryReason.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <span className="text-pink-500 mt-1">•</span>
                      <span className="text-gray-600 text-sm">{rec}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : recording?.predictClass ? (
            <Card className="glass-effect">
              <CardHeader>
                <CardTitle className="text-base text-gray-800">Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500 text-sm">
                  No specific recommendations available for {recording.predictClass.replace(/_/g, ' ')}.
                </p>
              </CardContent>
            </Card>
          ) : null}

          {/* Section 5: Rating and Correction */}
          <Card className="glass-effect">
            <CardContent className="p-4">
              {!showCorrectionSelector ? (
                <>
                  <h3 className="text-base font-medium text-gray-800 text-center mb-4">
                    Rate the prediction accuracy
                  </h3>
                  <div className="flex justify-center space-x-6">
                    <Button
                      variant={recording.rateState === 'good' ? 'default' : 'outline'}
                      size="lg"
                      className={`rounded-full w-16 h-16 shadow-lg transition-all ${
                        recording.rateState === 'good' 
                          ? 'bg-pink-500 hover:bg-pink-600 scale-105' 
                          : 'border-2 border-pink-300 hover:bg-pink-50 hover:scale-105'
                      }`}
                      onClick={() => handleRate('good')}
                      disabled={rateMutation.isPending || !!recording.rateState}
                    >
                      <ThumbsUp className={`w-6 h-6 ${
                        recording.rateState === 'good' ? 'text-white' : 'text-pink-500'
                      }`} />
                    </Button>

                    <Button
                      variant={recording.rateState === 'bad' ? 'default' : 'outline'}
                      size="lg"
                      className={`rounded-full w-16 h-16 shadow-lg transition-all ${
                        recording.rateState === 'bad' 
                          ? 'bg-blue-500 hover:bg-blue-600 scale-105' 
                          : 'border-2 border-blue-300 hover:bg-blue-50 hover:scale-105'
                      }`}
                      onClick={() => handleRate('bad')}
                      disabled={rateMutation.isPending || !!recording.rateState}
                    >
                      <ThumbsDown className={`w-6 h-6 ${
                        recording.rateState === 'bad' ? 'text-white' : 'text-blue-500'
                      }`} />
                    </Button>
                  </div>

                  {recording.rateState && (
                    <p className="text-center text-sm text-gray-500 mt-4">
                      Thank you for your feedback!
                    </p>
                  )}

                  {rateMutation.isPending && (
                    <p className="text-center text-sm text-gray-500 mt-4">
                      Recording your feedback...
                    </p>
                  )}
                </>
              ) : (
                <>
                  <h3 className="text-base font-medium text-gray-800 text-center mb-4">
                    What do you think is the correct reason?
                  </h3>
                  <div className="space-y-4">
                    <Select value={selectedCorrection} onValueChange={setSelectedCorrection}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select the correct cry reason" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.isArray(allCryReasons) && allCryReasons.length > 0 ? (
                          allCryReasons.map((reason) => (
                            <SelectItem key={reason.className} value={reason.className}>
                              <div className="flex items-center space-x-2">
                                <span>{getCryIcon(reason.className)}</span>
                                <span>{reason.title}</span>
                              </div>
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem disabled value="">No cry reasons available</SelectItem>
                        )}
                      </SelectContent>
                    </Select>

                    <div className="flex space-x-2">
                      <Button 
                        onClick={handleCorrection}
                        disabled={!selectedCorrection || rateMutation.isPending}
                        className="flex-1"
                      >
                        Submit Correction
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => {
                          setShowCorrectionSelector(false);
                          setSelectedCorrection("");
                        }}
                        disabled={rateMutation.isPending}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}