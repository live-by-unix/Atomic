import { useState, useRef, useEffect } from 'react';
import './VoicemailRecorder.css';

interface VoicemailRecorderProps {
  onCancel: () => void;
  onComplete: (file: File, duration: number) => void;
}

export default function VoicemailRecorder({ onCancel, onComplete }: VoicemailRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const file = new File([blob], `voicemail-${Date.now()}.webm`, { type: 'audio/webm' });
        onComplete(file, duration);
        
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setIsPaused(false);

      timerRef.current = window.setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      timerRef.current = window.setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      const stream = mediaRecorderRef.current.stream;
      stream.getTracks().forEach(track => track.stop());
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setDuration(0);
    setIsRecording(false);
    setIsPaused(false);
    onCancel();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="voicemail-recorder">
      <div className="recorder-display">
        <div className="recording-indicator">
          {isRecording && <span className="pulse">●</span>}
          <span className="duration">{formatTime(duration)}</span>
        </div>
      </div>
      <div className="recorder-controls">
        {!isRecording ? (
          <>
            <button onClick={startRecording} className="record-button">
              Start Recording
            </button>
            <button onClick={onCancel} className="cancel-button">
              Cancel
            </button>
          </>
        ) : (
          <>
            {!isPaused ? (
              <button onClick={pauseRecording} className="pause-button">
                Pause
              </button>
            ) : (
              <button onClick={resumeRecording} className="resume-button">
                Resume
              </button>
            )}
            <button onClick={stopRecording} className="stop-button">
              Send
            </button>
            <button onClick={cancelRecording} className="cancel-button">
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  );
}
