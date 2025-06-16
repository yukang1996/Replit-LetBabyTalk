import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mic, Square, Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AudioRecorder() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const {
    isRecording,
    isPaused,
    recordingTime,
    audioBlob,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    playRecording,
    stopPlayback,
    isPlaying,
  } = useAudioRecorder();

  const uploadMutation = useMutation({
    mutationFn: async (audioBlob: Blob) => {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('duration', Math.floor(recordingTime).toString());

      const response = await fetch('/api/recordings', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`${response.status}: ${text || response.statusText}`);
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/recordings"] });
      toast({
        title: "Analysis Complete!",
        description: `Detected: ${data.analysisResult?.cryType || 'Unknown cry type'}`,
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Upload Failed",
        description: "Failed to analyze recording. Please try again.",
        variant: "destructive",
      });
    },
  });

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartRecording = () => {
    startRecording();
  };

  const handleStopRecording = () => {
    stopRecording();
  };

  const handleUpload = () => {
    if (audioBlob) {
      uploadMutation.mutate(audioBlob);
    }
  };

  return (
    <div className="text-center space-y-6">
      {/* Recording Button */}
      <div className="relative">
        <Button
          onClick={isRecording ? handleStopRecording : handleStartRecording}
          disabled={uploadMutation.isPending}
          className={cn(
            "w-32 h-32 rounded-full transition-all duration-300",
            isRecording 
              ? "bg-red-500 hover:bg-red-600 animate-pulse" 
              : "gradient-bg hover:opacity-90"
          )}
        >
          {isRecording ? (
            <Square className="w-12 h-12 text-white" />
          ) : (
            <Mic className="w-12 h-12 text-white" />
          )}
        </Button>
        
        {/* Recording indicator */}
        {isRecording && (
          <div className="absolute -inset-2 border-4 border-red-300 rounded-full animate-ping" />
        )}
      </div>

      {/* Instructions */}
      <div>
        <h3 className="text-xl font-medium text-gray-800 mb-2">
          {isRecording ? (isPaused ? "Recording Paused" : "Recording...") : "Tap to start recording"}
        </h3>
        <p className="text-sm text-gray-600">
          {isRecording 
            ? "Tap again to stop recording (max 30 seconds)" 
            : "Record 8-30 seconds to get the best results"
          }
        </p>
      </div>

      {/* Recording Timer */}
      {(isRecording || audioBlob) && (
        <div className="text-center">
          <div className="text-2xl font-mono text-gray-700">
            {formatTime(recordingTime)}
          </div>
          {isRecording && (
            <div className="text-sm text-gray-500 mt-1">
              / {formatTime(30)} max
            </div>
          )}
        </div>
      )}

      {/* Recording Controls */}
      {isRecording && (
        <div className="flex justify-center space-x-4">
          <Button
            onClick={isPaused ? resumeRecording : pauseRecording}
            variant="outline"
            size="sm"
            className="rounded-full"
          >
            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </Button>
        </div>
      )}

      {/* Playback and Upload */}
      {audioBlob && !isRecording && (
        <div className="space-y-4">
          <div className="flex justify-center space-x-4">
            <Button
              onClick={isPlaying ? stopPlayback : playRecording}
              variant="outline"
              className="rounded-full"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span className="ml-2">{isPlaying ? "Stop" : "Play"}</span>
            </Button>
          </div>

          <Button
            onClick={handleUpload}
            disabled={uploadMutation.isPending}
            className="w-full gradient-bg text-white rounded-2xl py-3"
          >
            {uploadMutation.isPending ? "Analyzing..." : "Analyze Cry"}
          </Button>
        </div>
      )}

      {/* Analysis Results */}
      {uploadMutation.isSuccess && uploadMutation.data && (
        <Card className="glass-effect">
          <CardContent className="p-4">
            <h4 className="font-medium text-gray-800 mb-2">Analysis Results</h4>
            <div className="text-left space-y-2">
              <p className="text-sm">
                <span className="font-medium">Cry Type:</span> {uploadMutation.data.analysisResult?.cryType}
              </p>
              <p className="text-sm">
                <span className="font-medium">Confidence:</span> {Math.round((uploadMutation.data.analysisResult?.confidence || 0) * 100)}%
              </p>
              {uploadMutation.data.analysisResult?.recommendations && (
                <div className="text-sm">
                  <span className="font-medium">Recommendations:</span>
                  <ul className="mt-1 space-y-1">
                    {uploadMutation.data.analysisResult.recommendations.map((rec: string, index: number) => (
                      <li key={index} className="text-gray-600">• {rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
