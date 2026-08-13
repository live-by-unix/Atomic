import { useState, useRef, useEffect } from 'react';
import { useChatStore } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';
import VoicemailRecorder from './VoicemailRecorder';
import './MessageInput.css';

export default function MessageInput() {
  const [content, setContent] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const currentChannel = useChatStore((state) => state.currentChannel);
  const addMessage = useChatStore((state) => state.addMessage);
  const currentUser = useAuthStore((state) => state.user);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (inputRef.current && !isRecording) {
      inputRef.current.focus();
    }
  }, [currentChannel, isRecording]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim() || !currentChannel || !currentUser) return;

    try {
      const response = await api.messages.send({
        channelId: currentChannel.id,
        content: content.trim(),
        type: 'text',
      });

      if (response.success && response.data) {
        addMessage(response.data);
        setContent('');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleVoicemailUpload = async (file: File, duration: number) => {
    if (!currentChannel) return;

    try {
      const response = await api.voicemail.upload(file, currentChannel.id, duration);
      
      if (response.success && response.data) {
        // The voicemail will be broadcast via WebSocket
        setIsRecording(false);
      }
    } catch (error) {
      console.error('Failed to upload voicemail:', error);
    }
  };

  if (!currentChannel) {
    return null;
  }

  return (
    <div className="message-input">
      {isRecording ? (
        <VoicemailRecorder
          onCancel={() => setIsRecording(false)}
          onComplete={handleVoicemailUpload}
        />
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="input-wrapper">
            <textarea
              ref={inputRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              rows={1}
            />
            <button
              type="button"
              className="voicemail-button"
              onClick={() => setIsRecording(true)}
              title="Record voicemail"
            >
              🎤
            </button>
            <button
              type="submit"
              disabled={!content.trim()}
              className="send-button"
            >
              Send
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
