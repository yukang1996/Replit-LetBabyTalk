
import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ThumbsUp, ThumbsDown, Heart, Clock } from "lucide-react";
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
  vote?: string;
  duration?: number;
  recordedAt: string;
}

export default function Results() {
  const [, params] = useRoute("/results/:id");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const recordingId = params?.id ? parseInt(params.id) : null;

  const { data: recording, isLoading } = useQuery<Recording>({
    queryKey: ["/api/recordings", recordingId],
    queryFn: async () => {
      if (!recordingId) throw new Error("No recording ID");
      return await apiRequest("GET", `/api/recordings/${recordingId}`);
    },
    enabled: !!recordingId,
  });

  const voteMutation = useMutation({
    mutationFn: async (vote: string) => {
      if (!recordingId) throw new Error("No recording ID");
      return await apiRequest("POST", `/api/recordings/${recordingId}/vote`, { vote });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recordings", recordingId] });
      toast({
        title: "Feedback Recorded",
        description: "Thank you for your feedback!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to record feedback",
        variant: "destructive",
      });
    },
  });

  const handleVote = (vote: string) => {
    voteMutation.mutate(vote);
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getCryTypeDisplay = (cryType: string) => {
    const typeMap: Record<string, { label: string; emoji: string; color: string }> = {
      'hunger': { label: '饥饿', emoji: '🍼', color: 'bg-orange-100 text-orange-800' },
      'tired': { label: '困倦', emoji: '😴', color: 'bg-blue-100 text-blue-800' },
      'discomfort': { label: '不适', emoji: '😣', color: 'bg-yellow-100 text-yellow-800' },
      'pain': { label: '疼痛', emoji: '😢', color: 'bg-red-100 text-red-800' },
      'normal': { label: '正常', emoji: '😊', color: 'bg-green-100 text-green-800' },
      'no_cry': { label: '未检测到哭声', emoji: '🤫', color: 'bg-gray-100 text-gray-800' },
      'unknown': { label: '未知', emoji: '❓', color: 'bg-gray-100 text-gray-800' },
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
      .slice(0, 3); // Show top 3 other probabilities
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading analysis results...</p>
      </div>
    );
  }

  if (!recording) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Recording not found</p>
          <Button onClick={() => navigate("/")}>Go Home</Button>
        </div>
      </div>
    );
  }

  const mainCryType = getCryTypeDisplay(recording.analysisResult?.cryType || 'unknown');
  const confidence = recording.analysisResult?.confidence || 0;
  const otherProbs = getOtherProbabilities();

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      {/* Header */}
      <div className="gradient-bg p-4 flex items-center justify-between">
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-white hover:bg-white/20"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <h1 className="text-white font-medium text-lg">Analysis Results</h1>
        <div className="w-20"></div>
      </div>

      {/* Main Content */}
      <div className="p-4 pb-20 space-y-6">
        {/* Bear Mascot and Main Result */}
        <Card className="glass-effect text-center">
          <CardContent className="p-6">
            <div className="w-32 h-32 mx-auto mb-4 bg-white rounded-2xl border-4 border-blue-200 flex items-center justify-center">
              <BearMascot className="w-24 h-24" />
            </div>
            
            <div className="text-4xl font-bold text-gray-800 mb-2">
              {mainCryType.emoji} {Math.round(confidence * 100)}%
            </div>
            
            <Badge className={`${mainCryType.color} text-lg px-4 py-2`}>
              {mainCryType.label}
            </Badge>
            
            <div className="flex items-center justify-center text-sm text-gray-500 mt-4">
              <Clock className="w-4 h-4 mr-1" />
              <span>Recorded at {formatTime(recording.recordedAt)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Other Probabilities */}
        {otherProbs.length > 0 && (
          <Card className="glass-effect">
            <CardHeader>
              <CardTitle className="text-lg text-gray-800">Other Possibilities</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {otherProbs.map(([key, prob]) => {
                const typeInfo = getCryTypeDisplay(key === 'hunger_food' ? 'hunger' : 
                                                  key === 'sleepiness' ? 'tired' : 
                                                  key.includes('pain') ? 'pain' : 'discomfort');
                return (
                  <div key={key} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{typeInfo.emoji}</span>
                      <span className="text-gray-700">{typeInfo.label}</span>
                    </div>
                    <span className="text-gray-600 font-medium">
                      {Math.round(prob * 100)}%
                    </span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Explanation */}
        <Card className="glass-effect">
          <CardHeader>
            <CardTitle className="text-lg text-gray-800">解释</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 leading-relaxed">
              {recording.analysisResult?.cryType === 'hunger' ? 
                "宝宝可能感到饥饿。这种哭声通常有节奏且持续，表明宝宝需要进食。" :
              recording.analysisResult?.cryType === 'tired' ?
                "宝宝可能感到困倦。疲倦的哭声通常比较断断续续，宝宝需要休息。" :
              recording.analysisResult?.cryType === 'discomfort' ?
                "宝宝可能感到不适。这可能是由于尿布湿了、太热或太冷等原因引起的。" :
              recording.analysisResult?.cryType === 'pain' ?
                "宝宝可能感到疼痛。这种哭声通常比较尖锐和持续，需要及时关注。" :
                "根据音频分析，我们检测到了宝宝的哭声模式，但需要更多信息来确定具体原因。"
              }
            </p>
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card className="glass-effect">
          <CardHeader>
            <CardTitle className="text-lg text-gray-800">建议</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recording.analysisResult?.recommendations?.map((rec, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <span className="text-pink-500 mt-1">•</span>
                  <span className="text-gray-600">{rec}</span>
                </div>
              )) || (
                <div className="space-y-2">
                  <div className="flex items-start space-x-2">
                    <span className="text-pink-500 mt-1">•</span>
                    <span className="text-gray-600">保持冷静，仔细观察宝宝的其他信号</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="text-pink-500 mt-1">•</span>
                    <span className="text-gray-600">尝试常见的安抚方法，如拥抱或轻摇</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="text-pink-500 mt-1">•</span>
                    <span className="text-gray-600">如果持续哭闹，请咨询儿科医生</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Feedback Section */}
        <Card className="glass-effect">
          <CardContent className="p-6">
            <h3 className="text-lg font-medium text-gray-800 text-center mb-4">
              评价预测准确度
            </h3>
            <div className="flex justify-center space-x-6">
              <Button
                variant={recording.vote === 'good' ? 'default' : 'outline'}
                size="lg"
                className={`rounded-full w-16 h-16 ${
                  recording.vote === 'good' 
                    ? 'bg-pink-500 hover:bg-pink-600' 
                    : 'border-pink-200 hover:bg-pink-50'
                }`}
                onClick={() => handleVote('good')}
                disabled={voteMutation.isPending}
              >
                <ThumbsUp className={`w-6 h-6 ${
                  recording.vote === 'good' ? 'text-white' : 'text-pink-500'
                }`} />
              </Button>
              
              <Button
                variant={recording.vote === 'bad' ? 'default' : 'outline'}
                size="lg"
                className={`rounded-full w-16 h-16 ${
                  recording.vote === 'bad' 
                    ? 'bg-blue-500 hover:bg-blue-600' 
                    : 'border-blue-200 hover:bg-blue-50'
                }`}
                onClick={() => handleVote('bad')}
                disabled={voteMutation.isPending}
              >
                <ThumbsDown className={`w-6 h-6 ${
                  recording.vote === 'bad' ? 'text-white' : 'text-blue-500'
                }`} />
              </Button>
            </div>
            
            {recording.vote && (
              <p className="text-center text-sm text-gray-500 mt-3">
                Thank you for your feedback!
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
