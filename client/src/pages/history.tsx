import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { History, Play, Clock, TrendingUp } from "lucide-react";

export default function HistoryPage() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  const { data: recordings = [], isLoading: recordingsLoading } = useQuery({
    queryKey: ["/api/recordings"],
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
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
  }, [isAuthenticated, isLoading, toast]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCryTypeColor = (cryType: string) => {
    switch (cryType) {
      case 'hunger':
        return 'bg-orange-100 text-orange-800';
      case 'tired':
        return 'bg-blue-100 text-blue-800';
      case 'discomfort':
        return 'bg-yellow-100 text-yellow-800';
      case 'pain':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading || !isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="gradient-bg p-4 flex items-center">
        <History className="w-6 h-6 text-white mr-3" />
        <span className="text-white font-medium text-lg">History</span>
      </div>

      <div className="p-4 pb-20">
        {recordingsLoading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Loading recordings...</p>
          </div>
        ) : recordings.length > 0 ? (
          <div className="space-y-4">
            {recordings.map((recording: any) => (
              <Card key={recording.id} className="glass-effect">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge className={getCryTypeColor(recording.analysisResult?.cryType || 'unknown')}>
                          {recording.analysisResult?.cryType || 'Unknown'}
                        </Badge>
                        {recording.analysisResult?.confidence && (
                          <span className="text-xs text-gray-500">
                            {Math.round(recording.analysisResult.confidence * 100)}% confidence
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>
                            {recording.duration ? formatDuration(recording.duration) : 'Unknown'}
                          </span>
                        </div>
                        <span>
                          {new Date(recording.recordedAt).toLocaleDateString()}
                        </span>
                        <span>
                          {new Date(recording.recordedAt).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      </div>

                      {recording.analysisResult?.recommendations && (
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-gray-700">Recommendations:</p>
                          {recording.analysisResult.recommendations.slice(0, 2).map((rec: string, index: number) => (
                            <p key={index} className="text-xs text-gray-600">• {rec}</p>
                          ))}
                        </div>
                      )}
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-pink-500 hover:bg-pink-50"
                      onClick={() => {
                        // Play audio functionality
                        console.log('Play recording:', recording.id);
                      }}
                    >
                      <Play className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">No recordings yet</h3>
            <p className="text-gray-500 mb-6">Start recording baby cries to see analysis history here</p>
            <Button className="gradient-bg text-white rounded-2xl">
              Make First Recording
            </Button>
          </div>
        )}
      </div>

      <Navigation />
    </div>
  );
}
