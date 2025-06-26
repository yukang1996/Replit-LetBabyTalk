import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ThumbsUp, ThumbsDown, Clock, X } from "lucide-react";
import BearMascot from "@/components/bear-mascot";

interface Recording {
  id: number;
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
  rateState?: string;
  duration?: number;
  recordedAt: string;
}

interface ResultsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  recordingId: number | null;
}

export default function ResultsDialog({ isOpen, onClose, recordingId }: ResultsDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: recording, isLoading } = useQuery<Recording>({
    queryKey: ["/api/recordings", recordingId],
    queryFn: async () => {
      if (!recordingId) throw new Error("No recording ID");
      return await apiRequest("GET", `/api/recordings/${recordingId}`);
    },
    enabled: !!recordingId && isOpen,
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
    rateMutation.mutate({ rateState });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getCryTypeDisplay = (cryType: string) => {
    const typeMap: Record<string, { label: string; emoji: string; color: string }> = {
      'hunger': { label: 'Hungry', emoji: '🍼', color: 'bg-orange-100 text-orange-800' },
      'tired': { label: 'Tired', emoji: '😴', color: 'bg-blue-100 text-blue-800' },
      'discomfort': { label: 'Uncomfortable', emoji: '😣', color: 'bg-yellow-100 text-yellow-800' },
      'pain': { label: 'Pain', emoji: '😢', color: 'bg-red-100 text-red-800' },
      'normal': { label: 'Normal', emoji: '😊', color: 'bg-green-100 text-green-800' },
      'no_cry': { label: 'No Cry Detected', emoji: '🤫', color: 'bg-gray-100 text-gray-800' },
      'unknown': { label: 'Unknown', emoji: '❓', color: 'bg-gray-100 text-gray-800' },
    };
    return typeMap[cryType] || typeMap['unknown'];
  };

  const getOtherProbabilities = () => {
    if (!recording?.analysisResult?.rawResult?.probs) return [];

    const mainClass = recording.analysisResult.rawResult.class;
    const probs = recording.analysisResult.rawResult.probs;

    return Object.entries(probs)
      .filter(([key]) => key !== mainClass)
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

  const mainCryType = getCryTypeDisplay(recording.analysisResult?.cryType || 'unknown');
  const confidence = recording.analysisResult?.confidence || 0;
  const otherProbs = getOtherProbabilities();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-lg font-semibold">Analysis Results</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Bear Mascot and Main Result */}
          <div className="text-center">
            <div className="w-32 h-32 mx-auto mb-4 bg-white rounded-3xl border-4 border-blue-200 flex items-center justify-center shadow-lg">
              <BearMascot className="w-24 h-24" />
            </div>

            <div className="text-4xl font-bold text-gray-800 mb-3">
              {Math.round(confidence * 100)}%
            </div>

            <div className="flex items-center justify-center mb-4">
              <span className="text-2xl mr-2">{mainCryType.emoji}</span>
              <Badge className={`${mainCryType.color} text-lg px-4 py-2 rounded-full`}>
                {mainCryType.label}
              </Badge>
            </div>

            <div className="flex items-center justify-center text-sm text-gray-500">
              <Clock className="w-4 h-4 mr-1" />
              <span>Recorded at {formatTime(recording.recordedAt)}</span>
            </div>
          </div>

          {/* Other Probabilities */}
          {otherProbs.length > 0 && (
            <Card className="glass-effect">
              <CardContent className="p-4">
                <div className="space-y-3">
                  {otherProbs.map(([key, prob]) => {
                    const typeInfo = getCryTypeDisplay(key === 'hunger_food' ? 'hunger' : 
                                                      key === 'sleepiness' ? 'tired' : 
                                                      key.includes('pain') ? 'pain' : 'discomfort');
                    return (
                      <div key={key} className="flex items-center justify-between py-2">
                        <div className="flex items-center space-x-3">
                          <span className="text-lg">{typeInfo.emoji}</span>
                          <span className="text-gray-700 font-medium">{typeInfo.label}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-600 font-bold">
                            {Math.round(prob * 100)}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Explanation */}
          <Card className="glass-effect">
            <CardHeader>
              <CardTitle className="text-base text-gray-800">Explanation</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 leading-relaxed text-sm">
                {recording.analysisResult?.cryType === 'hunger' ? 
                  "Your baby may be feeling hungry. This type of cry is usually rhythmic and persistent, indicating the baby needs feeding." :
                recording.analysisResult?.cryType === 'tired' ?
                  "Your baby may be feeling tired. Tired cries are usually more intermittent, and the baby needs rest." :
                recording.analysisResult?.cryType === 'discomfort' ?
                  "Your baby may be feeling uncomfortable. This could be due to a wet diaper, being too hot or too cold." :
                recording.analysisResult?.cryType === 'pain' ?
                  "Your baby may be in pain. This type of cry is usually sharper and more persistent, requiring immediate attention." :
                  "Based on the audio analysis, we detected your baby's cry pattern, but need more information to determine the specific cause."
                }
              </p>
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card className="glass-effect">
            <CardHeader>
              <CardTitle className="text-base text-gray-800">Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recording.analysisResult?.recommendations?.map((rec, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <span className="text-pink-500 mt-1">•</span>
                    <span className="text-gray-600 text-sm">{rec}</span>
                  </div>
                )) || (
                  <div className="space-y-2">
                    <div className="flex items-start space-x-2">
                      <span className="text-pink-500 mt-1">•</span>
                      <span className="text-gray-600 text-sm">Stay calm and observe other signs from your baby</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <span className="text-pink-500 mt-1">•</span>
                      <span className="text-gray-600 text-sm">Try common soothing methods like holding or gentle rocking</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <span className="text-pink-500 mt-1">•</span>
                      <span className="text-gray-600 text-sm">If crying persists, consult your pediatrician</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Feedback Section */}
          <Card className="glass-effect">
            <CardContent className="p-4">
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
                  disabled={rateMutation.isPending}
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
                  disabled={rateMutation.isPending}
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
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}