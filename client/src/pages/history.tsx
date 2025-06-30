
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Navigation from "@/components/navigation";
import ResultsDialog from "@/components/results-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Play, 
  Pause, 
  Calendar,
  BarChart3,
  Clock
} from "lucide-react";

interface Recording {
  id: number;
  userId: string;
  filename: string;
  audioUrl: string | null;
  duration: number | null;
  babyProfileId: number | null;
  analysisResult: Record<string, number> | null;
  rateState: string | null;
  predictClass: string | null;
  rateTime: Date | null;
  rateReason: string | null;
  recordedAt: string;
}

type TimeRange = 'day' | 'week' | 'month';

export default function HistoryPage() {
  const { isAuthenticated, user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('day');
  const [selectedRecordingId, setSelectedRecordingId] = useState<number | null>(null);
  const [isResultsDialogOpen, setIsResultsDialogOpen] = useState(false);

  const { data: recordings = [], isLoading } = useQuery<Recording[]>({
    queryKey: ["/api/recordings"],
    enabled: isAuthenticated,
  });

  // Filter recordings based on time range
  const filteredRecordings = useMemo(() => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let cutoffDate: Date;
    switch (timeRange) {
      case 'day':
        cutoffDate = startOfDay;
        break;
      case 'week':
        cutoffDate = startOfWeek;
        break;
      case 'month':
        cutoffDate = startOfMonth;
        break;
      default:
        cutoffDate = startOfDay;
    }

    return recordings.filter(recording => 
      new Date(recording.recordedAt) >= cutoffDate
    );
  }, [recordings, timeRange]);

  // Calculate statistics
  const statistics = useMemo(() => {
    const stats: Record<string, number> = {};
    
    filteredRecordings.forEach(recording => {
      const category = recording.predictClass || 'unknown';
      stats[category] = (stats[category] || 0) + 1;
    });

    return stats;
  }, [filteredRecordings]);

  // Get category display info
  const getCategoryInfo = (className: string) => {
    const categoryMap: Record<string, { title: string; color: string; icon: string }> = {
      hunger_food: { title: t('categories.hunger_food') || 'Hunger (Food)', color: 'bg-pink-500', icon: '🍼' },
      hunger_milk: { title: t('categories.hunger_milk') || 'Hunger (Milk)', color: 'bg-pink-500', icon: '🍼' },
      sleepiness: { title: t('categories.sleepiness') || 'Sleepiness', color: 'bg-blue-500', icon: '😴' },
      lack_of_security: { title: t('categories.lack_of_security') || 'Lack of Security', color: 'bg-purple-500', icon: '🤗' },
      diaper_urine: { title: t('categories.diaper_urine') || 'Diaper (Urine)', color: 'bg-yellow-500', icon: '💧' },
      diaper_bowel: { title: t('categories.diaper_bowel') || 'Diaper (Bowel)', color: 'bg-orange-500', icon: '💩' },
      internal_pain: { title: t('categories.internal_pain') || 'Internal Pain', color: 'bg-red-500', icon: '😢' },
      external_pain: { title: t('categories.external_pain') || 'External Pain', color: 'bg-red-600', icon: '😣' },
      physical_discomfort: { title: t('categories.physical_discomfort') || 'Physical Discomfort', color: 'bg-orange-600', icon: '😫' },
      unmet_needs: { title: t('categories.unmet_needs') || 'Unmet Needs', color: 'bg-indigo-500', icon: '😰' },
      breathing_difficulties: { title: t('categories.breathing_difficulties') || 'Breathing Difficulties', color: 'bg-red-700', icon: '😤' },
      normal: { title: t('categories.normal') || 'Normal', color: 'bg-green-500', icon: '😊' },
      no_cry_detected: { title: t('categories.no_cry_detected') || 'No Cry Detected', color: 'bg-gray-500', icon: '🤫' },
      unknown: { title: t('categories.unknown') || 'Unknown', color: 'bg-gray-400', icon: '❓' },
    };

    return categoryMap[className] || categoryMap.unknown;
  };

  // Get top categories for display
  const topCategories = useMemo(() => {
    return Object.entries(statistics)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([category, count]) => ({
        category,
        count,
        ...getCategoryInfo(category)
      }));
  }, [statistics]);

  const handlePlayPause = (recordingId: number) => {
    if (playingId === recordingId) {
      setPlayingId(null);
    } else {
      setPlayingId(recordingId);
      // In a real implementation, you would play the audio here
    }
  };

  const handleRecordingClick = (recordingId: number) => {
    setSelectedRecordingId(recordingId);
    setIsResultsDialogOpen(true);
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getTotalRecordings = () => {
    return filteredRecordings.length;
  };

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 to-blue-100">
        <div className="gradient-bg p-4">
          <h1 className="text-white font-medium text-lg">{t('history.title') || 'History'}</h1>
        </div>
        <div className="flex items-center justify-center min-h-[50vh]">
          <p className="text-gray-500">{t('common.loading') || 'Loading...'}</p>
        </div>
        <Navigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 to-blue-100">
      {/* Header */}
      <div className="gradient-bg p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-white font-medium text-lg">{t('history.title') || 'History'}</h1>
          <div className="flex items-center space-x-2 text-white text-sm">
            <BarChart3 className="w-4 h-4" />
            <span>{getTotalRecordings()}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 pb-20">
        {recordings.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
            <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <Calendar className="w-16 h-16 text-gray-300" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              {t('history.noRecordings') || 'No recordings yet'}
            </h2>
            <p className="text-gray-600 mb-6">
              {t('history.startRecording') || 'Start recording baby cries to see analysis history here'}
            </p>
            <Button className="gradient-bg text-white rounded-2xl px-8">
              {t('history.makeFirst') || 'Make First Recording'}
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Time Range Selector */}
            <Card className="glass-effect">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-gray-800">{t('history.timeRange') || 'Time Range'}</h3>
                </div>
                <div className="flex space-x-2">
                  {['day', 'week', 'month'].map((range) => (
                    <Button
                      key={range}
                      variant={timeRange === range ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTimeRange(range as TimeRange)}
                      className={timeRange === range ? "gradient-bg text-white" : ""}
                    >
                      {t(`history.${range}`) || range.charAt(0).toUpperCase() + range.slice(1)}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Statistics Summary */}
            {topCategories.length > 0 && (
              <Card className="glass-effect">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-gray-800">{t('history.statistics') || 'Statistics'}</h3>
                    <span className="text-sm text-gray-500">
                      {t('history.total') || 'Total'}: {filteredRecordings.length}
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    {topCategories.map(({ category, count, title, color, icon }) => (
                      <div key={category} className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2 flex-1">
                          <span className="text-lg">{icon}</span>
                          <span className="text-sm font-medium text-gray-700">{title}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${color} transition-all duration-300`}
                              style={{ 
                                width: `${Math.max(10, (count / filteredRecordings.length) * 100)}%` 
                              }}
                            />
                          </div>
                          <span className="text-sm font-bold text-gray-600 min-w-[2rem] text-right">
                            {count}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recordings List */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-800">{t('history.recordings') || 'Recordings'}</h3>
              {filteredRecordings.length === 0 ? (
                <Card className="glass-effect">
                  <CardContent className="p-8 text-center">
                    <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">
                      {t('history.noRecordingsInRange') || `No recordings for selected ${timeRange}`}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredRecordings
                  .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime())
                  .map((recording) => {
                    const categoryInfo = getCategoryInfo(recording.predictClass || 'unknown');
                    const mainProbability = recording.analysisResult?.[recording.predictClass || 'unknown'] || 0;
                    
                    return (
                      <Card 
                        key={recording.id} 
                        className="glass-effect cursor-pointer hover:shadow-lg transition-shadow"
                        onClick={() => handleRecordingClick(recording.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <span className="text-2xl">{categoryInfo.icon}</span>
                                <div>
                                  <Badge className={`${categoryInfo.color} text-white`}>
                                    {categoryInfo.title}
                                  </Badge>
                                  {mainProbability > 0 && (
                                    <span className="text-xs text-gray-500 ml-2">
                                      {Math.round(mainProbability * 100)}%
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-4 text-sm text-gray-500">
                                <div className="flex items-center space-x-1">
                                  <Clock className="w-4 h-4" />
                                  <span>{formatTime(recording.recordedAt)}</span>
                                </div>
                                <span>{formatDate(recording.recordedAt)}</span>
                                {recording.duration && (
                                  <span>{recording.duration}s</span>
                                )}
                              </div>

                              {/* Waveform placeholder */}
                              <div className="mt-3 flex items-center space-x-1">
                                {Array.from({ length: 20 }).map((_, i) => (
                                  <div
                                    key={i}
                                    className="bg-pink-300 rounded"
                                    style={{
                                      width: '2px',
                                      height: `${Math.random() * 20 + 8}px`,
                                      opacity: playingId === recording.id ? 0.8 : 0.4
                                    }}
                                  />
                                ))}
                              </div>
                            </div>

                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-pink-500 hover:bg-pink-50 rounded-full w-12 h-12"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePlayPause(recording.id);
                              }}
                            >
                              {playingId === recording.id ? (
                                <Pause className="w-5 h-5" />
                              ) : (
                                <Play className="w-5 h-5" />
                              )}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Results Dialog */}
      <ResultsDialog
        isOpen={isResultsDialogOpen}
        onClose={() => {
          setIsResultsDialogOpen(false);
          setSelectedRecordingId(null);
        }}
        recordingId={selectedRecordingId}
      />

      <Navigation />
    </div>
  );
}
