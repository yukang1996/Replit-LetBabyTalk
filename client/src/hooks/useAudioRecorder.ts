
import { useState, useRef, useCallback } from "react";

export function useAudioRecorder() {
  // All state hooks first
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPlaybackTime, setCurrentPlaybackTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);

  // All refs after state
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const autoStopRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playbackTimerRef = useRef<NodeJS.Timeout | null>(null);

  const startTimer = useCallback(() => {
    timerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        }
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { 
          type: 'audio/webm;codecs=opus' 
        });
        setAudioBlob(audioBlob);
        setIsRecording(false);
        setIsPaused(false);
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
        
        // Clear timers
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        if (autoStopRef.current) {
          clearTimeout(autoStopRef.current);
          autoStopRef.current = null;
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000); // Collect data every second
      
      setIsRecording(true);
      setIsPaused(false);
      setRecordingTime(0);
      setAudioBlob(null);
      startTimer();
      
      // Auto-stop after 30 seconds
      autoStopRef.current = setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
      }, 30000);
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  }, [startTimer]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && (mediaRecorderRef.current.state === 'recording' || mediaRecorderRef.current.state === 'paused')) {
      mediaRecorderRef.current.stop();
      
      // Clear auto-stop timer if manually stopped
      if (autoStopRef.current) {
        clearTimeout(autoStopRef.current);
        autoStopRef.current = null;
      }
    }
  }, []);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      stopTimer();
      
      // Pause auto-stop timer
      if (autoStopRef.current) {
        clearTimeout(autoStopRef.current);
        autoStopRef.current = null;
      }
    }
  }, [stopTimer]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      startTimer();
      
      // Resume auto-stop timer with remaining time
      const remainingTime = 30000 - (recordingTime * 1000);
      if (remainingTime > 0) {
        autoStopRef.current = setTimeout(() => {
          if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
          }
        }, remainingTime);
      }
    }
  }, [startTimer, recordingTime]);

  const playRecording = useCallback(() => {
    if (audioBlob && !isPlaying) {
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      audio.onloadedmetadata = () => {
        console.log('Audio duration loaded:', audio.duration);
        if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
          setAudioDuration(audio.duration);
        } else {
          // Fallback to recorded time if duration is invalid
          setAudioDuration(recordingTime);
        }
      };

      audio.onloadeddata = () => {
        // Additional check when audio data is loaded
        if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
          setAudioDuration(audio.duration);
        } else {
          setAudioDuration(recordingTime);
        }
      };

      audio.ontimeupdate = () => {
        if (audio.currentTime && !isNaN(audio.currentTime)) {
          setCurrentPlaybackTime(audio.currentTime);
        }
      };
      
      audio.onended = () => {
        setIsPlaying(false);
        setCurrentPlaybackTime(0);
        if (playbackTimerRef.current) {
          clearInterval(playbackTimerRef.current);
          playbackTimerRef.current = null;
        }
        URL.revokeObjectURL(audioUrl);
      };

      audio.onerror = () => {
        console.error('Audio playback error');
        setIsPlaying(false);
        setCurrentPlaybackTime(0);
        if (playbackTimerRef.current) {
          clearInterval(playbackTimerRef.current);
          playbackTimerRef.current = null;
        }
        URL.revokeObjectURL(audioUrl);
      };

      audioRef.current = audio;
      
      // Set fallback duration immediately
      if (audioDuration === 0 || isNaN(audioDuration)) {
        setAudioDuration(recordingTime);
      }
      
      audio.play().catch(error => {
        console.error('Audio play failed:', error);
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      });
      
      setIsPlaying(true);
      
      // Start tracking playback time
      playbackTimerRef.current = setInterval(() => {
        if (audioRef.current && !isNaN(audioRef.current.currentTime)) {
          setCurrentPlaybackTime(audioRef.current.currentTime);
        }
      }, 100);
    }
  }, [audioBlob, isPlaying, recordingTime, audioDuration]);

  const stopPlayback = useCallback(() => {
    if (audioRef.current && isPlaying) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setCurrentPlaybackTime(0);
      if (playbackTimerRef.current) {
        clearInterval(playbackTimerRef.current);
        playbackTimerRef.current = null;
      }
    }
  }, [isPlaying]);

  const seekTo = useCallback((time: number) => {
    if (audioRef.current && audioDuration > 0 && !isNaN(audioDuration) && !isNaN(time)) {
      const safeTime = Math.max(0, Math.min(time, audioDuration));
      if (isFinite(safeTime)) {
        audioRef.current.currentTime = safeTime;
        setCurrentPlaybackTime(safeTime);
      }
    }
  }, [audioDuration]);

  const deleteRecording = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (playbackTimerRef.current) {
      clearInterval(playbackTimerRef.current);
      playbackTimerRef.current = null;
    }
    setAudioBlob(null);
    setIsPlaying(false);
    setCurrentPlaybackTime(0);
    setAudioDuration(0);
    setRecordingTime(0);
  }, []);

  return {
    isRecording,
    isPaused,
    recordingTime,
    audioBlob,
    isPlaying,
    currentPlaybackTime,
    audioDuration,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    playRecording,
    stopPlayback,
    seekTo,
    deleteRecording,
  };
}
