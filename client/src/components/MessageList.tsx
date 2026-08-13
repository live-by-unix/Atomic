import { useEffect, useRef } from 'react';
import { useChatStore } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';
import './MessageList.css';

export default function MessageList() {
  const messages = useChatStore((state) => state.messages);
  const currentChannel = useChatStore((state) => state.currentChannel);
  const currentUser = useAuthStore((state) => state.user);
  const setMessages = useChatStore((state) => state.setMessages);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentChannel) {
      loadMessages();
    }
  }, [currentChannel]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    if (!currentChannel) return;
    
    try {
      const response = await api.channels.getMessages(currentChannel.id);
      if (response.success && response.data) {
        setMessages(response.data);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (!currentChannel) {
    return (
      <div className="message-list empty">
        <div className="empty-state">
          <h2>Welcome to Atomic Chat</h2>
          <p>Select a channel to start chatting</p>
        </div>
      </div>
    );
  }

  return (
    <div className="message-list">
      <div className="messages-header">
        <h3>{currentChannel.name}</h3>
        {currentChannel.description && <p>{currentChannel.description}</p>}
      </div>
      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="empty-state">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`message ${message.userId === currentUser?.id ? 'own' : 'other'}`}
            >
              <div className="message-header">
                <span className="message-author">
                  {message.userId === currentUser?.id ? 'You' : 'Unknown'}
                </span>
                <span className="message-time">
                  {new Date(message.createdAt).toLocaleTimeString()}
                </span>
                {message.edited && <span className="edited-badge">(edited)</span>}
              </div>
              {message.type === 'voicemail' && message.voicemailId ? (
                <div className="voicemail-placeholder">Voicemail message</div>
              ) : (
                <div className="message-content">{message.content}</div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
