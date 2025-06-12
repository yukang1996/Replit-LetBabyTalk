import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Navigation from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Pause, ThumbsUp, ThumbsDown, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function HistoryPage() {
  const { isAuthenticated, user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const { data: recordings = [], isLoading } = useQuery({
    queryKey: ["/api/recordings"],
    enabled: isAuthenticated,
  });

  const voteMutation = useMutation({
    mutationFn: async ({ recordingId, vote }: { recordingId: number; vote: string }) => {
      return await apiRequest("POST", `/api/recordings/${recordingId}/vote`, { vote });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recordings"] });
      toast({
        title: "Feedback Recorded",
        description: "Thank you for your feedback!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to record feedback",
        variant: "destructive",
      });
    },
  });

  const handlePlayPause = (recordingId: number) => {
    if (playingId === recordingId) {
      setPlayingId(null);
    } else {
      setPlayingId(recordingId);
    }
  };

  const handleVote = (recordingId: number, vote: string) => {
    voteMutation.mutate({ recordingId, vote });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString();
  };

  // Type the recordings data
  const typedRecordings = recordings as Array<{
    id: number;
    recordedAt: string;
    analysisResult?: {
      cryType: string;
      confidence: number;
      recommendations: string[];
    };
    vote?: string;
  }>;

  // Filter recordings by selected date
  const filteredRecordings = typedRecordings.filter((recording) => {
    const recordingDate = new Date(recording.recordedAt).toISOString().split('T')[0];
    return recordingDate === selectedDate;
  });

  // Prepare histogram data for selected date
  const histogramData = filteredRecordings.reduce((acc: any, recording) => {
    const cryType = recording.analysisResult?.cryType || 'Unknown';
    acc[cryType] = (acc[cryType] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.entries(histogramData).map(([type, count]) => ({
    cryType: type,
    count: count,
  }));

  // Date navigation
  const navigateDate = (direction: 'prev' | 'next') => {
    const currentDate = new Date(selectedDate);
    const newDate = new Date(currentDate);
    
    if (direction === 'prev') {
      newDate.setDate(currentDate.getDate() - 1);
    } else {
      newDate.setDate(currentDate.getDate() + 1);
    }
    
    setSelectedDate(newDate.toISOString().split('T')[0]);
  };

  // Get unique dates with recordings
  const availableDates = [...new Set(typedRecordings.map((r) => 
    new Date(r.recordedAt).toISOString().split('T')[0]
  ))].sort().reverse();

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <div className="gradient-bg p-4">
          <h1 className="text-white font-medium text-lg">{t('history.title')}</h1>
        </div>
        <div className="flex items-center justify-center min-h-[50vh]">
          <p className="text-gray-500">{t('common.loading')}</p>
        </div>
        <Navigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="gradient-bg p-4">
        <h1 className="text-white font-medium text-lg">{t('history.title')}</h1>
      </div>

      {/* Content */}
      <div className="p-4 pb-20">
        {typedRecordings.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
            <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-gray-300 rounded-full"></div>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              {t('history.noRecordings')}
            </h2>
            <p className="text-gray-600 mb-6">
              {t('history.startRecording')}
            </p>
            <Button className="gradient-bg text-white rounded-2xl px-8">
              {t('history.makeFirst')}
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Date Selector and Histogram */}
            <Card className="glass-effect">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-gray-800">Analysis Overview</h3>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigateDate('prev')}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Select value={selectedDate} onValueChange={setSelectedDate}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availableDates.map((date) => (
                          <SelectItem key={date} value={date}>
                            {new Date(date).toLocaleDateString()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigateDate('next')}
                      disabled={selectedDate >= new Date().toISOString().split('T')[0]}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Histogram */}
                {chartData.length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="cryType" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" className="fill-pink-500" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    No recordings for {new Date(selectedDate).toLocaleDateString()}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recording List */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-800">Recordings</h3>
              {filteredRecordings.length === 0 ? (
                <Card className="glass-effect">
                  <CardContent className="p-8 text-center">
                    <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No recordings for this date</p>
                  </CardContent>
                </Card>
              ) : (
                filteredRecordings.map((recording) => (
                  <Card key={recording.id} className="glass-effect">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handlePlayPause(recording.id)}
                              className="w-10 h-10 rounded-full gradient-bg text-white"
                            >
                              {playingId === recording.id ? (
                                <Pause className="w-4 h-4" />
                              ) : (
                                <Play className="w-4 h-4" />
                              )}
                            </Button>
                            <div>
                              <p className="font-medium text-gray-800">
                                {recording.analysisResult?.cryType || 'Unknown'}
                              </p>
                              <p className="text-sm text-gray-500">
                                {formatTime(recording.recordedAt)}
                              </p>
                            </div>
                          </div>
                          
                          {recording.analysisResult?.recommendations && (
                            <div className="mt-3 p-3 bg-pink-50 rounded-lg">
                              <p className="text-sm font-medium text-gray-800 mb-2">
                                {t('history.recommendations')}
                              </p>
                              <ul className="text-sm text-gray-600 space-y-1">
                                {recording.analysisResult.recommendations.map((rec, index) => (
                                  <li key={index}>• {rec}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Voting Buttons */}
                          <div className="flex items-center space-x-2 mt-3">
                            <span className="text-sm text-gray-600">Was this helpful?</span>
                            <Button
                              variant={recording.vote === 'good' ? 'default' : 'ghost'}
                              size="sm"
                              onClick={() => handleVote(recording.id, 'good')}
                              disabled={voteMutation.isPending}
                              className={`${recording.vote === 'good' ? 'bg-green-500 text-white' : 'hover:bg-green-50'}`}
                            >
                              <ThumbsUp className="w-4 h-4" />
                            </Button>
                            <Button
                              variant={recording.vote === 'bad' ? 'default' : 'ghost'}
                              size="sm"
                              onClick={() => handleVote(recording.id, 'bad')}
                              disabled={voteMutation.isPending}
                              className={`${recording.vote === 'bad' ? 'bg-red-500 text-white' : 'hover:bg-red-50'}`}
                            >
                              <ThumbsDown className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        
                        {recording.analysisResult?.confidence && (
                          <div className="text-right">
                            <p className="text-sm text-gray-500">
                              {Math.round(recording.analysisResult.confidence * 100)}% {t('history.confidence')}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <Navigation />
    </div>
  );
}