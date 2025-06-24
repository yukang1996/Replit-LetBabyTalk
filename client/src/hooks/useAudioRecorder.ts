
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

      // Check for WAV support, fallback to webm then mp4
      let mimeType = 'audio/wav';
      if (!MediaRecorder.isTypeSupported('audio/wav')) {
        if (MediaRecorder.isTypeSupported('audio/webm')) {
          mimeType = 'audio/webm';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        }
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType
      });

      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { 
          type: mimeType 
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
    if (audioBlob) {
      // If audio is already loaded and paused, just resume
      if (audioRef.current && !isPlaying) {
        audioRef.current.play().catch(error => {
          console.error('Audio resume failed:', error);
        });
        setIsPlaying(true);
        
        // Restart tracking playback time
        playbackTimerRef.current = setInterval(() => {
          if (audioRef.current && !isNaN(audioRef.current.currentTime)) {
            setCurrentPlaybackTime(audioRef.current.currentTime);
          }
        }, 100);
        return;
      }

      // Create new audio instance if not exists
      if (!audioRef.current) {
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
        
        audio.onpause = () => {
          setIsPlaying(false);
          if (playbackTimerRef.current) {
            clearInterval(playbackTimerRef.current);
            playbackTimerRef.current = null;
          }
        };
        
        audio.onended = () => {
          setIsPlaying(false);
          setCurrentPlaybackTime(0);
          if (playbackTimerRef.current) {
            clearInterval(playbackTimerRef.current);
            playbackTimerRef.current = null;
          }
          // Reset to beginning for next play
          audio.currentTime = 0;
        };

        audio.onerror = () => {
          console.error('Audio playback error');
          setIsPlaying(false);
          setCurrentPlaybackTime(0);
          if (playbackTimerRef.current) {
            clearInterval(playbackTimerRef.current);
            playbackTimerRef.current = null;
          }
        };

        audioRef.current = audio;
        
        // Set fallback duration immediately
        if (audioDuration === 0 || isNaN(audioDuration)) {
          setAudioDuration(recordingTime);
        }
        
        // Set to current playback position if resuming
        if (currentPlaybackTime > 0) {
          audio.currentTime = currentPlaybackTime;
        }
      }
      
      audioRef.current.play().catch(error => {
        console.error('Audio play failed:', error);
        setIsPlaying(false);
      });
      
      setIsPlaying(true);
      
      // Start tracking playback time
      playbackTimerRef.current = setInterval(() => {
        if (audioRef.current && !isNaN(audioRef.current.currentTime)) {
          setCurrentPlaybackTime(audioRef.current.currentTime);
        }
      }, 100);
    }
  }, [audioBlob, isPlaying, recordingTime, audioDuration, currentPlaybackTime]);

  const pausePlayback = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      if (playbackTimerRef.current) {
        clearInterval(playbackTimerRef.current);
        playbackTimerRef.current = null;
      }
    }
  }, []);

  const stopPlayback = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setCurrentPlaybackTime(0);
      if (playbackTimerRef.current) {
        clearInterval(playbackTimerRef.current);
        playbackTimerRef.current = null;
      }
    }
  }, []);

  const seekTo = useCallback((time: number) => {
    const effectiveDuration = (audioDuration && !isNaN(audioDuration)) ? audioDuration : recordingTime;
    if (effectiveDuration > 0 && !isNaN(time)) {
      const safeTime = Math.max(0, Math.min(time, effectiveDuration));
      if (isFinite(safeTime)) {
        setCurrentPlaybackTime(safeTime);
        if (audioRef.current) {
          audioRef.current.currentTime = safeTime;
        }
      }
    }
  }, [audioDuration, recordingTime]);

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
    pausePlayback,
    stopPlayback,
    seekTo,
    deleteRecording,
  };
}
