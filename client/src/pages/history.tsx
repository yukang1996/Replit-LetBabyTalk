import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { useToast } from "@/hooks/use-toast";
import { useBabySelection } from "@/hooks/useBabySelection";
import { apiRequest } from "@/lib/queryClient";
import Navigation from "@/components/navigation";
import ResultsDialog from "@/components/results-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Play, 
  Pause, 
  Calendar,
  BarChart3,
  Clock,
  CalendarDays,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

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

// MediaError interface for better error handling
interface MediaError {
  readonly MEDIA_ERR_ABORTED: 1;
  readonly MEDIA_ERR_NETWORK: 2;
  readonly MEDIA_ERR_DECODE: 3;
  readonly MEDIA_ERR_SRC_NOT_SUPPORTED: 4;
  readonly code: 1 | 2 | 3 | 4;
  readonly message: string;
}

type TimeRange = 'day' | 'week' | 'month' | 'custom';

// Statistics Chart Component
function StatisticsChart({ 
  statistics, 
  totalRecordings, 
  getCategoryInfo, 
  t 
}: {
  statistics: Record<string, number>;
  totalRecordings: number;
  getCategoryInfo: (className: string) => { title: string; color: string; icon: string };
  t: (key: string) => string | undefined;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  // All possible cry categories
  const allCategories = [
    'hunger_food',
    'hunger_milk', 
    'sleepiness',
    'lack_of_security',
    'diaper_urine',
    'diaper_bowel',
    'internal_pain',
    'external_pain',
    'physical_discomfort',
    'unmet_needs',
    'breathing_difficulties',
    'normal',
    'no_cry_detected',
    'unknown'
  ];

  // Create complete statistics with all categories (including zero counts)
  const completeStats = allCategories.map(category => ({
    category,
    count: statistics[category] || 0,
    ...getCategoryInfo(category)
  }));

  // Sort by count (descending) and then by category name for consistent ordering
  const sortedStats = completeStats.sort((a, b) => {
    if (b.count !== a.count) {
      return b.count - a.count;
    }
    return a.title.localeCompare(b.title);
  });

  // Show top 5 by default, all when expanded
  const displayedStats = isExpanded ? sortedStats : sortedStats.slice(0, 5);
  const hiddenCount = sortedStats.length - 5;
  const maxCount = Math.max(...sortedStats.map(s => s.count), 1);

  return (
    <div className="space-y-4">
      {/* Chart Grid */}
      <div className="grid grid-cols-1 gap-3">
        {displayedStats.map(({ category, count, title, color, icon }) => {
          const percentage = totalRecordings > 0 ? (count / totalRecordings) * 100 : 0;
          const barWidth = maxCount > 0 ? (count / maxCount) * 100 : 0;

          return (
            <div key={category} className="bg-white/50 rounded-lg p-3 border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{icon}</span>
                  <span className="text-sm font-medium text-gray-700">{title}</span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-800">{count}</div>
                  {totalRecordings > 0 && (
                    <div className="text-xs text-gray-500">{percentage.toFixed(1)}%</div>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${color} transition-all duration-500 ease-out rounded-full`}
                  style={{ 
                    width: `${Math.max(2, barWidth)}%`,
                    opacity: count > 0 ? 1 : 0.3
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Expand/Collapse Button */}
      {hiddenCount > 0 && (
        <div className="flex justify-center pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4 mr-1" />
                {t('history.showLess') || 'Show Less'}
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-1" />
                {t('history.showMore') || `Show ${hiddenCount} More`}
              </>
            )}
          </Button>
        </div>
      )}

      {/* Summary Stats */}
      {totalRecordings > 0 && (
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
          <div className="text-center">
            <div className="text-sm font-medium text-gray-600">
              {t('history.topCategory') || 'Top Category'}
            </div>
            <div className="text-xs text-gray-500 mt-1 flex items-center justify-center space-x-1">
              <span>{sortedStats[0].icon}</span>
              <span>{sortedStats[0].title}</span>
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm font-medium text-gray-600">
              {t('history.categories') || 'Categories'}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {sortedStats.filter(s => s.count > 0).length} / {sortedStats.length}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm font-medium text-gray-600">
              {t('history.avgPerCategory') || 'Avg/Category'}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {(totalRecordings / Math.max(sortedStats.filter(s => s.count > 0).length, 1)).toFixed(1)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function HistoryPage() {
  const { isAuthenticated, user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [playingId, setPlayingId] = useState<number | null>(null);
  const [audioElements, setAudioElements] = useState<Record<number, HTMLAudioElement>>({});
  const [timeRange, setTimeRange] = useState<TimeRange>('day');
  const [selectedRecordingId, setSelectedRecordingId] = useState<number | null>(null);
  const [isResultsDialogOpen, setIsResultsDialogOpen] = useState(false);
  const [customDateRange, setCustomDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined
  });
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [selectedBabyFilter, setSelectedBabyFilter] = useState<number | 'all'>('all');
  const [audioCurrentTimes, setAudioCurrentTimes] = useState<Record<number, number>>({});
  const [isDragging, setIsDragging] = useState(false);

  const { data: recordings = [], isLoading } = useQuery<Recording[]>({
    queryKey: ["/api/recordings"],
    enabled: isAuthenticated,
  });

  const { selectedBaby, profiles } = useBabySelection();

  // Filter recordings based on time range and baby selection
  const filteredRecordings = useMemo(() => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // First filter by baby selection
    let babyFilteredRecordings = recordings;
    if (selectedBabyFilter !== 'all') {
      babyFilteredRecordings = recordings.filter(recording => 
        recording.babyProfileId === selectedBabyFilter
      );
    }

    // Then filter by time range
    if (timeRange === 'custom') {
      if (!customDateRange.from) return babyFilteredRecordings;

      return babyFilteredRecordings.filter(recording => {
        const recordingDate = new Date(recording.recordedAt);
        const fromDate = new Date(customDateRange.from!);
        fromDate.setHours(0, 0, 0, 0);

        if (customDateRange.to) {
          const toDate = new Date(customDateRange.to);
          toDate.setHours(23, 59, 59, 999);
          return recordingDate >= fromDate && recordingDate <= toDate;
        } else {
          const endOfDay = new Date(fromDate);
          endOfDay.setHours(23, 59, 59, 999);
          return recordingDate >= fromDate && recordingDate <= endOfDay;
        }
      });
    }

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

    return babyFilteredRecordings.filter(recording => 
      new Date(recording.recordedAt) >= cutoffDate
    );
  }, [recordings, timeRange, customDateRange, selectedBabyFilter]);

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

  const handlePlayPause = (recording: Recording) => {
    const recordingId = recording.id;

    if (playingId === recordingId) {
      // Pause current audio
      const audio = audioElements[recordingId];
      if (audio) {
        audio.pause();
      }
      setPlayingId(null);
    } else {
      // Stop any currently playing audio
      Object.values(audioElements).forEach(audio => {
        audio.pause();
        audio.currentTime = 0;
      });

      // Start playing new audio
      if (recording.audioUrl) {
        let audio = audioElements[recordingId];
        if (!audio) {
          audio = new Audio();

          // Set CORS mode to handle cross-origin requests
          audio.crossOrigin = "anonymous";

          // Enhanced error handling
          audio.onerror = (event) => {
            console.error('Audio playback error:', event);
            console.error('Audio error details:', {
              audioUrl: recording.audioUrl,
              error: audio.error,
              networkState: audio.networkState,
              readyState: audio.readyState
            });
            setPlayingId(null);

            // More specific error messages
            let errorMessage = "Unable to play this recording";
            if (audio.error) {
              switch (audio.error.code) {
                case MediaError.MEDIA_ERR_ABORTED:
                  errorMessage = "Playback was aborted";
                  break;
                case MediaError.MEDIA_ERR_NETWORK:
                  errorMessage = "Network error occurred";
                  break;
                case MediaError.MEDIA_ERR_DECODE:
                  errorMessage = "Audio format not supported";
                  break;
                case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
                  errorMessage = "Audio source not supported";
                  break;
              }
            }

            toast({
              title: "Playback Error",
              description: errorMessage,
              variant: "destructive",
            });
          };

          audio.onended = () => {
            setPlayingId(null);
            setAudioCurrentTimes(prev => ({ ...prev, [recordingId]: 0 }));
          };

          // Track time updates
          audio.ontimeupdate = () => {
            if (!isDragging) {
              setAudioCurrentTimes(prev => ({ ...prev, [recordingId]: audio.currentTime }));
            }
          };

          // Set the source
          audio.src = recording.audioUrl;

          setAudioElements(prev => ({ ...prev, [recordingId]: audio }));
        }

        // Attempt to play with better error handling
        const playPromise = audio.play();

        if (playPromise !== undefined) {
          playPromise.then(() => {
            setPlayingId(recordingId);
          }).catch((error) => {
            console.error('Play promise rejected:', error);
            setPlayingId(null);

            let errorMessage = "Unable to start playback";
            if (error.name === 'NotAllowedError') {
              errorMessage = "Please allow audio playback in your browser";
            } else if (error.name === 'NotSupportedError') {
              errorMessage = "Audio format not supported by browser";
            } else if (error.name === 'AbortError') {
              errorMessage = "Playback was interrupted";
            }

            toast({
              title: "Playback Error", 
              description: errorMessage,
              variant: "destructive",
            });
          });
        }
      } else {
        toast({
          title: "No Audio Available",
          description: "This recording doesn't have audio data",
          variant: "destructive",
        });
      }
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

  const getBabyName = (babyProfileId: number | null) => {
    if (!babyProfileId) return t('history.unknownBaby') || 'Unknown Baby';
    const baby = profiles.find(p => p.id === babyProfileId);
    return baby?.name || t('history.unknownBaby') || 'Unknown Baby';
  };

  const handleTimeRangeChange = (range: TimeRange) => {
    setTimeRange(range);
    if (range !== 'custom') {
      setCustomDateRange({ from: undefined, to: undefined });
    }
  };

  const handleDateSelect = (range: { from: Date | undefined; to: Date | undefined } | undefined) => {
    if (range) {
      setCustomDateRange(range);
      setTimeRange('custom');
    }
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
            {/* Baby Selection */}
            <Card className="glass-effect">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-gray-800">{t('history.babySelection') || 'Baby Selection'}</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={selectedBabyFilter === 'all' ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedBabyFilter('all')}
                    className={selectedBabyFilter === 'all' ? "gradient-bg text-white" : ""}
                  >
                    {t('history.allBabies') || 'All Babies'}
                  </Button>
                  {profiles.map((baby) => (
                    <Button
                      key={baby.id}
                      variant={selectedBabyFilter === baby.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedBabyFilter(baby.id)}
                      className={selectedBabyFilter === baby.id ? "gradient-bg text-white" : ""}
                    >
                      {baby.name}
                    </Button>
                  ))}
                </div>

                {/* Display selected baby info */}
                {selectedBabyFilter !== 'all' && (
                  <div className="mt-3 p-2 bg-pink-50 rounded-md">
                    <p className="text-sm text-pink-800">
                      {t('history.showingRecordsFor') || 'Showing records for'}: {profiles.find(p => p.id === selectedBabyFilter)?.name}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Time Range Selector */}
            <Card className="glass-effect">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-gray-800">{t('history.timeRange') || 'Time Range'}</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {['day', 'week', 'month'].map((range) => (
                    <Button
                      key={range}
                      variant={timeRange === range ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleTimeRangeChange(range as TimeRange)}
                      className={timeRange === range ? "gradient-bg text-white" : ""}
                    >
                      {t(`history.${range}`) || range.charAt(0).toUpperCase() + range.slice(1)}
                    </Button>
                  ))}

                  {/* Custom Date Range Picker */}
                  <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant={timeRange === 'custom' ? "default" : "outline"}
                        size="sm"
                        className={cn(
                          "justify-start text-left font-normal",
                          timeRange === 'custom' ? "gradient-bg text-white" : "",
                          !customDateRange.from && timeRange !== 'custom' && "text-muted-foreground"
                        )}
                      >
                        <CalendarDays className="mr-2 h-4 w-4" />
                        {timeRange === 'custom' && customDateRange.from ? (
                          customDateRange.to ? (
                            <>
                              {format(customDateRange.from, "LLL dd")} -{" "}
                              {format(customDateRange.to, "LLL dd")}
                            </>
                          ) : (
                            format(customDateRange.from, "LLL dd, y")
                          )
                        ) : (
                          <span>{t('history.custom') || 'Custom'}</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        initialFocus
                        mode="range"
                        defaultMonth={customDateRange.from}
                        selected={{
                          from: customDateRange.from,
                          to: customDateRange.to
                        }}
                        onSelect={handleDateSelect}
                        numberOfMonths={2}
                        disabled={(date) => date > new Date() || date < new Date("2020-01-01")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Display selected custom range info */}
                {timeRange === 'custom' && customDateRange.from && (
                  <div className="mt-3 p-2 bg-blue-50 rounded-md">
                    <p className="text-sm text-blue-800">
                      {customDateRange.to
                        ? `${t('history.showing') || 'Showing'}: ${format(customDateRange.from, "MMM dd, yyyy")} - ${format(customDateRange.to, "MMM dd, yyyy")}`
                        : `${t('history.showing') || 'Showing'}: ${format(customDateRange.from, "MMM dd, yyyy")}`
                      }
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Statistics Summary */}
            <Card className="glass-effect">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-medium text-gray-800 text-lg">{t('history.statistics') || 'Statistics'}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {t('history.total') || 'Total'}: {filteredRecordings.length} {t('history.recordings') || 'recordings'}
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{filteredRecordings.length}</div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide">{t('history.total') || 'Total'}</div>
                  </div>
                </div>

                <StatisticsChart 
                  statistics={statistics} 
                  totalRecordings={filteredRecordings.length}
                  getCategoryInfo={getCategoryInfo}
                  t={t}
                />
              </CardContent>
            </Card>

            {/* Recordings List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-800 text-lg">{t('history.recordings') || 'Recordings'}</h3>
                <Badge variant="secondary" className="text-xs">
                  {filteredRecordings.length} {t('history.total') || 'total'}
                </Badge>
              </div>

              {filteredRecordings.length === 0 ? (
                <Card className="glass-effect">
                  <CardContent className="p-8 text-center">
                    <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-600 mb-2">
                      {t('history.noRecordingsTitle') || 'No Recordings Found'}
                    </h4>
                    <p className="text-gray-500 text-sm">
                      {timeRange === 'custom' 
                        ? (t('history.noRecordingsInCustomRange') || 'No recordings for selected date range')
                        : (t('history.noRecordingsInRange') || `No recordings for selected ${timeRange}`)
                      }
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {filteredRecordings
                    .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime())
                    .map((recording) => {
                      const categoryInfo = getCategoryInfo(recording.predictClass || 'unknown');
                      const mainProbability = recording.analysisResult?.[recording.predictClass || 'unknown'] || 0;
                      const babyName = getBabyName(recording.babyProfileId);

                      // Calculate progress
                      const effectiveDuration = recording.duration || 0;
                      const audio = audioElements[recording.id];
                      const currentTime = audioCurrentTimes[recording.id] || 0;
                      const progressPercentage = effectiveDuration > 0 ? (currentTime / effectiveDuration) * 100 : 0;
                      const recordingTime = recording.duration || 0;

                      return (
                        <Card 
                          key={recording.id} 
                          className="glass-effect hover:shadow-lg transition-all duration-200 border-l-4 border-l-pink-300 hover:border-l-pink-500"
                        >
                          
                          <CardContent className="p-0">
  <div className="p-4">
    {/* Header Section */}
    <div className="flex items-start justify-between mb-3 flex-wrap">
      <div className="flex items-start space-x-3 flex-1">
        <div className="w-12 h-12 bg-white rounded-xl border-2 border-pink-200 flex items-center justify-center shadow-sm flex-shrink-0">
          <span className="text-xl">{categoryInfo.icon}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center flex-wrap gap-2 mb-1">
            <Badge className={`${categoryInfo.color} text-white text-xs font-medium`}>
              {categoryInfo.title}
            </Badge>
            {mainProbability > 0 && (
              <Badge variant="outline" className="text-xs">
                {Math.round(mainProbability * 100)}% {t('history.confidence') || 'confidence'}
              </Badge>
            )}
          </div>

          {/* Baby Info */}
          <div className="flex items-center space-x-1 mb-2">
            <span className="text-sm font-medium text-pink-600">👶</span>
            <span className="text-sm font-medium text-gray-700">{babyName}</span>
          </div>

          {/* Time and Duration Info */}
          <div className="flex items-center space-x-4 text-xs text-gray-500 flex-wrap mb-2">
            <div className="flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>{formatTime(recording.recordedAt)}</span>
            </div>
            <span>{formatDate(recording.recordedAt)}</span>
            {recording.duration && (
              <span className="px-2 py-0.5 bg-gray-100 rounded-full">
                {recording.duration}s
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Audio + Play Button */}
      <div className="flex flex-row items-center w-full sm:w-auto mt-2 sm:mt-0 sm:flex-grow sm:max-w-[600px]">
        <div className="flex flex-col flex-1 min-w-0">
          {/* Audio Waveform Visualization */}
          <div className="mb-2 w-full">
            <div className="flex items-end justify-center space-x-0.5 h-8 bg-gray-50 rounded-lg p-2 w-full">
              {Array.from({ length: 32 }).map((_, i) => {
                const height = Math.random() * 16 + 4;
                const isActive = playingId === recording.id;
                return (
                  <div
                    key={i}
                    className={`rounded-sm transition-all duration-200 ${
                      isActive 
                        ? 'bg-gradient-to-t from-pink-500 to-pink-300' 
                        : 'bg-gradient-to-t from-gray-300 to-gray-200'
                    }`}
                    style={{
                      width: '3px',
                      height: `${height}px`,
                      opacity: isActive ? 0.9 : 0.6,
                      transform: isActive ? 'scaleY(1.1)' : 'scaleY(1)',
                    }}
                  />
                );
              })}
            </div>
          </div>

          {/* Progress Bar */}
          <div 
            className="w-full h-3 bg-gray-200 rounded-full overflow-hidden cursor-pointer"
            onMouseDown={(e) => {
              setIsDragging(true);
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              const percentage = Math.max(0, Math.min(1, clickX / rect.width));
              const effectiveDuration = recording.duration || 0;
              const seekTime = percentage * effectiveDuration;
              if (!isNaN(seekTime) && isFinite(seekTime) && seekTime >= 0) {
                const audio = audioElements[recording.id];
                if (audio) {
                  audio.currentTime = seekTime;
                  setAudioCurrentTimes((prev) => ({ ...prev, [recording.id]: seekTime }));
                }
              }
            }}
            onMouseMove={(e) => {
              if (isDragging) {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const percentage = Math.max(0, Math.min(1, clickX / rect.width));
                const effectiveDuration = recording.duration || 0;
                const seekTime = percentage * effectiveDuration;
                if (!isNaN(seekTime) && isFinite(seekTime) && seekTime >= 0) {
                  const audio = audioElements[recording.id];
                  if (audio) {
                    audio.currentTime = seekTime;
                    setAudioCurrentTimes((prev) => ({ ...prev, [recording.id]: seekTime }));
                  }
                }
              }
            }}
            onMouseUp={() => setIsDragging(false)}
            onMouseLeave={() => setIsDragging(false)}
          >
            <div 
              className="h-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-100 rounded-full"
              style={{ width: `${Math.max(2, progressPercentage)}%` }}
            />
          </div>
        </div>

        {/* Play Button */}
        <Button
          variant="ghost"
          size="sm"
          className={`rounded-full w-10 h-10 ml-2 sm:ml-4 transition-all ${
            playingId === recording.id 
              ? 'bg-pink-500 text-white hover:bg-pink-600 shadow-lg' 
              : 'text-pink-500 hover:bg-pink-50 border border-pink-200'
          }`}
          onClick={(e) => {
            e.stopPropagation();
            handlePlayPause(recording);
          }}
        >
          {playingId === recording.id ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4" />
          )}
        </Button>
      </div>
    </div>

    {/* Action Buttons */}
    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleRecordingClick(recording.id)}
        className="text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-50"
      >
        <BarChart3 className="w-3 h-3 mr-1" />
        {t('history.viewAnalysis') || 'View Analysis'}
      </Button>

      {recording.rateState && (
        <div className="flex items-center space-x-1">
          {recording.rateState === 'good' ? (
            <Badge variant="outline" className="text-xs text-green-600 border-green-200">
              👍 {t('history.helpful') || 'Helpful'}
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs text-orange-600 border-orange-200">
              👎 {t('history.notHelpful') || 'Not Helpful'}
            </Badge>
          )}
        </div>
      )}
    </div>
  </div>
</CardContent>


                          


                          

                        </Card>
                      );
                    })}
                </div>
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