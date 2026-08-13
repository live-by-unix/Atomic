import { useState, useRef } from 'react';
import { Voicemail } from '@atomic-chat/shared';
import { api } from '../services/api';
import './VoicemailPlayer.css';

interface VoicemailPlayerProps {
  voicemail: Voicemail;
}

export default function VoicemailPlayer({ voicemail }: VoicemailPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(voicemail.duration);
  const audioRef = useRef<HTMLAudioElement>(null);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const audioUrl = api.voicemail.getUrl(voicemail.filename);

  return (
    <div className="voicemail-player">
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      />
      <button className="play-button" onClick={togglePlay}>
        {isPlaying ? '⏸' : '▶'}
      </button>
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${(currentTime / duration) * 100}%` }}
        />
      </div>
      <span className="time-display">
        {formatTime(currentTime)} / {formatTime(duration)}
      </span>
    </div>
  );
}
