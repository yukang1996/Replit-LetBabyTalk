

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mic, Square, Play, Pause, Trash2, Upload } from "lucide-react";
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
    playRecording,
    stopPlayback,
    isPlaying,
    currentPlaybackTime,
    audioDuration,
    seekTo,
    deleteRecording,
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

  const handleRecordingToggle = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleUpload = () => {
    if (audioBlob) {
      uploadMutation.mutate(audioBlob);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (audioDuration > 0) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percentage = clickX / rect.width;
      const seekTime = percentage * audioDuration;
      seekTo(seekTime);
    }
  };

  const handleDelete = () => {
    deleteRecording();
  };

  // Show recording interface when no audio or currently recording
  if (!audioBlob || isRecording) {
    return (
      <div className="text-center space-y-6 py-8">
        {/* Recording Button with Animation */}
        <div className="relative flex justify-center h-48 items-center overflow-hidden">
          {/* Outer pulsing rings - contained within the component */}
          {isRecording && !isPaused && (
            <>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-40 h-40 border-4 border-pink-300 rounded-full animate-ping opacity-75" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-44 h-44 border-2 border-purple-200 rounded-full animate-pulse opacity-50" 
                     style={{ animationDelay: '0.5s' }} />
              </div>
            </>
          )}
          
          <Button
            onClick={handleRecordingToggle}
            disabled={uploadMutation.isPending}
            className={cn(
              "w-32 h-32 rounded-full transition-all duration-300 relative z-10",
              "gradient-bg hover:opacity-90"
            )}
          >
            {isRecording ? (
              <Square className="w-12 h-12 text-white" />
            ) : (
              <Mic className="w-12 h-12 text-white" />
            )}
          </Button>
        </div>

        {/* Instructions */}
        <div>
          <h3 className="text-xl font-medium text-gray-800 mb-2">
            {isRecording ? (isPaused ? "Recording Paused" : "Recording...") : "Tap to start recording"}
          </h3>
          <p className="text-sm text-gray-600">
            {isRecording 
              ? "Tap again to stop recording" 
              : "Record 8-30 seconds to get the best results"
            }
          </p>
        </div>

        {/* Recording Timer */}
        {isRecording && (
          <div className="text-center">
            <div className="text-2xl font-mono text-gray-700">
              {formatTime(recordingTime)}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Show track bar interface after recording completion
  return (
    <div className="text-center space-y-6 py-8">
      {/* Audio Track Bar */}
      <div className="space-y-4">
        <h3 className="text-xl font-medium text-gray-800">
          Recording Complete
        </h3>
        
        {/* Track Bar */}
        <div className="bg-gray-100 rounded-lg p-6 space-y-4">
          {/* Time displays */}
          <div className="flex justify-between text-sm text-gray-600">
            <span>{formatTime(currentPlaybackTime)}</span>
            <span>{formatTime(audioDuration || recordingTime)}</span>
          </div>
          
          {/* Progress bar */}
          <div 
            className="relative h-2 bg-gray-200 rounded-full cursor-pointer group"
            onClick={handleSeek}
          >
            <div 
              className="absolute h-full bg-gradient-to-r from-pink-400 to-purple-400 rounded-full transition-all duration-150"
              style={{ 
                width: audioDuration > 0 
                  ? `${(currentPlaybackTime / audioDuration) * 100}%` 
                  : '0%' 
              }}
            />
            {/* Scrubber */}
            <div 
              className="absolute w-4 h-4 bg-white border-2 border-pink-400 rounded-full shadow-lg transform -translate-y-1 -translate-x-2 transition-all duration-150 group-hover:scale-110"
              style={{ 
                left: audioDuration > 0 
                  ? `${(currentPlaybackTime / audioDuration) * 100}%` 
                  : '0%' 
              }}
            />
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex justify-center space-x-4">
          {/* Play/Pause Button */}
          <Button
            onClick={isPlaying ? stopPlayback : playRecording}
            className="w-16 h-16 rounded-full gradient-bg text-white shadow-lg hover:opacity-90"
          >
            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
          </Button>
          
          {/* Delete Button */}
          <Button
            onClick={handleDelete}
            variant="outline"
            className="w-16 h-16 rounded-full border-red-300 text-red-500 hover:bg-red-50"
          >
            <Trash2 className="w-6 h-6" />
          </Button>
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleUpload}
          disabled={uploadMutation.isPending}
          className="w-full gradient-bg text-white rounded-2xl py-4 text-lg font-medium shadow-lg"
        >
          <Upload className="w-5 h-5 mr-2" />
          {uploadMutation.isPending ? "Analyzing..." : "Submit for Analysis"}
        </Button>
      </div>

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

